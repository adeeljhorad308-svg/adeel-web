import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind class names with correct conflict resolution.
 * `clsx` handles conditional composition; `twMerge` de-duplicates conflicting
 * Tailwind utilities so the last one wins predictably.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
