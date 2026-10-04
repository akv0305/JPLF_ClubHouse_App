import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { getBlock, requireBlock } from "@/lib/auth";
import { signOutAction } from "./actions";

const NAV = [
  { href: "/rep", label: "Requests" },
  { href: "/rep/calendar", label: "Calendar" },
  { href: "/rep/new", label: "New Booking" },
  { href: "/rep/profile", label: "Block Profile" },
  { href: "/rep/export", label: "Export" },
  { href: "/rep/password", label: "Password" },
];

export default async function RepLayout({ children }: { children: React.ReactNode }) {
  const code = await requireBlock();
  const block = await getBlock(code);
  const repNames = block?.rep_names?.join(" & ") ?? "";

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-[#1C1917]">{code} Block</h1>
          {repNames && <p className="text-sm text-[#78716C]">{repNames}</p>}
        </div>
        <form action={signOutAction}>
          <Button type="submit" variant="secondary">
            Sign out
          </Button>
        </form>
      </div>

      <nav className="mt-4 flex flex-nowrap gap-1 overflow-x-auto border-b border-[#E7E5E4]">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="inline-flex min-h-[44px] shrink-0 items-center whitespace-nowrap rounded-t-xl px-3 text-sm font-medium text-[#78716C] transition hover:bg-white hover:text-[#0F766E]"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">{children}</div>
    </div>
  );
}
