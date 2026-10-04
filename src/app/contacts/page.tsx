import { Card } from "@/components/ui/Card";
import { query } from "@/lib/db";
import { BLOCK_DISPLAY_ORDER } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Block contacts" };

interface BlockRow {
  code: string;
  display_name: string;
  rep_names: string[];
  phones: string[];
}

export default async function ContactsPage() {
  const blocks = await query<BlockRow>`
    select code, display_name, rep_names, phones from blocks`;
  const order = BLOCK_DISPLAY_ORDER as readonly string[];
  const ordered = [...blocks].sort((a, b) => order.indexOf(a.code) - order.indexOf(b.code));

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-lg font-semibold text-[#1C1917]">Block contacts</h1>
      <p className="mt-1 text-sm text-[#78716C]">
        Call your block representative to confirm or discuss a booking.
      </p>

      <div className="mt-5 space-y-4">
        {ordered.map((block) => (
          <Card key={block.code}>
            <h2 className="text-sm font-semibold text-[#1C1917]">{block.display_name}</h2>
            {block.rep_names.length === 0 && block.phones.length === 0 ? (
              <p className="mt-2 text-sm text-[#78716C]">No contacts listed yet.</p>
            ) : (
              <>
                {block.rep_names.length > 0 && (
                  <p className="mt-2 text-sm text-[#1C1917]">{block.rep_names.join(" & ")}</p>
                )}
                {block.phones.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {block.phones.map((phone, index) => (
                      <a
                        key={index}
                        href={`tel:${phone}`}
                        className="inline-flex min-h-[44px] items-center rounded-xl border border-[#E7E5E4] px-3 text-sm font-medium text-[#0F766E] transition hover:bg-[#FAFAF9]"
                      >
                        {phone}
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
