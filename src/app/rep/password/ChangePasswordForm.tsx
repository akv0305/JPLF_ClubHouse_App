"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { changePasswordAction, type ChangePasswordState } from "./actions";

const inputClass =
  "w-full min-h-[44px] rounded-xl border border-[#E7E5E4] bg-white px-3 text-sm text-[#1C1917] outline-none transition focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]";

export function ChangePasswordForm() {
  const [state, setState] = useState<ChangePasswordState>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPending(true);
    try {
      const result = await changePasswordAction(formData);
      if (result) setState(result);
    } catch {
      setState({ error: "Something went wrong. Please try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Current password" htmlFor="oldPassword">
        <input
          id="oldPassword"
          name="oldPassword"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </Field>
      <Field label="Block code" htmlFor="blockCode" hint="The code issued to your block.">
        <input
          id="blockCode"
          name="blockCode"
          type="password"
          autoComplete="off"
          required
          className={inputClass}
        />
      </Field>
      <Field label="New password" htmlFor="newPassword" hint="At least 8 characters.">
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          className={inputClass}
        />
      </Field>
      <Field label="Confirm new password" htmlFor="confirmPassword">
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className={inputClass}
        />
      </Field>

      {state.error && <p className="text-sm text-[#B91C1C]">{state.error}</p>}

      <Button type="submit" loading={pending} className="w-full">
        Change password
      </Button>
    </form>
  );
}
