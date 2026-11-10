"use client";

import { useState } from "react";

export function PasswordInput({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? "text" : "password"} className={`${className} pr-16`} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 rounded-r-lg px-4 text-sm font-medium text-[#0f3d2e] hover:text-[#b9831f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b9831f]"
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}
