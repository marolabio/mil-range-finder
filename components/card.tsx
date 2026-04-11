import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function Card({ title, subtitle, children, action, className = "" }: CardProps) {
  return (
    <section className={`field-card rounded-[1.5rem] p-4 sm:p-5 ${className}`}>
      {(title || subtitle || action) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title ? <h2 className="text-lg font-semibold tracking-wide">{title}</h2> : null}
            {subtitle ? (
              <p className="mt-1 text-sm leading-5 text-white/68">{subtitle}</p>
            ) : null}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
