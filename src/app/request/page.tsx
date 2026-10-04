import { Card } from "@/components/ui/Card";
import { RequestForm } from "./RequestForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Request a booking" };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface RequestPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function RequestPage({ searchParams }: RequestPageProps) {
  const date =
    typeof searchParams.date === "string" && DATE_RE.test(searchParams.date)
      ? searchParams.date
      : undefined;

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <h1 className="text-lg font-semibold text-[#1C1917]">Submit Booking Request</h1>
        <p className="mt-1 text-sm text-[#78716C]">
          Your block representative will review this and confirm the booking.
        </p>
        <div className="mt-5">
          <RequestForm defaultDate={date} />
        </div>
      </Card>
    </div>
  );
}
