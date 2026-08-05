export function timeAgoHindi(iso: string | null | undefined): string {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "अभी";
  if (diff < 3600) return `${Math.floor(diff / 60)} मिनट पहले`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} घंटे पहले`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} दिन पहले`;
  return new Date(iso).toLocaleDateString("hi-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function toDevanagariNumber(n: number): string {
  return n.toLocaleString("hi-IN");
}