"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { loginAction, type LoginState } from "./actions";

const inputClass =
  "w-full min-h-[44px] rounded-xl border border-[#E7E5E4] bg-white px-3 text-sm text-[#1C1917] outline-none transition focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]";

function LockoutCountdown({ until }: { until: string }) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, new Date(until).getTime() - Date.now()),
  );

  useEffect(() => {
    const id = setInterval(
      () => setRemaining(Math.max(0, new Date(until).getTime() - Date.now())),
      1000,
    );
    return () => clearInterval(id);
  }, [until]);

  if (remaining <= 0) {
    return <p className="text-sm text-[#B91C1C]">You can try again now.</p>;
  }
  const total = Math.ceil(remaining / 1000);
  return (
    <p className="text-sm text-[#B91C1C]">
      Too many failed attempts. Try again in {Math.floor(total / 60)}m {total % 60}s.
    </p>
  );
}

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, setState] = useState<LoginState>(initialError ? { error: initialError } : {});
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPending(true);
    try {
      const result = await loginAction(formData);
      if (result) setState(result);
    } catch {
      setState({ error: "Something went wrong. Please try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-4">
      <Field label="Username" htmlFor="username">
        <input
          id="username"
          name="username"
          autoComplete="username"
          required
          className={inputClass}
        />
      </Field>
      <Field label="Password" htmlFor="password">
        <div className="relative">
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            className={`${inputClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShow((value) => !value)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#78716C]"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>

      {state.lockedUntil ? (
        <LockoutCountdown until={state.lockedUntil} />
      ) : state.error ? (
        <p className="text-sm text-[#B91C1C]">{state.error}</p>
      ) : null}

      <Button type="submit" loading={pending} className="w-full">
        Sign in
      </Button>
      <p className="text-center text-xs text-[#78716C]">
        Lost access? Contact the society secretary.
      </p>
    </form>
  );
}
