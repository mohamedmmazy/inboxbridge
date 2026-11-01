import type { Metadata } from "next";
import Link from "next/link";
import { PROVIDERS } from "@/lib/providers";
import { Arrow, ProviderMark } from "../../components/ui";

export const metadata: Metadata = { title: "Connect your email provider" };

export default function Providers() {
  return (
    <section className="mt-12">
      <span className="pill">Connection guides</span>
      <h1 className="h1 mt-4 max-w-3xl">Connect your email in about two minutes</h1>
      <p className="muted mt-4 max-w-2xl text-lg">Choose your provider. Each guide shows exactly what to click, and what to paste back here.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROVIDERS.map((p) => (
          <Link key={p.id} href={`/providers/${p.id}`} className="card flex flex-col gap-4 transition hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <ProviderMark p={p} />
              {p.status === "unsupported" ? <span className="pill !bg-amber-50 !text-amber-700">Not supported yet</span> : <span className="pill !bg-emerald-50 !text-emerald-700">Supported</span>}
            </div>
            <div>
              <h2 className="text-lg font-bold">{p.name}</h2>
              <p className="muted mt-1 text-sm">{p.tagline}</p>
            </div>
            <span className="mt-auto flex items-center gap-1.5 text-sm font-semibold text-brand">{p.status === "ready" ? "Read the guide" : "Why not?"} <Arrow /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
