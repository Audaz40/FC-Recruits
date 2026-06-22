import { useState } from "react";
import { Link } from "wouter";
import {
  useGetMyPlayer, useListTryouts, useUpdateTryout, useRateTryout,
  getListTryoutsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Trophy, Shield, User, Clock, Check, X, Calendar, Star,
  ArrowRight, Inbox, Send
} from "lucide-react";
import { cn, getStatusColor, getPositionColor, getOvrColor } from "@/lib/utils";
import type { Tryout } from "@workspace/api-client-react";

type ActionType = "accept" | "reject" | "schedule" | "rate" | null;

export default function Tryouts() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: myPlayer, isLoading: playerLoading } = useGetMyPlayer();

  const isCaptain = myPlayer?.clubId && myPlayer?.id === myPlayer?.id; // always true when clubId exists — refine below

  const { data: incomingData, isLoading: loadingIn } = useListTryouts(
    { clubId: myPlayer?.clubId || undefined },
    { query: { enabled: !!myPlayer?.clubId, queryKey: getListTryoutsQueryKey({ clubId: myPlayer?.clubId || undefined }) } }
  );
  const { data: outgoingData, isLoading: loadingOut } = useListTryouts(
    { playerId: myPlayer?.id || undefined },
    { query: { enabled: !!myPlayer?.id, queryKey: getListTryoutsQueryKey({ playerId: myPlayer?.id || undefined }) } }
  );

  const updateTryout = useUpdateTryout();
  const rateTryout = useRateTryout();

  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");
  const [action, setAction] = useState<{ tryout: Tryout; type: ActionType } | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState("");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListTryoutsQueryKey({ clubId: myPlayer?.clubId || undefined }) });
    qc.invalidateQueries({ queryKey: getListTryoutsQueryKey({ playerId: myPlayer?.id || undefined }) });
  };

  const doUpdate = (id: number, status: string, extra: Record<string, any> = {}) => {
    updateTryout.mutate({ id, data: { status, ...extra } }, {
      onSuccess: () => { invalidate(); setAction(null); toast({ title: `Tryout ${status}` }); },
      onError: () => toast({ title: "Error", description: "Could not update tryout.", variant: "destructive" })
    });
  };

  const doRate = (id: number, ratedBy: string) => {
    rateTryout.mutate({ id, data: { ratedBy, score: ratingScore, comment: ratingComment || undefined } }, {
      onSuccess: () => { invalidate(); setAction(null); toast({ title: "Rating submitted!" }); },
      onError: () => toast({ title: "Error", description: "Could not submit rating.", variant: "destructive" })
    });
  };

  if (playerLoading) {
    return <div className="container mx-auto px-4 py-8"><Skeleton className="h-96 w-full" /></div>;
  }

  if (!myPlayer) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-black uppercase italic tracking-tight mb-2">No Profile</h2>
        <p className="text-muted-foreground mb-6">Create a player profile to access tryouts.</p>
        <Button asChild className="font-bold uppercase tracking-wider"><Link href="/profile/create">Get Started</Link></Button>
      </div>
    );
  }

  const incoming = incomingData?.tryouts || [];
  const outgoing = outgoingData?.tryouts || [];
  const hasClub = !!myPlayer.clubId;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-2">My Tryouts</h1>
        <p className="text-muted-foreground">Manage your tryout requests and invitations</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-lg mb-8 w-fit">
        <TabBtn active={tab === "incoming"} onClick={() => setTab("incoming")} disabled={!hasClub}>
          <Inbox className="w-4 h-4" />
          Incoming {hasClub && incoming.length > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
              {incoming.filter(t => t.status === "pending").length || ""}
            </span>
          )}
        </TabBtn>
        <TabBtn active={tab === "outgoing"} onClick={() => setTab("outgoing")}>
          <Send className="w-4 h-4" />
          Outgoing {outgoing.length > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">({outgoing.length})</span>
          )}
        </TabBtn>
      </div>

      {/* Incoming (captain only) */}
      {tab === "incoming" && (
        <div className="space-y-4">
          {!hasClub ? (
            <EmptyState icon={Shield} title="No Club Yet" desc="Create or join a club to receive tryout requests.">
              <Button asChild size="sm" className="font-bold uppercase tracking-wider"><Link href="/clubs/create">Create Club</Link></Button>
            </EmptyState>
          ) : loadingIn ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
          ) : incoming.length === 0 ? (
            <EmptyState icon={Inbox} title="No Incoming Requests" desc="Share your club profile so players can find and apply to you." />
          ) : (
            incoming.map(t => (
              <TryoutCard key={t.id} tryout={t} perspective="captain" onAction={(type) => setAction({ tryout: t, type })} />
            ))
          )}
        </div>
      )}

      {/* Outgoing */}
      {tab === "outgoing" && (
        <div className="space-y-4">
          {loadingOut ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
          ) : outgoing.length === 0 ? (
            <EmptyState icon={Send} title="No Applications Yet" desc="Browse clubs and request a tryout to get started.">
              <Button asChild size="sm" className="font-bold uppercase tracking-wider"><Link href="/clubs">Browse Clubs</Link></Button>
            </EmptyState>
          ) : (
            outgoing.map(t => (
              <TryoutCard key={t.id} tryout={t} perspective="player" onAction={(type) => setAction({ tryout: t, type })} myPlayerId={myPlayer.id} />
            ))
          )}
        </div>
      )}

      {/* Action dialogs */}
      {action && (
        <Dialog open onOpenChange={() => setAction(null)}>
          <DialogContent>
            {action.type === "accept" && (
              <>
                <DialogHeader><DialogTitle>Accept Tryout</DialogTitle></DialogHeader>
                <p className="text-muted-foreground">Accept <strong>{action.tryout.playerGamertag}</strong>'s tryout request?</p>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
                  <Button onClick={() => doUpdate(action.tryout.id, "accepted")} disabled={updateTryout.isPending}>Accept</Button>
                </DialogFooter>
              </>
            )}
            {action.type === "reject" && (
              <>
                <DialogHeader><DialogTitle>Reject Tryout</DialogTitle></DialogHeader>
                <p className="text-muted-foreground">Reject <strong>{action.tryout.playerGamertag || action.tryout.clubName}</strong>'s request?</p>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
                  <Button variant="destructive" onClick={() => doUpdate(action.tryout.id, "rejected")} disabled={updateTryout.isPending}>Reject</Button>
                </DialogFooter>
              </>
            )}
            {action.type === "schedule" && (
              <>
                <DialogHeader><DialogTitle>Schedule Tryout</DialogTitle></DialogHeader>
                <div className="py-2 space-y-3">
                  <label className="text-sm font-bold uppercase tracking-wider">Date & Time</label>
                  <Input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
                  <Button onClick={() => doUpdate(action.tryout.id, "scheduled", { scheduledAt: scheduleDate })}
                    disabled={!scheduleDate || updateTryout.isPending}>
                    Schedule
                  </Button>
                </DialogFooter>
              </>
            )}
            {action.type === "rate" && (
              <>
                <DialogHeader>
                  <DialogTitle>Rate This Tryout</DialogTitle>
                </DialogHeader>
                <div className="py-2 space-y-4">
                  <div>
                    <label className="text-sm font-bold uppercase tracking-wider block mb-3">Score (1–5)</label>
                    <div className="flex gap-3">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={() => setRatingScore(n)}
                          className={cn("w-12 h-12 rounded-lg border-2 font-black text-lg transition-all",
                            ratingScore >= n ? "border-yellow-400 bg-yellow-400/10 text-yellow-400" : "border-border bg-secondary text-muted-foreground"
                          )}>
                          {n}
                        </button>
                      ))}
                    </div>
                    <div className="flex mt-2">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} className={cn("w-8 h-8", ratingScore >= n ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold uppercase tracking-wider block mb-2">Comment (Optional)</label>
                    <Textarea placeholder="Great game sense, solid in 1v1s..." value={ratingComment}
                      onChange={e => setRatingComment(e.target.value)} rows={3} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
                  <Button onClick={() => doRate(action.tryout.id, action.tryout.initiatedBy === "player" ? "club" : "player")}
                    disabled={!ratingScore || rateTryout.isPending}>
                    Submit Rating
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function TryoutCard({ tryout, perspective, onAction, myPlayerId }: {
  tryout: Tryout; perspective: "captain" | "player"; onAction: (t: ActionType) => void; myPlayerId?: number;
}) {
  const isIncoming = perspective === "captain";
  const canAccept = isIncoming && tryout.status === "pending";
  const canReject = (isIncoming && tryout.status === "pending") || tryout.status === "accepted";
  const canSchedule = isIncoming && tryout.status === "accepted";
  const canRate = tryout.status === "scheduled" || tryout.status === "completed";
  const alreadyRated = perspective === "player" ? !!tryout.playerRatingScore : !!tryout.clubRatingScore;

  return (
    <div className={cn(
      "bg-card border rounded-xl p-5 transition-all",
      tryout.status === "pending" ? "border-primary/30 shadow-[0_0_15px_rgba(132,255,89,0.05)]" : "border-border"
    )}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            {isIncoming ? <User className="w-6 h-6 text-muted-foreground" /> : <Shield className="w-6 h-6 text-muted-foreground" />}
          </div>
          <div>
            <Link href={isIncoming ? `/players/${tryout.playerId}` : `/clubs/${tryout.clubId}`}>
              <div className="font-black text-lg hover:text-primary transition-colors">
                {isIncoming ? tryout.playerGamertag : tryout.clubName}
              </div>
            </Link>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {isIncoming && tryout.playerPosition && (
                <span className={cn("px-2 py-0.5 rounded text-xs font-bold border", getPositionColor(tryout.playerPosition))}>
                  {tryout.playerPosition}
                </span>
              )}
              {isIncoming && tryout.playerRating && (
                <span className={cn("px-2 py-0.5 rounded text-xs font-bold border", getOvrColor(tryout.playerRating))}>
                  OVR {tryout.playerRating}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {tryout.initiatedBy === "player" ? "Applied" : "Invited"} · {new Date(tryout.createdAt).toLocaleDateString()}
              </span>
              {tryout.scheduledAt && (
                <span className="flex items-center gap-1 text-xs text-purple-400 font-bold">
                  <Calendar className="w-3 h-3" /> {new Date(tryout.scheduledAt).toLocaleString()}
                </span>
              )}
            </div>
            {tryout.message && (
              <p className="text-sm text-muted-foreground mt-2 italic line-clamp-2">"{tryout.message}"</p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 shrink-0">
          <span className={cn("px-3 py-1 rounded text-xs font-bold border uppercase tracking-wider", getStatusColor(tryout.status))}>
            {tryout.status}
          </span>

          {(tryout.playerRatingScore || tryout.clubRatingScore) && (
            <div className="flex gap-2">
              {tryout.clubRatingScore && (
                <div className="flex items-center gap-1 text-xs text-yellow-400 font-bold">
                  <Star className="w-3 h-3 fill-yellow-400" /> {tryout.clubRatingScore.toFixed(1)} from club
                </div>
              )}
              {tryout.playerRatingScore && (
                <div className="flex items-center gap-1 text-xs text-yellow-400 font-bold">
                  <Star className="w-3 h-3 fill-yellow-400" /> {tryout.playerRatingScore.toFixed(1)} from player
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {canAccept && (
              <Button size="sm" onClick={() => onAction("accept")} className="font-bold uppercase text-xs gap-1">
                <Check className="w-3 h-3" /> Accept
              </Button>
            )}
            {canSchedule && (
              <Button size="sm" variant="outline" onClick={() => onAction("schedule")} className="font-bold uppercase text-xs gap-1">
                <Clock className="w-3 h-3" /> Schedule
              </Button>
            )}
            {canReject && (
              <Button size="sm" variant="outline" onClick={() => onAction("reject")}
                className="font-bold uppercase text-xs gap-1 border-red-500/30 text-red-400 hover:bg-red-500/10">
                <X className="w-3 h-3" /> Reject
              </Button>
            )}
            {canRate && !alreadyRated && (
              <Button size="sm" variant="outline" onClick={() => onAction("rate")} className="font-bold uppercase text-xs gap-1">
                <Star className="w-3 h-3" /> Rate
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabBtn({ children, active, onClick, disabled }: {
  children: React.ReactNode; active: boolean; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn("flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold uppercase tracking-wider transition-all",
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
        disabled && "opacity-30 cursor-not-allowed"
      )}>
      {children}
    </button>
  );
}

function EmptyState({ icon: Icon, title, desc, children }: { icon: any; title: string; desc: string; children?: React.ReactNode }) {
  return (
    <div className="py-16 text-center border border-dashed border-border rounded-xl">
      <Icon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-xl font-black uppercase italic tracking-tight mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-xs mx-auto mb-6">{desc}</p>
      {children}
    </div>
  );
}
