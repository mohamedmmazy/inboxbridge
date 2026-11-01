import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { LoginForm } from "./form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/dashboard" } = await searchParams;
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  if (await getCurrentUser()) redirect(safeNext);
  return (
    <div className="mx-auto mt-14 max-w-md">
      <div className="card !p-8">
        <span className="pill">Welcome back</span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Sign in</h1>
        <p className="muted mt-1 text-sm">Use the account your admin created for you.</p>
        <LoginForm next={safeNext} />
      </div>
      <p className="muted mt-4 text-center text-sm">No account? Ask your admin to add your email.</p>
    </div>
  );
}
