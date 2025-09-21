"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { MenuIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { clearSession } from "@/lib/session";
import { useSession } from "@/hooks/use-session";

const navItems: Array<{ href: string; label: string }> = [
  { href: "#features", label: "Features" },
  { href: "#workflow", label: "Workflow" },
  { href: "#insights", label: "Insights" },
  { href: "#aws", label: "AWS Ready" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");
  const router = useRouter();
  const { isAuthenticated, refresh } = useSession();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => refresh();
    window.addEventListener("ledgerly-session", handler);
    return () => window.removeEventListener("ledgerly-session", handler);
  }, [refresh]);

  const handleSignOut = () => {
    clearSession();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("ledgerly-session"));
    }
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/75 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:h-20">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold sm:text-lg">
          <span className="relative overflow-hidden rounded-md bg-secondary px-2 py-1 text-secondary-foreground">
            <span className="absolute inset-0 animate-[pulse_4s_infinite] bg-gradient-to-br from-primary/20 via-primary/5 to-primary/40" />
            <span className="relative">Ledgerly</span>
          </span>
          <span className="hidden text-muted-foreground sm:block">
            AI Accounting Copilot
          </span>
        </Link>

        <nav className="hidden items-center gap-8 sm:flex">
          {!isDashboard &&
            navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          {isAuthenticated ? (
            <>
              {!isDashboard && (
                <Link
                  href="/dashboard"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  Dashboard
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "rounded-full"
                )}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" }),
                  "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-sm hover:from-primary/95 hover:to-primary"
                )}
              >
                Create account
              </Link>
            </>
          )}
        </div>

        <Sheet>
          <SheetTrigger className="sm:hidden">
            <span
              className={cn(
                buttonVariants({ variant: "outline", size: "icon" }),
                "rounded-lg"
              )}
            >
              <MenuIcon className="size-5" />
            </span>
          </SheetTrigger>
          <SheetContent side="right" className="sm:hidden">
            <div className="flex flex-col gap-4 p-6">
              <Link
                href="/"
                className="text-xl font-semibold tracking-tight"
              >
                Ledgerly
              </Link>
              {!isDashboard && (
                <nav className="flex flex-col gap-2">
                  {navItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="rounded-md px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              )}
              <div className="mt-2 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    {!isDashboard && (
                      <Link
                        href="/dashboard"
                        className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
                      >
                        Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        handleSignOut();
                      }}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "lg" }),
                        "rounded-full"
                      )}
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      className={cn(
                        buttonVariants({ variant: "default", size: "lg" }),
                        "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-sm hover:from-primary/95 hover:to-primary"
                      )}
                    >
                      Create account
                    </Link>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
