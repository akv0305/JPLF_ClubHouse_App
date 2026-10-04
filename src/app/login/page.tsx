import { Card } from "@/components/ui/Card";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Rep Login" };

interface LoginPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const error = typeof searchParams.error === "string" ? searchParams.error : undefined;
  const msg = typeof searchParams.msg === "string" ? searchParams.msg : undefined;

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center py-6 sm:py-12">
      <Card>
        <h1 className="text-lg font-semibold text-[#1C1917]">Rep Login</h1>
        <p className="mt-1 text-sm text-[#78716C]">
          Sign in with your block&apos;s shared credentials.
        </p>

        {msg === "password-changed" && (
          <p className="mt-4 rounded-xl bg-[#0F766E]/10 px-3 py-2 text-sm text-[#0F766E]">
            Password changed. Please sign in again.
          </p>
        )}

        <LoginForm initialError={error} />
      </Card>
    </div>
  );
}
