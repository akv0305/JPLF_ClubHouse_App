interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-[#1C1917]">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-[#78716C]">{hint}</p>}
      {error && <p className="text-xs text-[#B91C1C]">{error}</p>}
    </div>
  );
}
