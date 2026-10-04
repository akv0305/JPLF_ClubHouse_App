import { Card } from "@/components/ui/Card";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const metadata = { title: "Change password" };

export default function ChangePasswordPage() {
  return (
    <Card className="max-w-lg">
      <h2 className="text-base font-semibold text-[#1C1917]">Change password</h2>
      <p className="mt-1 text-sm text-[#78716C]">
        Update the shared password for your block. You will be signed out afterwards.
      </p>
      <div className="mt-5">
        <ChangePasswordForm />
      </div>
    </Card>
  );
}
