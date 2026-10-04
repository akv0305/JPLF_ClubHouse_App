"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError, login } from "@/lib/auth";

export interface LoginState {
  error?: string;
  lockedUntil?: string;
}

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

// Best-effort only: this Map lives in a single serverless instance's memory, so on
// Netlify it is per-instance and not shared — a real limit needs a shared store.
const attempts = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((at) => now - at < WINDOW_MS);
  if (recent.length >= MAX_ATTEMPTS) {
    attempts.set(ip, recent);
    return true;
  }
  recent.push(now);
  attempts.set(ip, recent);
  return false;
}

function clientIp(): string {
  const requestHeaders = headers();
  const forwarded = requestHeaders.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return requestHeaders.get("x-real-ip") ?? "unknown";
}

export async function loginAction(formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Enter your username and password." };
  }

  if (isRateLimited(clientIp())) {
    return { error: "Too many attempts from this device. Please try again later." };
  }

  try {
    await login(username, password);
  } catch (err) {
    if (err instanceof AuthError && err.code === "LOCKED") {
      return { error: err.message, lockedUntil: err.lockedUntil };
    }
    return { error: "Invalid username or password." };
  }

  redirect("/rep");
}
