import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const maskId = (id: string) => {
  if (!id) return "---";
  return id.substring(0, 4) + "****" + id.substring(id.length - 4);
};
