import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { todayIst } from "@/lib/time";

export const dynamic = "force-dynamic";

export const metadata = { title: "Export bookings" };

const inputClass =
  "w-full min-h-[44px] rounded-xl border border-[#E7E5E4] bg-white px-3 text-sm text-[#1C1917] outline-none transition focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]";

export default function ExportPage() {
  const today = todayIst();
  const firstOfMonth = `${today.slice(0, 7)}-01`;

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <h2 className="text-base font-semibold text-[#1C1917]">Export bookings</h2>
        <p className="mt-1 text-sm text-[#78716C]">
          Download a CSV of every booking that touches the selected dates. Dates are IST.
        </p>
        <form action="/rep/export/download" method="get" className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="From" htmlFor="from">
              <input
                id="from"
                name="from"
                type="date"
                defaultValue={firstOfMonth}
                required
                className={inputClass}
              />
            </Field>
            <Field label="To" htmlFor="to">
              <input
                id="to"
                name="to"
                type="date"
                defaultValue={today}
                required
                className={inputClass}
              />
            </Field>
          </div>
          <Button type="submit">Download CSV</Button>
        </form>
      </Card>
    </div>
  );
}
