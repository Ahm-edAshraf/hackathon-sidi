"""AWS Lambda: OCR summary + transactions endpoint.

This handler reads parsed transactions from DynamoDB, computes roll-up
statistics, persists a human-readable summary to S3, and returns both the
summary metadata and the raw transactions to the caller. It replaces the
previous implementation that only surfaced stats, enabling the frontend to
hydrate tables and charts without additional round-trips.
"""

from __future__ import annotations

import json
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, Iterable, List, Optional

import boto3


dynamodb = boto3.resource("dynamodb")
s3 = boto3.client("s3")

BUCKET_NAME = "acct-ai-uploads-https"
SUMMARY_PREFIX = "summaries/"
TABLE_NAME = "transactions"

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS,GET,POST",
}

table = dynamodb.Table(TABLE_NAME)


def decimal_to_float(value: Decimal) -> float:
    """Safely convert Decimal values for JSON serialization."""

    if isinstance(value, Decimal):
        return float(value)
    return float(Decimal(str(value)))


def normalize_item(item: Dict[str, Any]) -> Dict[str, Any]:
    normalized: Dict[str, Any] = {}
    for key, value in item.items():
        if isinstance(value, Decimal):
            normalized[key] = decimal_to_float(value)
        else:
            normalized[key] = value
    return normalized


def serialize_transactions(items: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [normalize_item(item) for item in items]


def scan_all_transactions() -> List[Dict[str, Any]]:
    """Read the full transactions table, following DynamoDB pagination."""

    items: List[Dict[str, Any]] = []
    response = table.scan()
    items.extend(response.get("Items", []))

    while "LastEvaluatedKey" in response:
        response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
        items.extend(response.get("Items", []))

    return items


def compute_stats(items: List[Dict[str, Any]]) -> Dict[str, Any]:
    total_amount = Decimal("0")
    vendor_totals: Dict[str, Decimal] = {}

    for item in items:
        amount = item.get("amount", Decimal("0"))
        if not isinstance(amount, Decimal):
            amount = Decimal(str(amount))

        total_amount += amount

        vendor = item.get("vendor", "Unknown")
        vendor_totals[vendor] = vendor_totals.get(vendor, Decimal("0")) + amount

    total_transactions = len(items)
    biggest_vendor = max(vendor_totals, key=vendor_totals.get) if vendor_totals else None

    return {
        "total_transactions": total_transactions,
        "total_amount": decimal_to_float(total_amount),
        "biggest_vendor": biggest_vendor,
        "generated_at": datetime.utcnow().isoformat(),
    }


def build_summary(stats: Dict[str, Any]) -> Dict[str, Any]:
    total_transactions = stats["total_transactions"]
    total_amount = stats["total_amount"]
    biggest_vendor = stats["biggest_vendor"]

    summary_text = (
        f"{total_transactions} transactions captured. "
        f"Top vendor: {biggest_vendor or 'N/A'}. "
        f"Total spend: ${total_amount:,.2f}."
    )

    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    summary_key = f"{SUMMARY_PREFIX}summary-{timestamp}.json"
    s3.put_object(
        Bucket=BUCKET_NAME,
        Key=summary_key,
        Body=json.dumps({"summary": summary_text, "stats": stats}),
        ContentType="application/json",
    )

    return {
        "status": "success",
        "summary": summary_text,
        "stats": stats,
        "summaryKey": summary_key,
    }


def apply_limit(
    transactions: List[Dict[str, Any]],
    limit: Optional[int],
) -> List[Dict[str, Any]]:
    if limit is None or limit <= 0:
        return transactions
    return transactions[:limit]


def empty_payload() -> Dict[str, Any]:
    empty_stats = {
        "total_transactions": 0,
        "total_amount": 0.0,
        "biggest_vendor": None,
        "generated_at": datetime.utcnow().isoformat(),
    }
    return {
        "status": "no_data",
        "summary": "No transactions yet.",
        "stats": empty_stats,
        "summaryKey": None,
        "transactions": [],
    }


def lambda_handler(event, context):  # type: ignore[override]
    try:
        method = event.get("httpMethod")
        if method == "OPTIONS":
            return {
                "statusCode": 204,
                "headers": CORS_HEADERS,
                "body": "",
            }

        path = event.get("resource") or event.get("path", "")
        query_params = event.get("queryStringParameters") or {}
        limit = query_params.get("limit")
        limit_value: Optional[int] = None
        if isinstance(limit, str) and limit.isdigit():
            limit_value = int(limit)

        raw_items = scan_all_transactions()

        if not raw_items:
            return {
                "statusCode": 200,
                "headers": CORS_HEADERS,
                "body": json.dumps(empty_payload()),
            }

        serialized_transactions = serialize_transactions(raw_items)
        stats = compute_stats(raw_items)
        summary_payload = build_summary(stats)

        body = {
            **summary_payload,
            "transactions": apply_limit(serialized_transactions, limit_value),
        }

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps(body),
        }

    except Exception as exc:  # pragma: no cover - surface errors to caller
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({"status": "error", "message": str(exc)}),
        }
