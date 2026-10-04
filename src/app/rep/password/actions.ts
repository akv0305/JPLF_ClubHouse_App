"use server";

import { redirect } from "next/navigation";
import { AuthError, changePassword, requireBlock } from "@/lib/auth";
import { destroySession } from "@/lib/session";

export interface ChangePasswordState {
  error?: string;
}

export async function changePasswordAction(formData: FormData): Promise<ChangePasswordState> {
  const block = await requireBlock();

  const oldPassword = String(formData.get("oldPassword") ?? "");
  const blockCode = String(formData.get("blockCode") ?? "").trim();
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!oldPassword || !blockCode || !newPassword || !confirmPassword) {
    return { error: "All fields are required." };
  }
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match." };
  }

  try {
    await changePassword(block, oldPassword, blockCode, newPassword);
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    return { error: "Could not change the password. Please try again." };
  }

  destroySession();
  redirect("/login?msg=password-changed");
}
