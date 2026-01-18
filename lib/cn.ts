import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Design system utility classes
export const designClasses = {
  // Text colors
  textPrimary: "text-white",
  textSecondary: "text-gray-400",
  textMuted: "text-gray-500",
  textLight: "text-gray-300",
  
  // Backgrounds
  bgPrimary: "bg-[#0A0E1A]",
  bgSecondary: "bg-[#111827]",
  bgCard: "bg-[#151B2B]",
  bgCardHover: "bg-[#1A2139]",
  
  // Borders
  borderDefault: "border-[rgba(255,255,255,0.05)]",
  borderLight: "border-[rgba(79,127,255,0.1)]",
  
  // Buttons
  btnPrimary: "bg-[#4F7FFF] hover:bg-[#6B92FF] text-white",
  btnSecondary: "bg-transparent border border-[#4F7FFF] text-[#4F7FFF] hover:bg-[#4F7FFF] hover:text-white",
  
  // Cards
  card: "bg-[#151B2B] border border-[rgba(255,255,255,0.05)] rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.2)]",
  cardHover: "hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(79,127,255,0.15)] hover:border-[rgba(79,127,255,0.2)]",
};
