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
  AlertTriangle,
  ArrowUpRight,
  CalendarRange,
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
} from "@/lib/api";

const metrics = [
  {
    label: "Total revenue",
    value: "$182,400",
    change: "+6.8%",
    icon: PieChart,
    trend: "green",
  },
  {
    label: "Operating expenses",
    value: "$94,120",
    change: "-3.2%",
    icon: Layers,
    trend: "green",
  },
  {
    label: "Net cash",
    value: "$54,980",
    change: "+12.4%",
    icon: Gauge,
    trend: "green",
  },
  {
    label: "Runway",
    value: "8.7 months",
    change: "No change",
    icon: CalendarRange,
    trend: "neutral",
  },
];

const chartConfig = {
  cash: {
    label: "Cash balance",
    color: "oklch(0.58 0.12 255 / 0.9)",
  },
  expenses: {
    label: "Operating expenses",
    color: "oklch(0.74 0.14 20 / 0.6)",
  },
};

const chartData = [
  { month: "Apr", cash: 41000, expenses: 28000 },
  { month: "May", cash: 45250, expenses: 30000 },
  { month: "Jun", cash: 49800, expenses: 33200 },
  { month: "Jul", cash: 54500, expenses: 34800 },
  { month: "Aug", cash: 58800, expenses: 36900 },
  { month: "Sep", cash: 63650, expenses: 37500 },
];

const fallbackInsight = {
  title: "Cash is tracking ahead of plan",
  body: "Your cash balance is 12% higher than plan thanks to faster collections from your top three customers.",
};

const fallbackTransactions: Transaction[] = [
  {
    vendor: "GTM Media",
    category: "Marketing",
    amount: 18800,
    date: "2024-08-15",
  },
  {
    vendor: "Segment",
    category: "Software",
    amount: 11200,
    date: "2024-08-12",
  },
  {
    vendor: "First National Bank",
    category: "Payroll",
    amount: 41000,
    date: "2024-08-10",
  },
  {
    vendor: "Ops Collective",
    category: "Ops",
    amount: 6500,
    date: "2024-08-06",
  },
];

type UploadStatus = "processing" | "synced" | "failed";

type UploadItem = {
  id: string;
  name: string;
  size: string;
  status: UploadStatus;
};

const initialUploads: UploadItem[] = [
  {
    id: "init-1",
    name: "august-transactions.csv",
    size: "2.1 MB",
    status: "synced",
  },
  {
    id: "init-2",
    name: "q3-expense-report.pdf",
    size: "845 KB",
    status: "synced",
  },
];

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

export function DashboardView() {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [uploads, setUploads] = React.useState<UploadItem[]>(initialUploads);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = React.useState(false);

  const [summary, setSummary] = React.useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = React.useState(false);

  const [prediction, setPrediction] = React.useState<PredictionResponse | null>(null);
  const [predictionLoading, setPredictionLoading] = React.useState(false);

  const refreshTransactions = React.useCallback(async () => {
    setTransactionsLoading(true);
    try {
      const data = await listTransactions();
      if (Array.isArray(data)) {
        setTransactions(data);
      }
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
      if (data?.summary) {
        setSummary(data.summary);
      }
      if (Array.isArray(data?.transactions) && transactions.length === 0) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error("Failed to fetch summary", error);
    } finally {
      setSummaryLoading(false);
    }
  }, [transactions.length]);

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
      status: "processing",
    }));

    setUploads((prev) => [...stagedItems, ...prev]);
    setIsUploading(true);

    await Promise.all(
      stagedItems.map(async (item, index) => {
        const file = fileArray[index];
        try {
          const uploadUrl = await requestUploadUrl(
            file.name,
            file.type || "application/octet-stream"
          );
          await uploadFileToPresignedUrl(uploadUrl, file);
          setUploads((prev) =>
            prev.map((upload) =>
              upload.id === item.id ? { ...upload, status: "synced" } : upload
            )
          );
          toast.success("Upload complete", {
            description: `${file.name} synced to S3`,
          });
        } catch (error) {
          console.error("Upload failed", error);
          toast.error("Upload failed", {
            description: `${file.name} could not be uploaded`,
          });
          setUploads((prev) =>
            prev.map((upload) =>
              upload.id === item.id ? { ...upload, status: "failed" } : upload
            )
          );
        }
      })
    );

    setIsUploading(false);
    setTimeout(() => {
      refreshTransactions();
      refreshSummary();
    }, 400);
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleFileQueue(event.dataTransfer.files);
  }

  const displaySummaryTitle = summary ? "Latest insight" : fallbackInsight.title;
  const displaySummaryBody = summary ?? fallbackInsight.body;

  const transactionsToShow: Transaction[] =
    transactions.length > 0 ? transactions.slice(0, 6) : fallbackTransactions;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-4 border-b border-border/60 pb-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Badge className="rounded-full bg-primary/10 text-primary">
            Dashboard preview
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Finance control center
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Plug in auth, S3, and Bedrock later. The experience already guides users through uploads, AI summaries, and forecasting.
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
                  Cash and expense trend
                </CardTitle>
                <CardDescription>
                  Charts render demo data today. Swap the dataset with live backend responses when ready.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer className="h-64 w-full" config={chartConfig}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="area-cash" x1="0" x2="0" y1="0" y2="1">
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
                      <linearGradient id="area-expenses" x1="0" x2="0" y1="0" y2="1">
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
                      dataKey="cash"
                      stroke="oklch(0.58 0.12 255)"
                      strokeWidth={2.5}
                      fill="url(#area-cash)"
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stroke="oklch(0.74 0.14 20)"
                      strokeWidth={2}
                      fill="url(#area-expenses)"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="border border-border/60 bg-background/70">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <ListChecks className="size-4 text-primary" />
                  AI summary (API connected)
                </CardTitle>
                <CardDescription>
                  Generates via AWS Bedrock once wired. Button below calls the `/summary` endpoint.
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
                  Drag files into the dropzone. The frontend now hits `/upload-url` to get a presigned S3 URL.
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
                      CSV, PDF, XLSX up to 10 MB. We’ll stream to S3 once wired.
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
                      handleFileQueue(event.target.files);
                      event.target.value = "";
                    }}
                  />
                </div>
                <div className="mt-6 space-y-3 text-sm">
                  {uploads.map((upload) => (
                    <div
                      key={upload.id}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-background/80 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium">{upload.name}</p>
                        <p className="text-xs text-muted-foreground">{upload.size}</p>
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
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/60 bg-background/70">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <AlertTriangle className="size-4 text-primary" />
                  Action items
                </CardTitle>
                <CardDescription>
                  Suggested follow-ups generated from today’s data load.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="rounded-2xl bg-secondary/60 p-4">
                  Review vendor contract ending Nov 30. Savings forecast: $2.4k/month.
                </div>
                <div className="rounded-2xl bg-secondary/60 p-4">
                  Sync payroll journal entries to QuickBooks once API is ready.
                </div>
                <div className="rounded-2xl bg-secondary/60 p-4">
                  Export tax-ready packet for CPA review in December.
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
                Pulled directly from `/transactions`. Replace with richer analytics when ready.
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
                  ) : (
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
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-background/70">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <ShieldCheck className="size-4 text-primary" />
                Policy checks ready
              </CardTitle>
              <CardDescription>
                Pending integration with Bedrock moderation or custom Lambda for controls.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-secondary/50 p-4">
                <p className="font-medium">Duplicate detection</p>
                <p className="text-muted-foreground">
                  3 possible duplicates flagged for marketing receipts.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-secondary/50 p-4">
                <p className="font-medium">Policy variance</p>
                <p className="text-muted-foreground">
                  Meals policy exceeded in two transactions this week.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-secondary/50 p-4">
                <p className="font-medium">Sales tax review</p>
                <p className="text-muted-foreground">
                  4 invoices missing tax codes. Placeholder for automated review service.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-secondary/50 p-4">
                <p className="font-medium">Receipt coverage</p>
                <p className="text-muted-foreground">
                  98% categorized with attached evidence. Link storage to S3 bucket later.
                </p>
              </div>
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
                      Predicted inflow
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(prediction.predicted_inflow)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-secondary/60 p-4">
                    <p className="text-xs uppercase text-muted-foreground">
                      Predicted outflow
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(prediction.predicted_outflow)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-secondary/60 p-4">
                    <p className="text-xs uppercase text-muted-foreground">Net</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(prediction.net)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Period: {prediction.period ?? "next period"}
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

          <Card className="border border-border/60 bg-background/70">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <ArrowUpRight className="size-4 text-primary" />
                Budget scenarios
              </CardTitle>
              <CardDescription>
                Swap the static data with your forecasting endpoint. We already handle scenario toggles and messaging.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
              <div className="rounded-2xl bg-secondary/60 p-4">
                <p className="font-medium">Conservative</p>
                <p className="text-muted-foreground">
                  Slower hiring extends runway to 10.4 months with 4% ARR growth.
                </p>
              </div>
              <div className="rounded-2xl bg-secondary/60 p-4">
                <p className="font-medium">Balanced</p>
                <p className="text-muted-foreground">
                  Maintain current plan and hold a 2.3 month buffer over baseline.
                </p>
              </div>
              <div className="rounded-2xl bg-secondary/60 p-4">
                <p className="font-medium">Aggressive</p>
                <p className="text-muted-foreground">
                  Increase GTM spend by 15% to target 9% ARR growth. Watch cash dip in March.
                </p>
              </div>
              <div className="rounded-2xl bg-secondary/60 p-4">
                <p className="font-medium">AI recommendation</p>
                <p className="text-muted-foreground">
                  Delay non-critical capex until Q2 to preserve $78k in cash.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
