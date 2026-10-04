"use server";

import { revalidatePath } from "next/cache";
import { requireBlock } from "@/lib/auth";
import { query } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePhone(raw: string): string {
  let value = raw.replace(/[^\d+]/g, "");
  if (value.startsWith("+91")) value = value.slice(3);
  else if (value.startsWith("+")) value = value.slice(1);
  if (value.startsWith("0")) value = value.slice(1);
  return value.replace(/\D/g, "");
}

export interface ContactsState {
  ok?: boolean;
  error?: string;
}

export async function updateBlockContactsAction(
  repNames: string[],
  phones: string[],
  emails: string[],
): Promise<ContactsState> {
  const block = await requireBlock();

  const names = repNames.map((name) => name.trim()).filter(Boolean);
  const phoneList = phones
    .map((phone) => phone.trim())
    .filter(Boolean)
    .map(normalizePhone);
  const emailList = emails.map((email) => email.trim()).filter(Boolean);

  if (phoneList.some((phone) => !/^\d{10}$/.test(phone))) {
    return { error: "Enter valid 10-digit phone numbers." };
  }
  if (emailList.some((email) => !EMAIL_RE.test(email))) {
    return { error: "Enter valid email addresses." };
  }

  await query`update blocks set rep_names = ${names}, phones = ${phoneList}, emails = ${emailList} where code = ${block}`;
  revalidatePath("/rep/profile");
  revalidatePath("/contacts");
  return { ok: true };
}
