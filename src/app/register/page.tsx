import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { AuthForm } from "@/components/auth/auth-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16">
      <div className="grid gap-10 rounded-3xl border border-border/60 bg-background/80 p-8 shadow-2xl backdrop-blur md:grid-cols-[1.1fr_1fr] md:p-12">
        <div className="flex flex-col justify-between gap-8">
          <div className="space-y-4">
            <Badge className="w-max rounded-full bg-primary/10 text-primary">
              Free beta • No card required
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Onboard your AI finance copilot.
            </h1>
            <p className="text-muted-foreground text-lg">
              Hand off tedious bookkeeping, expense categorization, and forecasting. Connect AWS services later-the onboarding experience already guides you through it.
            </p>
          </div>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Designed for founders & finance leads
            </div>
            <ul className="space-y-2">
              <li>- Set AI tone and depth preferences during signup.</li>
              <li>
                - Invite collaborators once auth is wired-roles and permissions already supported in the copy.
              </li>
            </ul>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary"
            >
              Already have an account?
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
        <Card className="border border-border/60 shadow-xl">
          <CardHeader className="space-y-2">
            <h2 className="text-2xl font-semibold">Create your account</h2>
            <p className="text-sm text-muted-foreground">
              We’ll plug in the backend soon. For now, explore the end-to-end UI flow with polished placeholders.
            </p>
          </CardHeader>
          <CardContent>
            <AuthForm mode="register" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
