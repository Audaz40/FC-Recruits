import { useParams } from "wouter";
import { useGetPlayer, useGetMyPlayer, useCreateTryout } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getOvrColor, getPositionColor } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Trophy, Calendar, Globe, Clock, Target, Activity, CheckCircle, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function PlayerProfile() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { data: player, isLoading } = useGetPlayer(id, { query: { enabled: !!id, queryKey: ['player', id] } });
  const { data: myPlayer } = useGetMyPlayer();
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const createTryout = useCreateTryout();

  const handleRequestTryout = () => {
    if (!myPlayer?.clubId) return;
    
    createTryout.mutate({
      data: {
        clubId: myPlayer.clubId,
        playerId: player!.id,
        initiatedBy: "club",
        message
      }
    }, {
      onSuccess: () => {
        setOpen(false);
        toast({ title: "Tryout requested", description: `Sent to ${player?.gamertag}` });
      },
      onError: () => {
        toast({ title: "Error", description: "Could not send request.", variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8 max-w-4xl"><Skeleton className="h-[600px] w-full" /></div>;
  }

  if (!player) {
    return <div className="p-8 text-center text-xl">Player not found</div>;
  }

  const isCaptain = myPlayer?.clubId && myPlayer.id !== player.id;
  const days = player.availableDays ? JSON.parse(player.availableDays) : [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg mb-8">
        <div className="h-48 bg-gradient-to-r from-secondary via-background to-primary/20 relative">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518605368461-1ee7c51121d5?q=80&w=2000&auto=format&fit=crop')] opacity-10 bg-cover bg-center mix-blend-overlay" />
        </div>
        
        <div className="px-8 pb-8 relative -mt-20">
          <div className="flex flex-col md:flex-row gap-6 items-end md:items-end justify-between">
            <div className="flex items-end gap-6">
              <div className="w-40 h-40 rounded-full border-4 border-card bg-secondary overflow-hidden shrink-0 shadow-2xl relative">
                {player.avatarUrl ? (
                  <img src={player.avatarUrl} alt={player.gamertag} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl font-black text-muted-foreground bg-secondary">
                    {player.gamertag.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="mb-2">
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-1">{player.gamertag}</h1>
                {player.displayName && <p className="text-lg text-muted-foreground font-medium">{player.displayName}</p>}
                
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className={`px-3 py-1 rounded text-sm font-bold border uppercase tracking-wider ${getPositionColor(player.mainPosition)}`}>
                    {player.mainPosition}
                  </span>
                  {player.secondaryPosition && (
                    <span className="px-3 py-1 rounded text-sm font-bold border border-border bg-secondary text-secondary-foreground uppercase tracking-wider">
                      {player.secondaryPosition}
                    </span>
                  )}
                  <span className="px-3 py-1 rounded text-sm font-bold border border-border bg-secondary text-secondary-foreground uppercase tracking-wider flex items-center gap-1">
                    <Globe className="w-3 h-3" /> {player.platform}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center shrink-0 mb-2">
              <div className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">OVR</div>
              <div className={`w-24 h-24 flex items-center justify-center rounded-xl text-5xl font-black tracking-tighter border-2 shadow-lg ${getOvrColor(player.overallRating)}`}>
                {player.overallRating}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Player Stats
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-secondary/50 p-4 rounded-lg text-center">
                <div className="text-3xl font-black tracking-tighter text-foreground mb-1">{player.matchesPlayed || 0}</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Matches</div>
              </div>
              <div className="bg-secondary/50 p-4 rounded-lg text-center">
                <div className="text-3xl font-black tracking-tighter text-foreground mb-1">{player.goals || 0}</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Goals</div>
              </div>
              <div className="bg-secondary/50 p-4 rounded-lg text-center">
                <div className="text-3xl font-black tracking-tighter text-foreground mb-1">{player.assists || 0}</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Assists</div>
              </div>
              <div className="bg-secondary/50 p-4 rounded-lg text-center">
                <div className="text-3xl font-black tracking-tighter text-foreground mb-1">{player.passAccuracy || 0}%</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pass Acc</div>
              </div>
            </div>
          </section>

          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-4">About</h2>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {player.bio || "No bio provided."}
            </p>
          </section>
        </div>

        <div className="space-y-8">
          {isCaptain && player.freeAgent && (
            <div className="bg-card border border-primary/30 p-6 rounded-xl shadow-[0_0_20px_rgba(132,255,89,0.1)]">
              <h3 className="font-black uppercase italic tracking-tight mb-2 text-primary">Recruit Player</h3>
              <p className="text-sm text-muted-foreground mb-4">You are viewing this profile as a club captain. Request a tryout to see if they fit your squad.</p>
              
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full font-bold uppercase tracking-wider" size="lg">Request Tryout</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Tryout with {player.gamertag}</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <label className="text-sm font-medium mb-2 block">Message (Optional)</label>
                    <Textarea 
                      placeholder="Hey, we're looking for a solid ST. Want to run some games?"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleRequestTryout} disabled={createTryout.isPending}>
                      {createTryout.isPending ? "Sending..." : "Send Request"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Club Status
            </h2>
            {player.freeAgent ? (
              <div className="flex items-center gap-3 text-primary font-bold bg-primary/10 p-4 rounded-lg border border-primary/20">
                <CheckCircle className="w-5 h-5" />
                <span className="uppercase tracking-wider">Free Agent</span>
              </div>
            ) : (
              <div className="p-4 bg-secondary rounded-lg border border-border">
                <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Current Club</div>
                <div className="font-bold text-lg">{player.clubName}</div>
              </div>
            )}
          </section>

          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Availability
            </h2>
            
            <div className="space-y-4">
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {player.country} ({player.timezone})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <span 
                      key={day} 
                      className={`text-xs font-bold px-2 py-1 rounded ${days.includes(day) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>
              
              {player.availableFrom && player.availableTo && (
                <div className="flex items-center gap-2 text-sm font-medium bg-secondary p-3 rounded-lg border border-border">
                  <Clock className="w-4 h-4 text-primary" />
                  {player.availableFrom} - {player.availableTo}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}