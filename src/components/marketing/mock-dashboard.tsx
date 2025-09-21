"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
} from "recharts";
import {
  ArrowUpRight,
  FileSpreadsheet,
  PiggyBank,
  Sparkles,
  UploadCloud,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";

const cashflowConfig = {
  cashFlow: {
    label: "Projected cash balance",
    color: "oklch(0.58 0.12 255 / 0.9)",
  },
};

const cashflowData = [
  { month: "Apr", cashFlow: 42000 },
  { month: "May", cashFlow: 46800 },
  { month: "Jun", cashFlow: 50500 },
  { month: "Jul", cashFlow: 55250 },
  { month: "Aug", cashFlow: 61000 },
  { month: "Sep", cashFlow: 67200 },
];

export function MockDashboard() {
  return (
    <div className="relative mx-auto max-w-4xl rounded-3xl border border-border/50 bg-background/80 p-6 shadow-2xl backdrop-blur">
      <div className="absolute inset-x-8 top-0 h-24 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/40 blur-3xl" />
      <div className="relative flex flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="size-4 text-primary" />
              Live AI workspace
            </div>
            <h3 className="text-xl font-semibold tracking-tight">
              Q3 Financial Pulse
            </h3>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Badge variant="outline" className="rounded-full px-3 py-1">
              Cash runway · 6.5 months
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-dashed"
            >
              Export snapshot
            </Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <Card className="border-none bg-gradient-to-br from-primary/5 via-background to-secondary/30 shadow-inner">
            <CardContent className="space-y-4 p-5">
              <div className="flex w-full items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net cash this month</p>
                  <p className="text-2xl font-semibold tracking-tight">
                    $55,200
                  </p>
                </div>
                <Badge className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-600">
                  <ArrowUpRight className="mr-1 size-4" />
                  12.4%
                </Badge>
              </div>
              <ChartContainer className="h-48 w-full" config={cashflowConfig}>
                <AreaChart data={cashflowData}>
                  <defs>
                    <linearGradient id="cashflow" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.58 0.12 255)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.58 0.12 255)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    stroke="currentColor"
                    className="text-xs text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent className="min-w-[200px]" />}
                  />
                  <Area
                    type="monotone"
                    dataKey="cashFlow"
                    stroke="oklch(0.58 0.12 255)"
                    strokeWidth={2.5}
                    fill="url(#cashflow)"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card className="border border-primary/20 bg-primary/5">
              <CardContent className="flex h-full flex-col justify-between gap-3 p-5">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <UploadCloud className="size-4 text-primary" />
                  Files synced from S3 · 12 new
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">AI summaries</p>
                  <p className="text-lg font-semibold">8 insights ready</p>
                </div>
                <Button size="sm" className="self-start rounded-full">
                  Review highlights
                </Button>
              </CardContent>
            </Card>
            <Card className="border-none bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-background">
              <CardContent className="flex h-full flex-col gap-4 p-5">
                <div className="flex items-center gap-3">
                  <PiggyBank className="size-5 text-emerald-500" />
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      Forecasted burn
                    </p>
                    <p className="text-lg font-semibold">$37,800 next month</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  AI flags a 9% variance in marketing spend. Suggested action:
                  downgrade paid channels by 12%.
                </p>
                <Button variant="outline" size="sm" className="rounded-full">
                  View recommendations
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Ledger-ready reports",
              value: "Balance Sheet · Cash Flow · P&L",
              icon: FileSpreadsheet,
            },
            {
              title: "Expense intelligence",
              value: "Categorized 98% of transactions",
              icon: Sparkles,
            },
            {
              title: "Alerts in Slack",
              value: "3 variances flagged this week",
              icon: ArrowUpRight,
            },
          ].map((item) => (
            <Card
              key={item.title}
              className="border border-border/40 bg-background/70"
            >
              <CardContent className="flex items-center gap-3 p-4">
                <item.icon className="size-10 rounded-xl bg-secondary/60 p-2 text-primary" />
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    {item.title}
                  </p>
                  <p className="text-sm font-semibold text-foreground/90">
                    {item.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
}
