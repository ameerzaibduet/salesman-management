"use client";

import { useFormStatus } from "react-dom";

function Spinner() {
  return (
    <svg className="h-4 w-4 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-90" />
    </svg>
  );
}

/**
 * Submit button for forms that use server actions. While the action runs it shows a
 * spinner and is disabled, so a second click (or Enter key) cannot send the form twice.
 * Must be rendered inside the <form>.
 */
export function SubmitButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  return (
    <button
      {...props}
      type="submit"
      disabled={pending || props.disabled}
      aria-busy={pending}
      className={`${className} inline-flex items-center justify-center gap-1.5 disabled:cursor-wait disabled:opacity-60`}
    >
      {pending && <Spinner />}
      {children}
    </button>
  );
}
