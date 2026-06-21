import { useParams, Link } from "wouter";
import { useGetClub, useGetClubMembers, useGetMyPlayer, useCreateTryout } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Shield, Users, Trophy, Target, Globe, Calendar, Clock, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getOvrColor, getPositionColor } from "@/lib/utils";

export default function ClubProfile() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { data: club, isLoading } = useGetClub(id, { query: { enabled: !!id, queryKey: ['club', id] } });
  const { data: members } = useGetClubMembers(id, { query: { enabled: !!id, queryKey: ['club-members', id] } });
  const { data: myPlayer } = useGetMyPlayer();
  
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createTryout = useCreateTryout();

  const handleRequestTryout = () => {
    if (!myPlayer) return;
    
    createTryout.mutate({
      data: {
        clubId: club!.id,
        playerId: myPlayer.id,
        initiatedBy: "player",
        message
      }
    }, {
      onSuccess: () => {
        setOpen(false);
        toast({ title: "Tryout requested", description: `Sent to ${club?.name}` });
      },
      onError: () => {
        toast({ title: "Error", description: "Could not send request.", variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8 max-w-5xl"><Skeleton className="h-[400px] w-full" /></div>;
  }

  if (!club) {
    return <div className="p-8 text-center text-xl">Club not found</div>;
  }

  const isFreeAgent = myPlayer && myPlayer.freeAgent;
  const isCaptain = myPlayer && myPlayer.id === club.captainId;
  const days = club.playDays ? JSON.parse(club.playDays) : [];
  const openPositions = club.openPositions ? JSON.parse(club.openPositions) : [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg mb-8">
        <div className="h-48 bg-gradient-to-r from-secondary via-background to-primary/10 relative">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551280857-2b9bbe5240dc?q=80&w=2000&auto=format&fit=crop')] opacity-10 bg-cover bg-center mix-blend-overlay" />
        </div>
        
        <div className="px-8 pb-8 relative -mt-16 flex flex-col md:flex-row gap-6 justify-between items-start md:items-end">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            <div className="w-32 h-32 rounded-xl border-4 border-card bg-secondary overflow-hidden shrink-0 shadow-2xl flex items-center justify-center">
              {club.logoUrl ? (
                <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover" />
              ) : (
                <Shield className="w-16 h-16 text-muted-foreground" />
              )}
            </div>
            
            <div className="mb-2">
              <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">{club.name}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded text-sm font-bold border border-primary/20 bg-primary/10 text-primary uppercase tracking-wider">
                  Div {club.division}
                </span>
                <span className="px-3 py-1 rounded text-sm font-bold border border-border bg-secondary text-secondary-foreground uppercase tracking-wider">
                  {club.style}
                </span>
                <span className="px-3 py-1 rounded text-sm font-bold border border-border bg-secondary text-secondary-foreground uppercase tracking-wider flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {club.platform}
                </span>
              </div>
            </div>
          </div>
          
          {isFreeAgent && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto font-bold uppercase tracking-wider" size="lg">
                  Request Tryout
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Tryout with {club.name}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <label className="text-sm font-medium mb-2 block">Message (Optional)</label>
                  <Textarea 
                    placeholder="I play ST/LW and am looking for a competitive team."
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
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-4">About</h2>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {club.description || "No description provided."}
            </p>
          </section>

          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Roster ({club.memberCount}/{club.maxMembers})
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {members?.members.map(member => (
                <Link key={member.id} href={`/players/${member.playerId}`} className="block group">
                  <div className="flex items-center gap-4 p-3 rounded-lg border border-border bg-secondary/30 hover:border-primary/50 transition-colors">
                    <div className={`w-10 h-10 flex items-center justify-center rounded font-black border ${getOvrColor(member.playerRating || 75)}`}>
                      {member.playerRating || '?'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="font-bold truncate group-hover:text-primary transition-colors">
                        {member.playerGamertag}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getPositionColor(member.playerPosition || 'UNK')}`}>
                          {member.playerPosition}
                        </span>
                        {member.role === 'captain' && <span className="text-primary">Captain</span>}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
              
              {members?.members.length === 0 && (
                <div className="col-span-2 text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
                  No members found.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> Recruiting
            </h2>
            {openPositions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {openPositions.map((pos: string) => (
                  <span key={pos} className={`px-3 py-1.5 rounded text-sm font-bold border uppercase tracking-wider ${getPositionColor(pos)}`}>
                    {pos}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">Not currently recruiting for specific positions.</div>
            )}
          </section>
          
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" /> Record
            </h2>
            <div className="flex justify-between items-center bg-secondary/50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-black text-green-500">{club.wins || 0}</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">W</div>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div className="text-center">
                <div className="text-2xl font-black text-gray-400">{club.draws || 0}</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">D</div>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div className="text-center">
                <div className="text-2xl font-black text-red-500">{club.losses || 0}</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">L</div>
              </div>
            </div>
          </section>

          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Schedule
            </h2>
            
            <div className="space-y-4">
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {club.country}
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
              
              {club.playFrom && club.playTo && (
                <div className="flex items-center gap-2 text-sm font-medium bg-secondary p-3 rounded-lg border border-border">
                  <Clock className="w-4 h-4 text-primary" />
                  {club.playFrom} - {club.playTo}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}