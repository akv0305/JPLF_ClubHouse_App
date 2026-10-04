"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { checkAvailability, type AvailabilityResult } from "@/app/request/actions";
import { createRepBookingAction, type RepBookingField, type RepBookingState } from "@/app/rep/actions";
import { durationLabel, fmtRange, istLocalToUtc } from "@/lib/time";
import { BLOCK_DISPLAY_ORDER, type BlockCode } from "@/lib/types";

const inputClass =
  "w-full min-h-[44px] rounded-xl border border-[#E7E5E4] bg-white px-3 text-sm text-[#1C1917] outline-none transition focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]";

const KINDS = [
  { value: "outsider", label: "Outsider" },
  { value: "resident", label: "Resident walk-in" },
  { value: "blackout", label: "Blackout" },
] as const;

type Kind = (typeof KINDS)[number]["value"];

function normalizePhone(raw: string): string {
  let value = raw.replace(/[^\d+]/g, "");
  if (value.startsWith("+91")) value = value.slice(3);
  else if (value.startsWith("+")) value = value.slice(1);
  if (value.startsWith("0")) value = value.slice(1);
  return value.replace(/\D/g, "");
}

export function NewBookingForm() {
  const [kind, setKind] = useState<Kind>("outsider");
  const [name, setName] = useState("");
  const [block, setBlock] = useState<BlockCode | "">("");
  const [flatNo, setFlatNo] = useState("");
  const [phone, setPhone] = useState("");
  const [fromLocal, setFromLocal] = useState("");
  const [toLocal, setToLocal] = useState("");
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [state, setState] = useState<RepBookingState>({});
  const [pending, setPending] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [checking, setChecking] = useState(false);

  const isBlackout = kind === "blackout";
  const fromUtc = fromLocal ? istLocalToUtc(fromLocal) : null;
  const toUtc = toLocal ? istLocalToUtc(toLocal) : null;
  const rangeValid = Boolean(
    fromUtc && toUtc && new Date(toUtc).getTime() > new Date(fromUtc).getTime(),
  );
  const duration = rangeValid && fromUtc && toUtc ? durationLabel(fromUtc, toUtc) : null;
  const confirmedClash = availability?.confirmed[0];
  const pendingClash = availability?.pending ?? [];

  useEffect(() => {
    if (!rangeValid || !fromUtc || !toUtc) {
      setAvailability(null);
      setChecking(false);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(async () => {
      setChecking(true);
      try {
        const result = await checkAvailability(fromUtc, toUtc);
        if (!cancelled) setAvailability(result);
      } catch {
        if (!cancelled) setAvailability(null);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [rangeValid, fromUtc, toUtc]);

  function clearFieldError(field: RepBookingField) {
    setState((prev) => {
      if (!prev.fieldErrors?.[field]) return prev;
      const fieldErrors = { ...prev.fieldErrors };
      delete fieldErrors[field];
      return { ...prev, fieldErrors };
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || confirmedClash) return;
    const normalized = normalizePhone(phone);
    setPhone(normalized);

    const formData = new FormData();
    formData.set("kind", kind);
    formData.set("name", name);
    formData.set("block", block);
    formData.set("flatNo", flatNo);
    formData.set("phone", normalized);
    formData.set("fromLocal", fromLocal);
    formData.set("toLocal", toLocal);
    formData.set("amount", amount);
    formData.set("remarks", remarks);

    setPending(true);
    setState({});
    try {
      const result = await createRepBookingAction(formData);
      if (result) setState(result);
    } catch {
      setState({ error: "Something went wrong. Please try again." });
    } finally {
      setPending(false);
    }
  }

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <fieldset>
        <legend className="block text-sm font-medium text-[#1C1917]">Booking type</legend>
        <div className="mt-1.5 grid grid-cols-3 gap-2" role="group" aria-label="Booking type">
          {KINDS.map((option) => {
            const selected = kind === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setKind(option.value);
                  setState({});
                }}
                className={`min-h-[44px] rounded-xl border px-2 text-xs font-medium transition ${
                  selected
                    ? "border-[#0F766E] bg-[#0F766E] text-white"
                    : "border-[#E7E5E4] bg-white text-[#1C1917] hover:bg-[#FAFAF9]"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {state.error && (
        <p role="alert" className="rounded-xl bg-[#B91C1C]/10 px-3 py-2 text-sm text-[#B91C1C]">
          {state.error}
        </p>
      )}

      {!isBlackout && (
        <Field label="Full name" htmlFor="name" error={fieldErrors.name}>
          <input
            id="name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              clearFieldError("name");
            }}
            required
            minLength={2}
            maxLength={60}
            autoComplete="name"
            className={inputClass}
          />
        </Field>
      )}

      {kind === "resident" && (
        <>
          <fieldset>
            <legend className="block text-sm font-medium text-[#1C1917]">Block</legend>
            <div className="mt-1.5 grid grid-cols-4 gap-2" role="group" aria-label="Block">
              {BLOCK_DISPLAY_ORDER.map((code) => {
                const selected = block === code;
                return (
                  <button
                    key={code}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setBlock(code);
                      clearFieldError("block");
                    }}
                    className={`min-h-[44px] rounded-xl border px-2 text-sm font-medium transition ${
                      selected
                        ? "border-[#0F766E] bg-[#0F766E] text-white"
                        : "border-[#E7E5E4] bg-white text-[#1C1917] hover:bg-[#FAFAF9]"
                    }`}
                  >
                    {code}
                  </button>
                );
              })}
            </div>
            {fieldErrors.block && (
              <p role="alert" className="mt-1.5 text-xs text-[#B91C1C]">
                {fieldErrors.block}
              </p>
            )}
          </fieldset>

          <Field label="Flat number" htmlFor="flatNo" error={fieldErrors.flatNo}>
            <input
              id="flatNo"
              value={flatNo}
              onChange={(event) => {
                setFlatNo(event.target.value.toUpperCase());
                clearFieldError("flatNo");
              }}
              required
              maxLength={10}
              autoCapitalize="characters"
              className={inputClass}
            />
          </Field>
        </>
      )}

      {!isBlackout && (
        <Field
          label="Mobile number"
          htmlFor="phone"
          error={fieldErrors.phone}
          hint="10 digits; spaces, hyphens and a leading +91 or 0 are removed."
        >
          <input
            id="phone"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              clearFieldError("phone");
            }}
            onBlur={() => setPhone(normalizePhone(phone))}
            required
            inputMode="tel"
            autoComplete="tel"
            maxLength={15}
            className={inputClass}
          />
        </Field>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="From" htmlFor="fromLocal" error={fieldErrors.fromLocal}>
          <input
            id="fromLocal"
            type="datetime-local"
            step={900}
            value={fromLocal}
            onChange={(event) => {
              setFromLocal(event.target.value);
              clearFieldError("fromLocal");
            }}
            required
            className={inputClass}
          />
        </Field>
        <Field label="To" htmlFor="toLocal" error={fieldErrors.toLocal}>
          <input
            id="toLocal"
            type="datetime-local"
            step={900}
            value={toLocal}
            onChange={(event) => {
              setToLocal(event.target.value);
              clearFieldError("toLocal");
            }}
            required
            className={inputClass}
          />
        </Field>
      </div>

      <div className="space-y-2">
        {duration && (
          <p className="text-sm text-[#78716C]">
            Duration: <span className="font-medium text-[#1C1917]">{duration}</span>
          </p>
        )}
        {checking && <p className="text-sm text-[#78716C]">Checking availability…</p>}
        {!checking && confirmedClash && (
          <div
            role="alert"
            className="rounded-xl border border-[#B91C1C]/30 bg-[#B91C1C]/10 px-3 py-2 text-sm text-[#B91C1C]"
          >
            <p className="font-medium">
              Clashing booking: {fmtRange(confirmedClash.startsAt, confirmedClash.endsAt)}
            </p>
            <p>This time is already booked. Pick another time to continue.</p>
          </div>
        )}
        {!checking && !confirmedClash && pendingClash.length > 0 && (
          <div className="rounded-xl border border-[#D97706]/30 bg-[#D97706]/10 px-3 py-2 text-sm text-[#D97706]">
            Someone else has also requested this time. Confirming this booking will automatically
            reject their request.
          </div>
        )}
      </div>

      {!isBlackout && (
        <Field label="Amount collected (₹)" htmlFor="amount" error={fieldErrors.amount} hint="Required.">
          <input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              clearFieldError("amount");
            }}
            className={inputClass}
          />
        </Field>
      )}

      <Field
        label={isBlackout ? "Reason" : "Remarks (optional)"}
        htmlFor="remarks"
        error={fieldErrors.remarks}
        hint={
          isBlackout
            ? "Shown on the public calendar as the reason the hall is unavailable."
            : "e.g. UPI ref 4412xxxx, or cash collected by Ramesh"
        }
      >
        <textarea
          id="remarks"
          value={remarks}
          onChange={(event) => {
            setRemarks(event.target.value);
            clearFieldError("remarks");
          }}
          required={isBlackout}
          maxLength={500}
          rows={3}
          className={`${inputClass} min-h-[88px] py-2`}
        />
      </Field>

      <Button
        type="submit"
        loading={pending}
        disabled={pending || Boolean(confirmedClash)}
        className="w-full"
      >
        Create booking
      </Button>
    </form>
  );
}
