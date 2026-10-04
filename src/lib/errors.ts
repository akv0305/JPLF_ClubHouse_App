import { fmtRange } from "./time";

export interface DbConflict {
  id: string;
  startsAt: string;
  endsAt: string;
}

export interface DbErrorInfo {
  code: string;
  friendlyMessage: string;
  conflict?: DbConflict;
}

const GENERIC = "Something went wrong. Please try again.";

function rawMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message ?? "");
  }
  return "";
}

function pgCode(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    return String((err as { code: unknown }).code ?? "");
  }
  return "";
}

/** Map a Postgres exception raised by the booking functions to friendly text. */
export function parseDbError(err: unknown): DbErrorInfo {
  const raw = rawMessage(err);
  const code = pgCode(err);

  const slot = raw.match(/SLOT_CONFLICT:([^|]+)\|([^|]+)\|([^|\s]+)/);
  if (slot) {
    const conflict: DbConflict = { id: slot[1].trim(), startsAt: slot[2].trim(), endsAt: slot[3].trim() };
    return {
      code: "SLOT_CONFLICT",
      conflict,
      friendlyMessage: `That clashes with a confirmed booking (${fmtRange(
        conflict.startsAt,
        conflict.endsAt,
      )}). Please pick another time.`,
    };
  }
  if (raw.includes("SLOT_CONFLICT")) {
    return {
      code: "SLOT_CONFLICT",
      friendlyMessage: "That time clashes with a confirmed booking. Please pick another time.",
    };
  }

  const owner = raw.match(/NOT_OWNER:([^\s|]+)/);
  if (owner) {
    return { code: "NOT_OWNER", friendlyMessage: `Only ${owner[1]} Block can act on this booking.` };
  }
  if (raw.includes("NOT_OWNER")) {
    return { code: "NOT_OWNER", friendlyMessage: "Only the owner block can act on this booking." };
  }

  if (raw.includes("NOT_PENDING") || raw.includes("NOT_CONFIRMED")) {
    return {
      code: raw.includes("NOT_PENDING") ? "NOT_PENDING" : "NOT_CONFIRMED",
      friendlyMessage: "This booking has already been actioned. Refresh the page.",
    };
  }

  if (raw.includes("BAD_AMOUNT")) {
    return { code: "BAD_AMOUNT", friendlyMessage: "Enter an amount greater than zero." };
  }
  if (raw.includes("BAD_PHONE")) {
    return { code: "BAD_PHONE", friendlyMessage: "Enter a valid 10-digit mobile number." };
  }
  if (raw.includes("BAD_BLOCK")) {
    return { code: "BAD_BLOCK", friendlyMessage: "Select a valid block." };
  }
  if (raw.includes("TOO_MANY_PENDING")) {
    return {
      code: "TOO_MANY_PENDING",
      friendlyMessage: "You already have 3 pending requests. Please wait for a response.",
    };
  }
  if (raw.includes("REASON_REQUIRED")) {
    return { code: "REASON_REQUIRED", friendlyMessage: "A reason is required." };
  }

  if (code === "23P01") {
    return {
      code: "23P01",
      friendlyMessage: "That slot was just booked by someone else. Please pick another time.",
    };
  }

  return { code: code || "UNKNOWN", friendlyMessage: GENERIC };
}
