import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

const clubName = process.env.CLUBHOUSE_NAME ?? "Clubhouse Booking";

export const metadata: Metadata = {
  title: clubName,
  description: "Banquet hall booking for our residential society.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-[#FAFAF9] text-[#1C1917] antialiased">
        <header className="border-b border-[#E7E5E4] bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-semibold tracking-tight text-[#0F766E]">
              {clubName}
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-[#0F766E] hover:underline"
            >
              Rep Login
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="mx-auto w-full max-w-5xl px-4 py-8">
          <p className="text-sm text-[#78716C]">
            Bookings are confirmed by your block representative.
          </p>
        </footer>
      </body>
    </html>
  );
}
