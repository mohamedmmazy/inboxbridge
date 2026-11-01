"use client";

import { useState } from "react";

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn-ghost shrink-0"
      onClick={async () => {
        try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1800); } catch { /* clipboard blocked */ }
      }}
    >
      {done ? "Copied ✓" : label}
    </button>
  );
}

export function CopyField({ value, label }: { value: string; label?: string }) {
  return (
    <div>
      {label && <p className="label">{label}</p>}
      <div className="flex items-center gap-2 rounded-2xl bg-mist p-2 pl-4">
        <code className="min-w-0 flex-1 truncate text-sm select-all">{value}</code>
        <CopyButton value={value} />
      </div>
    </div>
  );
}
