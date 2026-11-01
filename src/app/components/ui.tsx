import Link from "next/link";
import type { Provider } from "@/lib/providers";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
      <span className="grid size-8 place-items-center rounded-xl bg-brand text-white">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 8 8 6 8-6" /></svg>
      </span>
      InboxBridge
    </Link>
  );
}

export function ProviderMark({ p, size = "md" }: { p: Pick<Provider, "mark" | "tint">; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "h-16 min-w-16 px-4 text-lg" : size === "sm" ? "h-9 min-w-9 px-2.5 text-[11px]" : "h-12 min-w-12 px-3 text-sm";
  return (
    <span className={`inline-grid place-items-center rounded-2xl font-extrabold tracking-tight ${cls}`} style={{ background: p.tint }}>
      {p.mark}
    </span>
  );
}

export function Arrow() {
  return <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12m-5-5 5 5-5 5" /></svg>;
}

export function Check({ className = "size-4" }: { className?: string }) {
  return <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m4 10.5 4 4 8-9" /></svg>;
}
