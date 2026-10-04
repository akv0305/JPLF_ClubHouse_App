import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <p className="text-4xl font-semibold text-[#0F766E]">404</p>
      <h1 className="mt-2 text-lg font-semibold text-[#1C1917]">Page not found</h1>
      <p className="mt-1 text-sm text-[#78716C]">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#0F766E] px-5 text-sm font-medium text-white transition hover:bg-[#0d6a63]"
      >
        Back to calendar
      </Link>
    </div>
  );
}
