import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function removeCountryCode(phone: string): string {
  if (!phone) return phone;
  const digits = phone.replace(/\D/g, '');
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

export function transformRecordingUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url;
}
