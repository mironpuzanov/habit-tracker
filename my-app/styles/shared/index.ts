// Common styling utilities that can be used in both external and internal parts
// These are typically common classes or styling constants

import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Combines Tailwind classes using clsx and twMerge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Export additional styling utilities as needed 