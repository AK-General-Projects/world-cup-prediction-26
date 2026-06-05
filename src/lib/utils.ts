import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function flagEmoji(code: string): string {
  if (code === "gb-eng") return "🏴󠁧󠁢󠁥󠁮󠁧󠁿";
  if (code === "gb-sct") return "🏴󠁧󠁢󠁳󠁣󠁴󠁿";
  const letters = code.slice(0, 2).toUpperCase();
  return String.fromCodePoint(
    ...letters.split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}
