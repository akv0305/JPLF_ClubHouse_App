"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

interface FilterBarProps {
  block: string;
  when: string;
  q: string;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex min-h-[36px] items-center rounded-full border px-3 text-xs font-medium transition ${
        active
          ? "border-[#0F766E] bg-[#0F766E] text-white"
          : "border-[#E7E5E4] bg-white text-[#78716C] hover:text-[#1C1917]"
      }`}
    >
      {children}
    </button>
  );
}

export function FilterBar({ block, when, q }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(q);
  const firstRender = useRef(true);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (search === q) return;
    const handle = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) params.set("q", search);
      else params.delete("q");
      router.replace(`${pathname}?${params.toString()}`);
    }, 300);
    return () => clearTimeout(handle);
  }, [search, q, searchParams, pathname, router]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip active={block === "all"} onClick={() => setParam("block", "all")}>
        All blocks
      </Chip>
      <Chip active={block === "mine"} onClick={() => setParam("block", "mine")}>
        My block only
      </Chip>
      <span className="mx-1 hidden h-5 w-px bg-[#E7E5E4] sm:block" />
      <Chip
        active={when === "upcoming"}
        onClick={() => setParam("when", when === "upcoming" ? "" : "upcoming")}
      >
        Upcoming
      </Chip>
      <Chip
        active={when === "past"}
        onClick={() => setParam("when", when === "past" ? "" : "past")}
      >
        Past
      </Chip>
      <div className="relative ml-auto w-full sm:w-56">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#78716C]" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, flat or phone"
          aria-label="Search requests"
          className="w-full min-h-[44px] rounded-xl border border-[#E7E5E4] bg-white pl-9 pr-3 text-sm text-[#1C1917] outline-none transition focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
        />
      </div>
    </div>
  );
}
