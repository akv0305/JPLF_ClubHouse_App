export const BLOCKS = ["C1", "C2", "D", "E"] as const;

export type BlockCode = (typeof BLOCKS)[number];

export type BookingKind = "resident" | "outsider" | "blackout";

export type BookingStatus = "pending" | "confirmed" | "rejected" | "cancelled";

export interface Block {
  code: BlockCode;
  sort_order: number;
  display_name: string;
  username: string;
  rep_names: string[];
  phones: string[];
  emails: string[];
  failed_attempts: number;
  locked_until: string | null;
  password_changed_at: string | null;
}

/** Internal server-side shape: the full blocks row, including hashes. Never send to the client. */
export interface BlockRow extends Block {
  password_hash: string;
  block_code_hash: string;
}

export interface Booking {
  id: string;
  kind: BookingKind;
  status: BookingStatus;
  starts_at: string;
  ends_at: string;
  requester_name: string;
  block: BlockCode | null;
  flat_no: string | null;
  phone: string | null;
  remarks: string | null;
  created_by_block: BlockCode | null;
  /** GENERATED column — read-only, never written. */
  owner_block: BlockCode;
  /** Postgres numeric comes back as a string — convert explicitly where used. */
  amount_collected: string | null;
  confirm_remarks: string | null;
  requested_at: string;
  decided_at: string | null;
  decided_by_block: BlockCode | null;
  decision_reason: string | null;
}

export interface BookingEvent {
  id: string;
  booking_id: string;
  event: string;
  actor_block: BlockCode | null;
  note: string | null;
  old_starts_at: string | null;
  old_ends_at: string | null;
  new_starts_at: string | null;
  new_ends_at: string | null;
  /** Postgres numeric comes back as a string — convert explicitly where used. */
  amount: string | null;
  at: string;
}

export interface PublicCalendarRow {
  id: string;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  kind: BookingKind;
  label: string;
}
