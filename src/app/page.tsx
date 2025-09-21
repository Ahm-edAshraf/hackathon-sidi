import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  Files,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { MockDashboard } from "@/components/marketing/mock-dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const featureCards = [
  {
    title: "AI-generated reports",
    description:
      "Generate GAAP-aligned financial statements instantly. Export to Excel, PDF, or share a live link.",
    bullets: [
      "Balance sheet, P&L, and cash flow ready in minutes",
      "Variance analysis with narrative explanations",
      "Investor snapshots formatted automatically",
    ],
    icon: Files,
  },
  {
    title: "Expense intelligence",
    description:
      "Ledgerly categorizes messy transactions, detects duplicates, and spots tax deductions you almost missed.",
    bullets: [
      "Smart vendor recognition and GL mapping",
      "Policy violations highlighted instantly",
      "Auto-tagged receipts with confidence scores",
    ],
    icon: Sparkles,
  },
  {
    title: "Predictive finance",
    description:
      "Cash flow forecasts built on real-time data with scenario planning baked in-no more spreadsheet roulette.",
    bullets: [
      "12-week rolling cash runway outlook",
      "Collection and burn predictors with signals",
      "Budget guidance tuned to your goals",
    ],
    icon: TrendingUp,
  },
];

const workflowSteps = [
  {
    title: "Drop in your books",
    description:
      "Upload QuickBooks exports, bank CSVs, or receipts. We clean the data and sync it to S3 for the backend to process.",
    badge: "Step 1",
  },
  {
    title: "Bedrock generates the story",
    description:
      "AWS Bedrock powers automatic categorization, commentary, and forecasting, ready for the dashboard or your tax preparer.",
    badge: "Step 2",
  },
  {
    title: "Review, approve, act",
    description:
      "Ledgerly surfaces anomalies, trends, and to-dos. Confirm the fixes, share reports, and sync back to your ERP.",
    badge: "Step 3",
  },
];

const awsIntegrations = [
  {
    title: "Amazon S3 ingestion",
    description:
      "Secure file intake with presigned URLs. Drag-and-drop uploads on the frontend, S3 buckets on the backend.",
    highlight: "Ready for pluggable S3 client",
  },
  {
    title: "Bedrock intelligence layer",
    description:
      "Natural language summaries via Bedrock models like Claude or Llama. Configurable prompt templates to fine-tune tone and depth.",
    highlight: "Swap the placeholder call with Bedrock SDK",
  },
  {
    title: "Forecasting services",
    description:
      "Connect to Amazon Forecast or SageMaker endpoints for cash projections. We already render the output beautifully-just feed the data.",
    highlight: "Predictions panel accepts JSON payloads",
  },
];

export default function Home() {
  return (
    <div className="space-y-32 pb-24">
      <section id="hero" className="relative">
        <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_top,_rgba(83,132,255,0.18),_transparent_60%)]" />
        <div className="mx-auto grid w-full max-w-6xl gap-16 px-4 pt-20 md:grid-cols-[1.1fr_1fr]">
          <div className="space-y-10">
            <div className="space-y-4">
              <Badge className="rounded-full bg-primary/10 text-primary">
                Built for SMB finance teams · AWS ready
              </Badge>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Accounting that writes itself.
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground">
                Ledgerly is your AI accounting copilot. Generate compliant financials, categorize expenses, and forecast cash flow from one intuitive workspace.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="rounded-full px-8">
                <Link href="/register">Start for free</Link>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                asChild
                className="rounded-full border border-border/70 px-8"
              >
                <Link href="#insights" className="flex items-center gap-2">
                  See product tour
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-6 rounded-2xl border border-border/60 bg-background/80 p-6 shadow-lg sm:grid-cols-3">
              {[
                {
                  label: "Avg. time to first report",
                  value: "6 min",
                },
                {
                  label: "Transactions auto-categorized",
                  value: "92%",
                },
                {
                  label: "Cash flow accuracy",
                  value: "±3.5%",
                },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="text-2xl font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center md:items-start">
            <MockDashboard />
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-6xl px-4">
        <div className="space-y-12">
          <div className="max-w-3xl space-y-4">
            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
              Built with finance teams in mind
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Every accounting ritual-automated and explained.
            </h2>
            <p className="text-muted-foreground text-lg">
              Ledgerly translates raw ledgers into narratives a founder, lender, or auditor can trust. Powerful enough for controllers, approachable enough for business owners.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {featureCards.map((feature) => (
              <Card
                key={feature.title}
                className="group relative overflow-hidden border-border/60 bg-background/70 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/0 via-primary/5 to-secondary/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <CardContent className="flex h-full flex-col gap-4 p-6">
                  <feature.icon className="size-10 rounded-2xl bg-primary/10 p-2 text-primary" />
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground/90">
                      {feature.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-2">
                          <Check className="mt-1 size-4 text-primary" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button variant="ghost" className="mt-auto justify-start gap-2 text-primary">
                    Explore playbook
                    <ArrowRight className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="mx-auto w-full max-w-6xl px-4">
        <div className="rounded-3xl border border-border/60 bg-secondary/40 p-8 sm:p-12">
          <div className="max-w-2xl space-y-4">
            <Badge className="rounded-full bg-primary/10 text-primary">
              End-to-end flow
            </Badge>
            <h2 className="text-3xl font-semibold sm:text-4xl">
              From upload to insight in under ten minutes.
            </h2>
            <p className="text-muted-foreground text-lg">
              We designed the UI to slot in AWS services as soon as they’re ready. Hook up the APIs later-the experience already guides users through each step.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {workflowSteps.map((step) => (
              <div
                key={step.title}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-border/60 bg-background/80 p-6 shadow-sm"
              >
                <Badge variant="outline" className="w-max rounded-full px-3 py-1">
                  {step.badge}
                </Badge>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BarChart3 className="size-4 text-primary" />
                  UI ready • Backend pending
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="insights" className="mx-auto w-full max-w-6xl space-y-12 px-4">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-6">
            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
              Natural language meets finance
            </Badge>
            <h2 className="text-3xl font-semibold sm:text-4xl">
              Ask anything about your business finances.
            </h2>
            <p className="text-muted-foreground text-lg">
              Ledgerly translates plain English into actions. Draft tax prep packets, generate budgets, or answer investor questions without touching a spreadsheet.
            </p>
            <div className="grid gap-4">
              {[
                {
                  prompt: "What changed in my cash flow last quarter?",
                  response:
                    "Net cash from operations increased 12% driven by faster collections from top three customers. Marketing spend rose 9%-flagged for review.",
                },
                {
                  prompt: "Draft a tax package for my CPA.",
                  response:
                    "Prepared a folder with 4 supporting schedules, 12 categorized deductions, and a narrative on R&D credits. Ready to export once backend hook is live.",
                },
                {
                  prompt: "Should we hire another AE this quarter?",
                  response:
                    "Forecast keeps runway above 9 months if new ARR targets hit 80%. AI recommends hiring in November after reviewing pipeline health.",
                },
              ].map((entry) => (
                <Card
                  key={entry.prompt}
                  className="border border-border/60 bg-background/70 shadow-sm"
                >
                  <CardContent className="space-y-3 p-5">
                    <p className="font-mono text-sm text-primary">
                      “{entry.prompt}”
                    </p>
                    <p className="text-sm text-muted-foreground">{entry.response}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-background/80 p-6 shadow-lg">
            <div className="space-y-2">
              <Badge className="rounded-full bg-primary/10 text-primary">
                Prediction preview
              </Badge>
              <h3 className="text-2xl font-semibold tracking-tight">
                Rolling cash forecast
              </h3>
              <p className="text-sm text-muted-foreground">
                Plug in the AWS prediction endpoint later. We already render the confidence bands and highlight recommended actions.
              </p>
            </div>
            <div className="grid gap-4 text-sm">
              <div className="rounded-2xl bg-secondary/60 p-4">
                <p className="text-xs uppercase text-muted-foreground">
                  Base scenario
                </p>
                <p className="text-lg font-semibold">Runway: 8.7 months</p>
                <p className="text-muted-foreground">
                  ARR growth at 6% MoM keeps the balance positive through April 2025.
                </p>
              </div>
              <div className="rounded-2xl bg-primary/10 p-4 text-primary">
                <p className="text-xs uppercase">AI recommendation</p>
                <p className="text-sm text-primary/90">
                  Shift marketing budget 12% to lifecycle campaigns to extend runway by 1.4 months.
                </p>
              </div>
              <div className="rounded-2xl border border-dashed border-primary/40 p-4 text-sm">
                <p className="text-muted-foreground">
                  Placeholder for AWS Forecast response. Expecting JSON payload with `confidenceIntervals` and `recommendedActions`-the UI already parses both.
                </p>
              </div>
            </div>
            <Button asChild className="mt-auto rounded-full">
              <Link href="/dashboard">Open preview dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="aws" className="mx-auto w-full max-w-6xl px-4">
        <div className="rounded-3xl border border-border/60 bg-background/80 p-8 shadow-xl sm:p-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                Ready for your backend
              </Badge>
              <h2 className="text-3xl font-semibold sm:text-4xl">
                AWS services drop in without redesign.
              </h2>
              <p className="text-muted-foreground text-lg">
                We scaffolded upload states, loading placeholders, and success toasts. Swap our mocks with real API calls when the backend lands.
              </p>
            </div>
            <Button variant="outline" className="rounded-full">
              View integration checklist
            </Button>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {awsIntegrations.map((integration) => (
              <Card
                key={integration.title}
                className="border-border/60 bg-secondary/40"
              >
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <ShieldCheck className="size-4" />
                    {integration.highlight}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{integration.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {integration.description}
                    </p>
                  </div>
                  <Button variant="ghost" className="justify-start gap-2 text-primary">
                    Placeholder docs
                    <ArrowRight className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4">
        <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/15 via-primary/5 to-secondary/30 p-10 text-center shadow-2xl sm:p-16">
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Give your finance team superpowers.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Launch with the polished frontend today. Connect to AWS Bedrock, S3, and Forecast whenever they’re ready. Ledgerly keeps the experience cohesive from day one.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center">
            <Button size="lg" asChild className="rounded-full px-10">
              <Link href="/register">Create an account</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
