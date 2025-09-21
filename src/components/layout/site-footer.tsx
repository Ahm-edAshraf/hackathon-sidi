import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background/90">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Link href="/" className="text-lg font-semibold text-foreground">
            Ledgerly
          </Link>
          <p>AI-powered accounting workflows for small and mid-sized businesses.</p>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Ledgerly. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
