"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <h1 className="text-lg font-semibold text-[#1C1917]">Something went wrong</h1>
      <p className="mt-2 text-sm text-[#78716C]">
        Please try again. If it keeps happening, contact the society secretary.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#0F766E] px-5 text-sm font-medium text-white transition hover:bg-[#0d6a63]"
      >
        Try again
      </button>
    </div>
  );
}
