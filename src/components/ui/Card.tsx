interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className = "", ...rest }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-[#E7E5E4] bg-white p-5 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
