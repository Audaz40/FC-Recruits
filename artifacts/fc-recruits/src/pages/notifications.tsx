import { Link } from "wouter";
import { useListNotifications, useUpdateNotification, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Trophy, Shield, Star, Check, CheckCheck, Calendar, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  tryout_request:   { icon: Trophy,   color: "text-primary",    label: "Tryout Request" },
  tryout_accepted:  { icon: Check,    color: "text-blue-400",   label: "Tryout Accepted" },
  tryout_rejected:  { icon: Shield,   color: "text-red-400",    label: "Tryout Rejected" },
  tryout_scheduled: { icon: Calendar, color: "text-purple-400", label: "Tryout Scheduled" },
  tryout_rated:     { icon: Star,     color: "text-yellow-400", label: "New Rating" },
  club_invite:      { icon: Shield,   color: "text-primary",    label: "Club Invitation" },
};

export default function Notifications() {
  const qc = useQueryClient();
  const { data, isLoading } = useListNotifications({ query: { queryKey: getListNotificationsQueryKey() } });
  const updateNotification = useUpdateNotification();

  const markRead = (id: number) => {
    updateNotification.mutate({ id, data: { read: true } }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() })
    });
  };

  const markAllRead = () => {
    const unread = (data?.notifications || []).filter(n => !n.read);
    unread.forEach(n => markRead(n.id));
  };

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-muted-foreground mt-1">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllRead} variant="outline" size="sm" className="font-bold uppercase tracking-wider gap-2">
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-border rounded-xl">
          <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-black uppercase italic tracking-tight mb-2">All Clear</h3>
          <p className="text-muted-foreground">No notifications yet. Activity will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const config = TYPE_CONFIG[n.type] || { icon: Bell, color: "text-muted-foreground", label: n.type };
            const Icon = config.icon;
            return (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-xl border transition-all",
                  n.read
                    ? "bg-card border-border opacity-60"
                    : "bg-card border-primary/20 shadow-[0_0_10px_rgba(132,255,89,0.05)]"
                )}
              >
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-secondary border border-border", config.color)}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn("text-xs font-bold uppercase tracking-wider", config.color)}>
                      {config.label}
                    </span>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-foreground font-medium leading-snug">{n.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(n.createdAt)}
                    </span>
                    {n.relatedId && (
                      <Link href="/tryouts">
                        <span className="text-xs font-bold text-primary hover:underline cursor-pointer">
                          View Tryout
                        </span>
                      </Link>
                    )}
                  </div>
                </div>

                {!n.read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
