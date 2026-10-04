type Tone = "confirmed" | "pending" | "blackout" | "closed";

const TONES: Record<Tone, string> = {
  confirmed: "bg-[#0F766E]/10 text-[#0F766E]",
  pending: "bg-[#D97706]/10 text-[#D97706]",
  blackout: "bg-[#57534E]/10 text-[#57534E]",
  closed: "bg-[#A8A29E]/15 text-[#A8A29E]",
};

export function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
