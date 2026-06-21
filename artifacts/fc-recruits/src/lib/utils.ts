import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getOvrColor(ovr: number): string {
  if (ovr >= 85) return "text-yellow-400 border-yellow-400";
  if (ovr >= 75) return "text-slate-300 border-slate-300";
  return "text-amber-700 border-amber-700";
}

export function getOvrBg(ovr: number): string {
  if (ovr >= 85) return "bg-yellow-400/10 border-yellow-400/40 text-yellow-300";
  if (ovr >= 75) return "bg-slate-400/10 border-slate-400/40 text-slate-300";
  return "bg-amber-700/10 border-amber-700/40 text-amber-600";
}

export function getPositionColor(position: string | null | undefined): string {
  if (!position) return "bg-gray-500/20 text-gray-400";
  const pos = position.toUpperCase();
  if (pos === "GK") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  if (["CB", "RB", "LB", "RWB", "LWB"].includes(pos)) return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  if (["CDM", "CM", "CAM"].includes(pos)) return "bg-green-500/20 text-green-400 border-green-500/30";
  if (["RM", "LM", "RW", "LW"].includes(pos)) return "bg-purple-500/20 text-purple-400 border-purple-500/30";
  if (["ST", "CF", "SS"].includes(pos)) return "bg-red-500/20 text-red-400 border-red-500/30";
  return "bg-gray-500/20 text-gray-400 border-gray-500/30";
}

export function getPlatformColor(platform: string | null | undefined): string {
  if (!platform) return "bg-gray-500/20 text-gray-400";
  const p = platform.toUpperCase();
  if (p === "PS5") return "bg-blue-600/20 text-blue-300 border-blue-600/30";
  if (p === "XBOX") return "bg-green-600/20 text-green-300 border-green-600/30";
  if (p === "PC") return "bg-orange-500/20 text-orange-300 border-orange-500/30";
  return "bg-gray-500/20 text-gray-400 border-gray-500/30";
}

export function getStatusColor(status: string | null | undefined): string {
  switch (status) {
    case "pending": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "accepted": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "scheduled": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "completed": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "rejected": return "bg-red-500/20 text-red-400 border-red-500/30";
    case "cancelled": return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return "";
  return time;
}

export function parseDays(days: string | null | undefined): string[] {
  if (!days) return [];
  try { return JSON.parse(days); } catch { return []; }
}

export function parsePositions(positions: string | null | undefined): string[] {
  if (!positions) return [];
  try { return JSON.parse(positions); } catch { return []; }
}
