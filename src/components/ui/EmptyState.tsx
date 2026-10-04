import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#E7E5E4] bg-white px-6 py-12 text-center">
      {Icon && <Icon className="h-6 w-6 text-[#78716C]" aria-hidden="true" />}
      <p className="text-sm font-medium text-[#1C1917]">{title}</p>
      {description && <p className="max-w-sm text-sm text-[#78716C]">{description}</p>}
    </div>
  );
}
