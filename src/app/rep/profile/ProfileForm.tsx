"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { updateBlockContactsAction, type ContactsState } from "./actions";

const inputClass =
  "w-full min-h-[44px] rounded-xl border border-[#E7E5E4] bg-white px-3 text-sm text-[#1C1917] outline-none transition focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]";

function ListEditor({
  label,
  addLabel,
  type,
  values,
  onChange,
}: {
  label: string;
  addLabel: string;
  type?: "tel" | "email";
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-[#1C1917]">{label}</p>
      <div className="mt-1.5 space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              value={value}
              type={type}
              inputMode={type === "tel" ? "tel" : undefined}
              autoComplete="off"
              onChange={(event) =>
                onChange(values.map((item, i) => (i === index ? event.target.value : item)))
              }
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              aria-label={`Remove ${label.toLowerCase()}`}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#E7E5E4] text-[#78716C] transition hover:bg-[#FAFAF9]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...values, ""])}
          className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-[#0F766E]"
        >
          <Plus className="h-4 w-4" /> Add {addLabel}
        </button>
      </div>
    </div>
  );
}

export function ProfileForm({
  repNames,
  phones,
  emails,
}: {
  repNames: string[];
  phones: string[];
  emails: string[];
}) {
  const [names, setNames] = useState(repNames.length ? repNames : [""]);
  const [phoneList, setPhoneList] = useState(phones.length ? phones : [""]);
  const [emailList, setEmailList] = useState(emails.length ? emails : [""]);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<ContactsState>({});

  async function save() {
    setPending(true);
    setState({});
    try {
      const result = await updateBlockContactsAction(names, phoneList, emailList);
      setState(result);
    } catch {
      setState({ error: "Something went wrong. Please try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
      className="space-y-5"
    >
      <ListEditor label="Rep names" addLabel="rep name" values={names} onChange={setNames} />
      <ListEditor
        label="Phone numbers"
        addLabel="phone"
        type="tel"
        values={phoneList}
        onChange={setPhoneList}
      />
      <ListEditor
        label="Email addresses"
        addLabel="email"
        type="email"
        values={emailList}
        onChange={setEmailList}
      />

      {state.error && (
        <p role="alert" className="rounded-xl bg-[#B91C1C]/10 px-3 py-2 text-sm text-[#B91C1C]">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="text-sm font-medium text-[#0F766E]">
          Saved.
        </p>
      )}

      <Button type="submit" loading={pending} disabled={pending}>
        Save changes
      </Button>
    </form>
  );
}
