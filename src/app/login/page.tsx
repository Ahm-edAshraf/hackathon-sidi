import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";

import { AuthForm } from "@/components/auth/auth-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16">
      <div className="grid gap-10 rounded-3xl border border-border/60 bg-background/80 p-8 shadow-2xl backdrop-blur md:grid-cols-[1.1fr_1fr] md:p-12">
        <div className="flex flex-col justify-between gap-8">
          <div className="space-y-4">
            <Badge className="w-max rounded-full bg-primary/10 text-primary">
              Welcome back
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Your finance cockpit awaits.
            </h1>
            <p className="text-muted-foreground text-lg">
              Upload a statement or sync live data once the AWS services land. Until then, explore the polished mock experience to train your team.
            </p>
          </div>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <LockKeyhole className="size-4 text-primary" />
              Enterprise-ready authentication placeholder
            </div>
            <p>
              We’ll connect this screen to Cognito or your existing auth provider. Session tokens and role-based access are already accounted for in the UI copy.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary"
            >
              Need to create an account?
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
        <Card className="border border-border/60 shadow-xl">
          <CardHeader className="space-y-2">
            <h2 className="text-2xl font-semibold">Sign in to Ledgerly</h2>
            <p className="text-sm text-muted-foreground">
              Don’t have an account?
              <Link href="/register" className="ml-1 font-medium text-primary">
                Create one here
              </Link>
            </p>
          </CardHeader>
          <CardContent>
            <AuthForm mode="login" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
