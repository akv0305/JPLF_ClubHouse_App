import type { BookingKind, BookingStatus } from "@/lib/types";

/** The minimal shape the action modals need (queue rows and the detail page both satisfy it). */
export interface ActionBooking {
  id: string;
  status: BookingStatus;
  kind: BookingKind;
  startsAt: string;
  endsAt: string;
  requesterName: string | null;
  block: string | null;
  flatNo: string | null;
  phone: string | null;
  remarks: string | null;
  ownerBlock: string;
}

export interface RepRow extends ActionBooking {
  amountCollected: string | null;
  requestedAt: string;
  requestedAgo: string;
  decidedAt: string | null;
  decidedAgo: string | null;
  decidedByBlock: string | null;
  decisionReason: string | null;
  message: string | null;
}

export type RepBlockFilter = "all" | "mine";
export type RepWhenFilter = "all" | "upcoming" | "past";
