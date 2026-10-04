"use server";

import { redirect } from "next/navigation";
import { destroySession } from "@/lib/session";

export async function signOutAction(): Promise<void> {
  destroySession();
  redirect("/login");
}
