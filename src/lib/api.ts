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
  [key: string]: unknown;
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

export async function requestUploadUrl(filename: string, contentType?: string) {
  const response = await apiFetch<{ status?: string; uploadUrl?: string; url?: string }>(
    "/upload-url",
    {
      method: "POST",
      body: JSON.stringify({ filename, contentType }),
    }
  );

  if (response?.uploadUrl) {
    return response.uploadUrl;
  }

  if (response?.url) {
    return response.url;
  }

  throw new Error("Upload URL missing from backend response");
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

export async function listTransactions() {
  return apiFetch<Transaction[]>("/transactions", {
    method: "GET",
  });
}

export async function fetchSummary(limit?: number) {
  const query = typeof limit === "number" ? `?limit=${limit}` : "";
  return apiFetch<SummaryResponse>(`/summary${query}`, {
    method: "GET",
  });
}

export async function fetchPrediction(transactions?: Transaction[]) {
  return apiFetch<PredictionResponse>("/predict", {
    method: "POST",
    body: JSON.stringify({
      transactions,
    }),
  });
}

export type { Transaction, SummaryResponse, PredictionResponse };
export { API_BASE_URL };
