"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Copy, Inbox } from "lucide-react";
import { ConfirmBookingModal } from "@/components/ConfirmBookingModal";
import { CopyMessageButton } from "@/components/CopyMessageButton";
import { RejectBookingModal } from "@/components/RejectBookingModal";
import { Toast } from "@/components/Toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { copyToClipboard } from "@/lib/clipboard";
import { formatINR } from "@/lib/money";
import { durationLabel, fmtRange } from "@/lib/time";
import type { BookingStatus } from "@/lib/types";
import type { RepRow } from "./types";

type Tone = "confirmed" | "pending" | "blackout" | "closed";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

function statusTone(status: BookingStatus, kind: RepRow["kind"]): Tone {
  if (kind === "blackout") return "blackout";
  if (status === "pending") return "pending";
  if (status === "confirmed") return "confirmed";
  return "closed";
}

function PhoneLink({ phone }: { phone: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const ok = await copyToClipboard(phone);
    if (!ok) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <span className="inline-flex items-center gap-1">
      <a href={`tel:${phone}`} className="text-[#0F766E] underline">
        {phone}
      </a>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy phone number"
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[#78716C] transition hover:bg-[#FAFAF9] hover:text-[#0F766E]"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </span>
  );
}

function PendingCard({
  row,
  canAct,
  onConfirm,
  onReject,
}: {
  row: RepRow;
  canAct: boolean;
  onConfirm: () => void;
  onReject: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#1C1917]">{fmtRange(row.startsAt, row.endsAt)}</p>
          <p className="text-xs text-[#78716C]">{durationLabel(row.startsAt, row.endsAt)}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#0F766E]/10 px-2.5 py-0.5 text-xs font-medium text-[#0F766E]">
          {row.ownerBlock} Block
        </span>
      </div>

      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="text-[#78716C]">Requester</dt>
          <dd className="text-[#1C1917]">{row.requesterName}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-[#78716C]">Flat</dt>
          <dd className="text-[#1C1917]">
            {row.block}-{row.flatNo}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="text-[#78716C]">Phone</dt>
          <dd>{row.phone ? <PhoneLink phone={row.phone} /> : "—"}</dd>
        </div>
        {row.remarks && (
          <div className="flex gap-2">
            <dt className="text-[#78716C]">Remarks</dt>
            <dd className="text-[#1C1917]">{row.remarks}</dd>
          </div>
        )}
      </dl>

      <p className="mt-2 text-xs text-[#78716C]">Requested {row.requestedAgo}</p>

      <div className="mt-4">
        {canAct ? (
          <div className="flex gap-2">
            <Button type="button" onClick={onConfirm}>
              Confirm
            </Button>
            <Button type="button" variant="secondary" onClick={onReject}>
              Reject
            </Button>
          </div>
        ) : (
          <p className="text-sm text-[#78716C]">
            Only {row.ownerBlock} Block can act on this request
          </p>
        )}
      </div>
    </Card>
  );
}

function DecisionCard({ row }: { row: RepRow }) {
  return (
    <div className="rounded-xl border border-[#E7E5E4] bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#1C1917]">{fmtRange(row.startsAt, row.endsAt)}</p>
          <p className="text-xs text-[#78716C]">
            {row.requesterName} · {row.block}-{row.flatNo} · {row.ownerBlock} Block
          </p>
        </div>
        <Badge tone={statusTone(row.status, row.kind)}>
          {STATUS_LABEL[row.status] ?? row.status}
        </Badge>
      </div>
      {row.amountCollected && (
        <p className="mt-1 text-xs text-[#78716C]">
          Amount collected: {formatINR(row.amountCollected)}
        </p>
      )}
      {row.decisionReason && (
        <p className="mt-1 text-xs text-[#78716C]">Reason: {row.decisionReason}</p>
      )}
      <p className="mt-1 text-xs text-[#78716C]">
        Decided {row.decidedAgo}
        {row.decidedByBlock ? ` by ${row.decidedByBlock} Block` : ""}
      </p>
      {row.status === "confirmed" && row.message && (
        <div className="mt-2">
          <CopyMessageButton text={row.message} className="w-full sm:w-auto" />
        </div>
      )}
    </div>
  );
}

export function RequestsView({
  pending,
  decisions,
  myBlock,
  searching,
}: {
  pending: RepRow[];
  decisions: RepRow[];
  myBlock: string;
  searching: boolean;
}) {
  const [active, setActive] = useState<{ booking: RepRow; mode: "confirm" | "reject" } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [decisionsOpen, setDecisionsOpen] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const handle = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(handle);
  }, [toast]);

  function handleSuccess(message: string) {
    setActive(null);
    setToast(message);
  }

  return (
    <div>
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#78716C]">
          Awaiting action
        </h2>
        <div className="mt-3">
          {pending.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={searching ? "No results for that search" : "Nothing awaiting your action"}
              description={
                searching
                  ? "Try a different name, flat or phone number."
                  : "New requests will appear here."
              }
            />
          ) : (
            <div className="space-y-3">
              {pending.map((row) => (
                <PendingCard
                  key={row.id}
                  row={row}
                  canAct={row.ownerBlock === myBlock}
                  onConfirm={() => setActive({ booking: row, mode: "confirm" })}
                  onReject={() => setActive({ booking: row, mode: "reject" })}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mt-8">
        <button
          type="button"
          onClick={() => setDecisionsOpen((value) => !value)}
          aria-expanded={decisionsOpen}
          className="flex w-full items-center justify-between rounded-xl border border-[#E7E5E4] bg-white px-4 py-3 text-sm font-medium text-[#1C1917] transition hover:bg-[#FAFAF9]"
        >
          <span>Recent decisions ({decisions.length})</span>
          <ChevronDown
            className={`h-4 w-4 text-[#78716C] transition ${decisionsOpen ? "rotate-180" : ""}`}
          />
        </button>
        {decisionsOpen && (
          <div className="mt-3 space-y-2">
            {decisions.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#E7E5E4] bg-white px-4 py-6 text-center text-sm text-[#78716C]">
                No decisions yet.
              </p>
            ) : (
              decisions.map((row) => <DecisionCard key={row.id} row={row} />)
            )}
          </div>
        )}
      </section>

      {active?.mode === "confirm" && (
        <ConfirmBookingModal
          booking={active.booking}
          onClose={() => setActive(null)}
          onSuccess={handleSuccess}
        />
      )}
      {active?.mode === "reject" && (
        <RejectBookingModal
          booking={active.booking}
          onClose={() => setActive(null)}
          onSuccess={handleSuccess}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
