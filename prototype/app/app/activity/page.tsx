import {
  UserPlus,
  FileStack,
  Link2,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Bell,
} from "lucide-react";
import { listActivity } from "@/lib/store/queries";
import { EmptyState } from "@/components/ui/EmptyState";
import { relativeTime, fullDateTime } from "@/lib/format";
import type { ActivityType } from "@/lib/types";

export const dynamic = "force-dynamic";

const ICONS: Record<ActivityType, typeof UserPlus> = {
  client_created: UserPlus,
  request_created: FileStack,
  link_opened: Link2,
  document_uploaded: Upload,
  document_replaced: RefreshCw,
  document_removed: Trash2,
  request_completed: CheckCircle2,
  reminder_sent: Bell,
};

export default async function ActivityPage() {
  const activity = await listActivity();

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink">
          Activity
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Everything happening across your clients, most recent first.
        </p>
      </header>

      {activity.length === 0 ? (
        <EmptyState title="No activity yet" description="Actions will show up here." />
      ) : (
        <ul className="flex flex-col gap-0.5">
          {activity.map((a) => {
            const Icon = ICONS[a.type];
            return (
              <li
                key={a.id}
                className="flex items-start gap-3 rounded-[var(--radius-sm)] px-2 py-2.5 hover:bg-surface-subtle"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-ink-muted">
                  <Icon size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] text-ink">{a.message}</p>
                </div>
                <time
                  title={fullDateTime(a.created_at)}
                  className="shrink-0 whitespace-nowrap pt-0.5 text-[12px] text-ink-faint"
                >
                  {relativeTime(a.created_at)}
                </time>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
