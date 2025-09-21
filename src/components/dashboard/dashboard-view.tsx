"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  CloudUpload,
  DownloadCloud,
  FileText,
  Gauge,
  Layers,
  ListChecks,
  PieChart,
  PlayCircle,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  fetchPrediction,
  fetchSummary,
  listTransactions,
  requestUploadUrl,
  uploadFileToPresignedUrl,
  type PredictionResponse,
  type Transaction,
  type TransactionStats,
} from "@/lib/api";

const chartConfig = {
  inflow: {
    label: "Cash inflow",
    color: "oklch(0.58 0.12 255 / 0.85)",
  },
  outflow: {
    label: "Cash outflow",
    color: "oklch(0.74 0.14 20 / 0.7)",
  },
} as const;

const UPLOADS_STORAGE_KEY = "dashboard.uploads";

type UploadStatus = "processing" | "synced" | "failed";

type UploadItem = {
  id: string;
  name: string;
  size: string;
  status: UploadStatus;
  uploadedAt: string;
  storageKey: string | null;
};

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function formatCurrency(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatRelativeTime(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, "day");
}

function getTransactionAmount(transaction: Transaction) {
  const amount = transaction.amount ?? transaction.total;
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return null;
  }
  return amount;
}

function buildChartData(transactions: Transaction[]) {
  const buckets = new Map<string, { inflow: number; outflow: number }>();

  transactions.forEach((transaction) => {
    const amount = getTransactionAmount(transaction);
    if (amount === null) return;

    const dateValue = transaction.date ?? transaction.timestamp;
    if (!dateValue) return;

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;

    const bucket = buckets.get(key) ?? { inflow: 0, outflow: 0 };
    if (amount >= 0) {
      bucket.outflow += amount;
    } else {
      bucket.inflow += Math.abs(amount);
    }
    buckets.set(key, bucket);
  });

  return Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => {
      const [year, month] = key.split("-").map((part) => Number(part));
      const labelDate = new Date(year, month - 1);
      return {
        month: labelDate.toLocaleString("en-US", {
          month: "short",
          year: "numeric",
        }),
        inflow: Number(value.inflow.toFixed(2)),
        outflow: Number(value.outflow.toFixed(2)),
      };
    });
}

function isValidUpload(candidate: unknown): candidate is UploadItem {
  if (!candidate || typeof candidate !== "object") return false;
  const value = candidate as Partial<UploadItem>;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.size === "string" &&
    typeof value.status === "string" &&
    typeof value.uploadedAt === "string"
  );
}

function wait(durationMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), durationMs);
  });
}

export function DashboardView() {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const uploadsHydratedRef = React.useRef(false);
  const [uploads, setUploads] = React.useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = React.useState(false);
  const [transactionStats, setTransactionStats] =
    React.useState<TransactionStats | null>(null);
  const [transactionsSummary, setTransactionsSummary] =
    React.useState<string | null>(null);

  const [summary, setSummary] = React.useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = React.useState(false);

  const [prediction, setPrediction] = React.useState<PredictionResponse | null>(null);
  const [predictionLoading, setPredictionLoading] = React.useState(false);

  const chartData = React.useMemo(
    () => buildChartData(transactions),
    [transactions]
  );

  const metrics = React.useMemo(
    () => {
      const totalTransactions =
        typeof transactionStats?.total_transactions === "number"
          ? transactionStats.total_transactions
          : 0;

      const totalAmount =
        typeof transactionStats?.total_amount === "number"
          ? transactionStats.total_amount
          : null;

      const predictionValue =
        typeof prediction?.predicted_next_7_days === "number"
          ? prediction.predicted_next_7_days
          : typeof prediction?.predicted_inflow === "number"
          ? prediction.predicted_inflow
          : null;

      const lastSeven =
        typeof prediction?.last_7_days_total === "number"
          ? prediction.last_7_days_total
          : null;

      const updatedAt = transactionStats?.generated_at
        ? formatRelativeTime(transactionStats.generated_at)
        : null;

      const summarySnippet = transactionsSummary
        ? transactionsSummary.length > 72
          ? `${transactionsSummary.slice(0, 69)}…`
          : transactionsSummary
        : "Upload data to populate totals";

      return [
        {
          label: "Transactions processed",
          value: totalTransactions.toLocaleString(),
          change: updatedAt ? `Updated ${updatedAt}` : "Awaiting uploads",
          icon: ListChecks,
          trend: totalTransactions > 0 ? "green" : "neutral",
        },
        {
          label: "Total amount",
          value: formatCurrency(totalAmount),
          change: summarySnippet,
          icon: PieChart,
          trend: totalAmount ? "green" : "neutral",
        },
        {
          label: "Top vendor",
          value: transactionStats?.biggest_vendor ?? "-",
          change:
            totalTransactions > 0
              ? `${totalTransactions} transactions tracked`
              : "Upload data to identify vendors",
          icon: Layers,
          trend: transactionStats?.biggest_vendor ? "green" : "neutral",
        },
        {
          label: "Next 7 day forecast",
          value: formatCurrency(predictionValue),
          change:
            predictionValue !== null && lastSeven !== null
              ? `Last 7 days: ${formatCurrency(lastSeven)}`
              : predictionValue !== null
              ? "Forecast ready"
              : "Run forecast after uploads",
          icon: Gauge,
          trend: predictionValue !== null ? "green" : "neutral",
        },
      ];
    },
    [prediction, transactionStats, transactionsSummary]
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem(UPLOADS_STORAGE_KEY);
      if (!stored) return;
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setUploads(
          parsed
            .filter(isValidUpload)
            .map((item) => ({
              ...item,
              status:
                item.status === "synced" || item.status === "failed"
                  ? item.status
                  : "processing",
              storageKey: item.storageKey ?? null,
            }))
        );
      }
    } catch (error) {
      console.warn("Failed to restore uploads from storage", error);
    } finally {
      uploadsHydratedRef.current = true;
    }
  }, []);

  React.useEffect(() => {
    if (!uploadsHydratedRef.current || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        UPLOADS_STORAGE_KEY,
        JSON.stringify(uploads)
      );
    } catch (error) {
      console.warn("Failed to persist uploads to storage", error);
    }
  }, [uploads]);

  const refreshTransactions = React.useCallback(async () => {
    setTransactionsLoading(true);
    try {
      const data = await listTransactions();
      setTransactions(data.transactions);
      setTransactionStats(data.stats);
      setTransactionsSummary(data.summary);
    } catch (error) {
      console.error("Failed to fetch transactions", error);
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  const refreshSummary = React.useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await fetchSummary();
      if (data.summary) {
        setSummary(data.summary);
      }
      if (data.transactions.length) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error("Failed to fetch summary", error);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const refreshPrediction = React.useCallback(
    async (sourceTransactions?: Transaction[]) => {
      setPredictionLoading(true);
      try {
        const data = await fetchPrediction(
          sourceTransactions && sourceTransactions.length
            ? sourceTransactions.slice(0, 50)
          : undefined
        );
        setPrediction(data ?? null);
      } catch (error) {
        console.error("Failed to fetch prediction", error);
      } finally {
        setPredictionLoading(false);
      }
    },
    []
  );

  React.useEffect(() => {
    refreshTransactions();
    refreshSummary();
  }, [refreshTransactions, refreshSummary]);

  React.useEffect(() => {
    if (transactions.length) {
      refreshPrediction(transactions);
    }
  }, [transactions, refreshPrediction]);

  async function handleFileQueue(files: FileList | null) {
    if (!files || !files.length) return;

    const fileArray = Array.from(files);
    const stagedItems: UploadItem[] = fileArray.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: formatBytes(file.size),
      status: "processing" as UploadStatus,
      uploadedAt: new Date().toISOString(),
      storageKey: null,
    }));

    setUploads((prev) => [...stagedItems, ...prev]);
    setIsUploading(true);

    await Promise.all(
      stagedItems.map(async (item, index) => {
        const file = fileArray[index];
        try {
          const { uploadUrl, key } = await requestUploadUrl(
            file.name,
            file.type || "application/octet-stream"
          );
          await uploadFileToPresignedUrl(uploadUrl, file);
          setUploads((prev) =>
            prev.map((upload) =>
              upload.id === item.id
                ? {
                    ...upload,
                    status: "synced" as UploadStatus,
                    uploadedAt: new Date().toISOString(),
                    storageKey: key ?? upload.storageKey,
                  }
                : upload
            )
          );
          toast.success("Upload complete", {
            description: `${file.name} uploaded and queued for processing`,
          });
        } catch (error) {
          console.error("Upload failed", error);
          toast.error("Upload failed", {
            description: `${file.name} could not be uploaded`,
          });
          setUploads((prev) =>
            prev.map((upload) =>
              upload.id === item.id
                ? { ...upload, status: "failed" as UploadStatus }
                : upload
            )
          );
        }
      })
    );

    setIsUploading(false);

    await wait(1500);
    await refreshTransactions();
    await refreshSummary();
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    void handleFileQueue(event.dataTransfer.files);
  }

  const displaySummaryTitle = summary
    ? "Latest insight"
    : "Summary will appear after processing";
  const displaySummaryBody =
    summary ??
    transactionsSummary ??
    "Upload a financial statement to generate an AI summary.";

  const transactionsToShow: Transaction[] = transactions.slice(0, 6);
  const hasUploads = uploads.length > 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-4 border-b border-border/60 pb-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Badge className="rounded-full bg-primary/10 text-primary">
            Live AWS data
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Finance control center
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Upload statements, trigger OCR, and review summaries pulled from your AWS Lambdas.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() =>
              toast("Share link", {
                description: "Invite teammates once RBAC is wired.",
              })
            }
          >
            <DownloadCloud className="mr-2 size-4" />
            Export snapshot
          </Button>
          <Button className="rounded-full bg-gradient-to-r from-primary to-primary/80">
            <ArrowUpRight className="mr-2 size-4" />
            Generate investor pack
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border border-border/60 bg-background/70">
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div className="space-y-2">
                <p className="text-xs uppercase text-muted-foreground">
                  {metric.label}
                </p>
                <p className="text-2xl font-semibold">{metric.value}</p>
                <span
                  className={cn(
                    "text-xs font-medium",
                    metric.trend === "green" && "text-emerald-500",
                    metric.trend === "neutral" && "text-muted-foreground"
                  )}
                >
                  {metric.change}
                </span>
              </div>
              <metric.icon className="size-10 rounded-xl bg-secondary/60 p-2 text-primary" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="mt-10">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Transactions</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <Card className="border border-border/60 bg-background/70">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <PieChart className="size-4 text-primary" />
                  Cash trend
                </CardTitle>
                <CardDescription>
                  Groups uploaded transactions by month. Inflows are shown against outgoing spend.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length ? (
                  <ChartContainer className="h-64 w-full" config={chartConfig}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="area-inflow" x1="0" x2="0" y1="0" y2="1">
                          <stop
                            offset="10%"
                            stopColor="oklch(0.58 0.12 255)"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="95%"
                            stopColor="oklch(0.58 0.12 255)"
                            stopOpacity={0.05}
                          />
                        </linearGradient>
                        <linearGradient
                          id="area-outflow"
                          x1="0"
                          x2="0"
                          y1="0"
                          y2="1"
                        >
                          <stop
                            offset="10%"
                            stopColor="oklch(0.74 0.14 20)"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="oklch(0.74 0.14 20)"
                            stopOpacity={0.08}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} />
                      <YAxis
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        width={60}
                      />
                      <Tooltip cursor={false} content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="inflow"
                        stroke="oklch(0.58 0.12 255)"
                        strokeWidth={2.5}
                        fill="url(#area-inflow)"
                      />
                      <Area
                        type="monotone"
                        dataKey="outflow"
                        stroke="oklch(0.74 0.14 20)"
                        strokeWidth={2}
                        fill="url(#area-outflow)"
                      />
                    </AreaChart>
                  </ChartContainer>
                ) : (
                  <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-border/70 text-sm text-muted-foreground">
                    Upload a statement to render the cash trend.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-border/60 bg-background/70">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <ListChecks className="size-4 text-primary" />
                  AI summary (API connected)
                </CardTitle>
                <CardDescription>
                  Fetches the latest Bedrock summary from the `/summary` Lambda and refreshes on demand.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl bg-secondary/60 p-4">
                  <p className="text-sm font-semibold">{displaySummaryTitle}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {summaryLoading ? "Fetching latest summary..." : displaySummaryBody}
                  </p>
                </div>
                <Button
                  className="w-full rounded-full"
                  disabled={summaryLoading}
                  onClick={() => refreshSummary()}
                >
                  <PlayCircle className="mr-2 size-4" />
                  {summaryLoading ? "Generating..." : "Generate new summary"}
                </Button>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="size-4 text-primary" />
                  Guardrails prepared for PII redaction and tone control.
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <Card className="border border-border/60 bg-background/70">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <CloudUpload className="size-4 text-primary" />
                  Upload financial data
                </CardTitle>
                <CardDescription>
                  Drag files into the dropzone. Each upload requests `/upload-url`, streams to S3, and triggers OCR parsing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 bg-secondary/50 p-8 text-center text-sm transition-colors",
                    isDragging && "border-primary bg-primary/10"
                  )}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                >
                  <CloudUpload className="size-8 text-primary" />
                  <div>
                    <p className="font-medium">Drop or click to upload</p>
                    <p className="text-muted-foreground">
                      CSV, PDF, XLSX up to 10&nbsp;MB. Files sync directly to your AWS bucket.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? "Uploading..." : "Choose files"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      void handleFileQueue(event.target.files);
                      event.target.value = "";
                    }}
                  />
                </div>
                <div className="mt-6 space-y-3 text-sm">
                  {hasUploads ? (
                    uploads.map((upload) => (
                      <div
                        key={upload.id}
                        className="flex items-center justify-between rounded-xl border border-border/60 bg-background/80 px-4 py-3"
                      >
                        <div>
                          <p className="font-medium">{upload.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {upload.size}
                            {upload.uploadedAt
                              ? ` • ${formatRelativeTime(upload.uploadedAt)}`
                              : null}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "rounded-full px-3 py-1 text-xs",
                            upload.status === "synced" &&
                              "bg-emerald-500/15 text-emerald-600",
                            upload.status === "processing" &&
                              "bg-primary/10 text-primary",
                            upload.status === "failed" &&
                              "bg-destructive/10 text-destructive"
                          )}
                        >
                          {upload.status === "synced"
                            ? "Synced"
                            : upload.status === "failed"
                            ? "Failed"
                            : "Processing"}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-center text-xs text-muted-foreground">
                      No uploads yet. Add a statement to populate the dashboard.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="mt-6 space-y-6">
          <Card className="border border-border/60 bg-background/70">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <FileText className="size-4 text-primary" />
                Latest transactions
              </CardTitle>
              <CardDescription>
                Pulled directly from `/transactions`. Select an upload to see what OCR extracted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsLoading ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ) : transactionsToShow.length ? (
                    transactionsToShow.map((transaction, index) => (
                      <TableRow key={`${transaction.id ?? transaction.vendor ?? "row"}-${index}`}>
                        <TableCell>
                          {transaction.vendor || transaction.description || "Unknown"}
                        </TableCell>
                        <TableCell>{transaction.category ?? "-"}</TableCell>
                        <TableCell>
                          {formatCurrency(
                            typeof transaction.amount === "number"
                              ? transaction.amount
                              : typeof transaction.total === "number"
                              ? transaction.total
                              : null
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDate(transaction.date || transaction.timestamp)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                        No transactions yet. Upload a file to populate this table.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="mt-6 space-y-6">
          <Card className="border border-border/60 bg-background/70">
            <CardHeader className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Gauge className="size-4 text-primary" />
                  Cash runway projection
                </CardTitle>
                <CardDescription>
                  Powered by `/predict`. Sends the latest transactions to your forecast Lambda.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={predictionLoading}
                onClick={() => refreshPrediction(transactions)}
              >
                {predictionLoading ? "Refreshing..." : "Refresh forecast"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {predictionLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : prediction ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-secondary/60 p-4">
                    <p className="text-xs uppercase text-muted-foreground">
                      Next 7 days
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(
                        typeof prediction.predicted_next_7_days === "number"
                          ? prediction.predicted_next_7_days
                          : prediction.predicted_inflow ?? null
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-secondary/60 p-4">
                    <p className="text-xs uppercase text-muted-foreground">
                      Last 7 days total
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(prediction.last_7_days_total)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-secondary/60 p-4">
                    <p className="text-xs uppercase text-muted-foreground">
                      Transactions counted
                    </p>
                    <p className="text-lg font-semibold">
                      {typeof prediction.transaction_count === "number"
                        ? prediction.transaction_count.toLocaleString()
                        : "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Period: {prediction.period ?? "Next 7 days"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-primary/40 p-4 text-sm text-muted-foreground">
                  Forecast data will appear here as soon as the backend returns a response.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
