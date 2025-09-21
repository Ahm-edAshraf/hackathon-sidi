"use client";

import { toast } from "sonner";

type FetchOptions = RequestInit & { skipErrorToast?: boolean };

type Transaction = {
  id?: string;
  vendor?: string;
  description?: string;
  amount?: number;
  total?: number;
  category?: string;
  date?: string;
  timestamp?: string;
  [key: string]: unknown;
};

type SummaryResponse = {
  summary?: string;
  transactions?: Transaction[];
  [key: string]: unknown;
};

type PredictionResponse = {
  predicted_inflow?: number;
  predicted_outflow?: number;
  net?: number;
  period?: string;
  details?: Array<{ label: string; value: number | string }>;
  predicted_next_7_days?: number;
  last_7_days_total?: number;
  transaction_count?: number;
  [key: string]: unknown;
};

type TransactionStats = {
  total_transactions?: number;
  total_amount?: number;
  biggest_vendor?: string;
  generated_at?: string;
  [key: string]: unknown;
};

type TransactionsApiPayload = {
  status?: string;
  summary?: string;
  stats?: TransactionStats;
  summaryKey?: string;
  transactions?: Transaction[];
  [key: string]: unknown;
};

type NormalizedTransactionsResponse = {
  transactions: Transaction[];
  stats: TransactionStats | null;
  summary: string | null;
  summaryKey: string | null;
  raw: TransactionsApiPayload | Transaction[] | null;
};

type SummaryApiPayload = {
  status?: string;
  ai_summary?: string;
  summary?: string;
  summary_s3_key?: string;
  summaryKey?: string;
  transactions?: Transaction[];
  [key: string]: unknown;
};

type NormalizedSummaryResponse = {
  summary: string | null;
  summaryKey: string | null;
  transactions: Transaction[];
  raw: SummaryApiPayload | null;
};

type PredictionApiPayload = {
  status?: string;
  prediction?: PredictionResponse;
  [key: string]: unknown;
};

type UploadUrlResponse = {
  status?: string;
  uploadUrl?: string;
  url?: string;
  key?: string;
  [key: string]: unknown;
};

type UploadUrlResult = {
  uploadUrl: string;
  key: string | null;
  raw: UploadUrlResponse | null;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://3wyun38ak3.execute-api.us-east-1.amazonaws.com/dev";

async function apiFetch<T>(path: string, options: FetchOptions = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...(options as RequestInit),
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      const message = errorText || response.statusText;
      if (!options.skipErrorToast) {
        toast.error(`API error (${response.status})`, {
          description: message,
        });
      }
      throw new Error(message);
    }

    if (response.status === 204) {
      return null as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (!options.skipErrorToast) {
      toast.error("Network error", {
        description:
          error instanceof Error ? error.message : "Failed to reach backend.",
      });
    }
    throw error;
  }
}

export async function requestUploadUrl(
  filename: string,
  contentType?: string
): Promise<UploadUrlResult> {
  const response = await apiFetch<UploadUrlResponse>(
    "/upload-url",
    {
      method: "POST",
      body: JSON.stringify({ filename, contentType }),
    }
  );

  const uploadUrl = response?.uploadUrl ?? response?.url;

  if (!uploadUrl) {
    throw new Error("Upload URL missing from backend response");
  }

  return {
    uploadUrl,
    key: typeof response?.key === "string" ? response.key : null,
    raw: response ?? null,
  };
}

export async function uploadFileToPresignedUrl(url: string, file: File) {
  await fetch(url, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
  });
}

export async function listTransactions(): Promise<NormalizedTransactionsResponse> {
  const response = await apiFetch<TransactionsApiPayload | Transaction[]>(
    "/transactions",
    {
      method: "GET",
    }
  );

  if (Array.isArray(response)) {
    return {
      transactions: response,
      stats: null,
      summary: null,
      summaryKey: null,
      raw: response,
    };
  }

  const normalizedTransactions = Array.isArray(response?.transactions)
    ? response.transactions
    : [];

  return {
    transactions: normalizedTransactions,
    stats: response?.stats ?? null,
    summary: typeof response?.summary === "string" ? response.summary : null,
    summaryKey:
      typeof response?.summaryKey === "string" ? response.summaryKey : null,
    raw: response ?? null,
  };
}

export async function fetchSummary(limit?: number): Promise<NormalizedSummaryResponse> {
  const query = typeof limit === "number" ? `?limit=${limit}` : "";
  const response = await apiFetch<SummaryApiPayload>(`/summary${query}`, {
    method: "GET",
  });

  const summaryText =
    typeof response?.ai_summary === "string"
      ? response.ai_summary
      : typeof response?.summary === "string"
      ? response.summary
      : null;

  return {
    summary: summaryText,
    summaryKey:
      typeof response?.summary_s3_key === "string"
        ? response.summary_s3_key
        : typeof response?.summaryKey === "string"
        ? response.summaryKey
        : null,
    transactions: Array.isArray(response?.transactions)
      ? response.transactions
      : [],
    raw: response ?? null,
  };
}

export async function fetchPrediction(
  transactions?: Transaction[]
): Promise<PredictionResponse | null> {
  const response = await apiFetch<PredictionResponse | PredictionApiPayload>(
    "/predict",
    {
      method: "POST",
      body: JSON.stringify({
        transactions,
      }),
    }
  );

  if (response && "prediction" in response) {
    const payload = response as PredictionApiPayload;
    return payload.prediction ?? null;
  }

  return response ?? null;
}

export type {
  Transaction,
  SummaryResponse,
  PredictionResponse,
  TransactionStats,
  NormalizedTransactionsResponse,
  NormalizedSummaryResponse,
  UploadUrlResponse,
  UploadUrlResult,
};
export { API_BASE_URL };
