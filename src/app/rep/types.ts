import type { BookingKind, BookingStatus } from "@/lib/types";

export interface RepRow {
  id: string;
  kind: BookingKind;
  status: BookingStatus;
  startsAt: string;
  endsAt: string;
  requesterName: string | null;
  block: string | null;
  flatNo: string | null;
  phone: string | null;
  remarks: string | null;
  ownerBlock: string;
  amountCollected: string | null;
  requestedAt: string;
  requestedAgo: string;
  decidedAt: string | null;
  decidedAgo: string | null;
  decidedByBlock: string | null;
  decisionReason: string | null;
}

export type RepBlockFilter = "all" | "mine";
export type RepWhenFilter = "all" | "upcoming" | "past";
