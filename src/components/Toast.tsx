"use client";

import { X } from "lucide-react";

export function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-[60] flex items-center justify-between gap-3 rounded-xl bg-[#0F766E] px-4 py-3 text-sm text-white shadow-lg sm:inset-x-auto sm:right-4 sm:w-80"
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="rounded p-0.5 transition hover:bg-white/20"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
