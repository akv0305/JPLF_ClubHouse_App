import { Card } from "@/components/ui/Card";
import { requireBlock } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { BLOCK_DISPLAY_ORDER } from "@/lib/types";
import { ProfileForm } from "./ProfileForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Block profile" };

interface BlockRow {
  code: string;
  display_name: string;
  rep_names: string[];
  phones: string[];
  emails: string[];
}

function byDisplayOrder(a: BlockRow, b: BlockRow): number {
  const order = BLOCK_DISPLAY_ORDER as readonly string[];
  return order.indexOf(a.code) - order.indexOf(b.code);
}

export default async function ProfilePage() {
  const myBlock = await requireBlock();

  const mine = await queryOne<BlockRow>`
    select code, display_name, rep_names, phones, emails from blocks where code = ${myBlock} limit 1`;
  const others = await query<BlockRow>`
    select code, display_name, rep_names, phones, emails from blocks where code <> ${myBlock}`;
  const orderedOthers = [...others].sort(byDisplayOrder);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <h2 className="text-base font-semibold text-[#1C1917]">
          {mine?.display_name ?? `${myBlock} Block`}
        </h2>
        <p className="mt-1 text-sm text-[#78716C]">
          These are the details for your block. They are shared by both reps.
        </p>
        <div className="mt-5">
          <ProfileForm
            repNames={mine?.rep_names ?? []}
            phones={mine?.phones ?? []}
            emails={mine?.emails ?? []}
          />
        </div>
        <p className="mt-5 border-t border-[#E7E5E4] pt-4 text-xs text-[#78716C]">
          Email and phone details are stored for a future notifications feature and are not used to
          send anything yet.
        </p>
      </Card>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#78716C]">
          Other blocks
        </h2>
        <div className="mt-3 space-y-3">
          {orderedOthers.map((block) => (
            <Card key={block.code}>
              <h3 className="text-sm font-semibold text-[#1C1917]">{block.display_name}</h3>
              <dl className="mt-2 space-y-1 text-sm">
                <div className="flex gap-2">
                  <dt className="text-[#78716C]">Reps</dt>
                  <dd className="min-w-0 break-words text-[#1C1917]">
                    {block.rep_names.length ? block.rep_names.join(" & ") : "—"}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-[#78716C]">Phones</dt>
                  <dd className="min-w-0 break-words text-[#1C1917]">
                    {block.phones.length ? block.phones.join(", ") : "—"}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-[#78716C]">Emails</dt>
                  <dd className="min-w-0 break-words text-[#1C1917]">
                    {block.emails.length ? block.emails.join(", ") : "—"}
                  </dd>
                </div>
              </dl>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
