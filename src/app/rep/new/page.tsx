import { Card } from "@/components/ui/Card";
import { NewBookingForm } from "./NewBookingForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "New booking" };

export default function NewBookingPage() {
  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <h2 className="text-base font-semibold text-[#1C1917]">New booking</h2>
        <p className="mt-1 text-sm text-[#78716C]">
          Create a booking on behalf of your block. It is confirmed immediately.
        </p>
        <div className="mt-5">
          <NewBookingForm />
        </div>
      </Card>
    </div>
  );
}
