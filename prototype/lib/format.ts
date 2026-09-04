import { formatDistanceToNowStrict, format } from "date-fns";

export function relativeTime(iso: string): string {
  return `${formatDistanceToNowStrict(new Date(iso), { addSuffix: true })}`;
}

export function fullDateTime(iso: string): string {
  return format(new Date(iso), "d MMM yyyy, h:mm a");
}

export function fullDate(iso: string): string {
  return format(new Date(iso), "d MMM yyyy");
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
