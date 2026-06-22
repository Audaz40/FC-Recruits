import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  useGetMyPlayer, useUpdatePlayer, useListTryouts,
  getGetMyPlayerQueryKey, getListTryoutsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  User, Activity, Calendar, Globe, Shield, Edit3, Save, X, Star,
  Trophy, Clock, Target, ChevronRight
} from "lucide-react";
import { cn, getOvrColor, getPositionColor, getStatusColor } from "@/lib/utils";

const POSITIONS = ["GK","RB","CB","LB","CDM","CM","CAM","RM","LM","RW","LW","ST"];
const PLATFORMS = ["PS5","Xbox","PC"];
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const COUNTRIES = [
  "Spain","United Kingdom","France","Germany","Italy","Portugal","Brazil","Mexico",
  "United States","Argentina","Colombia","Netherlands","Belgium","Turkey","Poland",
  "United Arab Emirates","Saudi Arabia","Japan","South Korea","Australia"
];
const TIMEZONES = [
  "Europe/Madrid","Europe/London","Europe/Paris","Europe/Berlin","Europe/Rome",
  "Europe/Lisbon","America/New_York","America/Chicago","America/Los_Angeles",
  "America/Mexico_City","America/Sao_Paulo","Asia/Tokyo","Asia/Seoul",
  "Australia/Sydney","Africa/Johannesburg"
];

export default function MyProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: player, isLoading } = useGetMyPlayer();
  const { data: tryoutsData } = useListTryouts(
    { playerId: player?.id },
    { query: { enabled: !!player?.id, queryKey: getListTryoutsQueryKey({ playerId: player?.id }) } }
  );
  const updatePlayer = useUpdatePlayer();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  const startEdit = () => {
    if (!player) return;
    setForm({
      gamertag: player.gamertag,
      displayName: player.displayName || "",
      platform: player.platform,
      mainPosition: player.mainPosition,
      secondaryPosition: player.secondaryPosition || "",
      overallRating: player.overallRating,
      goals: player.goals ?? "",
      assists: player.assists ?? "",
      passAccuracy: player.passAccuracy ?? "",
      cleanSheets: player.cleanSheets ?? "",
      matchesPlayed: player.matchesPlayed ?? "",
      availableDays: player.availableDays ? JSON.parse(player.availableDays) : [],
      availableFrom: player.availableFrom || "20:00",
      availableTo: player.availableTo || "23:00",
      country: player.country,
      timezone: player.timezone,
      bio: player.bio || "",
      freeAgent: player.freeAgent,
    });
    setEditing(true);
  };

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const toggleDay = (d: string) => set("availableDays",
    form.availableDays?.includes(d) ? form.availableDays.filter((x: string) => x !== d) : [...(form.availableDays || []), d]);

  const handleSave = () => {
    if (!player) return;
    updatePlayer.mutate({
      id: player.id,
      data: {
        gamertag: form.gamertag,
        displayName: form.displayName || undefined,
        platform: form.platform,
        mainPosition: form.mainPosition,
        secondaryPosition: form.secondaryPosition || undefined,
        overallRating: Number(form.overallRating),
        goals: form.goals !== "" ? Number(form.goals) : undefined,
        assists: form.assists !== "" ? Number(form.assists) : undefined,
        passAccuracy: form.passAccuracy !== "" ? Number(form.passAccuracy) : undefined,
        cleanSheets: form.cleanSheets !== "" ? Number(form.cleanSheets) : undefined,
        matchesPlayed: form.matchesPlayed !== "" ? Number(form.matchesPlayed) : undefined,
        availableDays: JSON.stringify(form.availableDays),
        availableFrom: form.availableFrom,
        availableTo: form.availableTo,
        country: form.country,
        timezone: form.timezone,
        bio: form.bio || undefined,
        freeAgent: form.freeAgent,
      }
    }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMyPlayerQueryKey() });
        setEditing(false);
        toast({ title: "Profile updated!" });
      },
      onError: () => toast({ title: "Error", description: "Could not update profile.", variant: "destructive" })
    });
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8 max-w-4xl"><Skeleton className="h-96 w-full" /></div>;
  }

  if (!player) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-black uppercase italic tracking-tight mb-2">No Profile Yet</h2>
        <p className="text-muted-foreground mb-6">Create your player profile to join the recruitment pool.</p>
        <Button onClick={() => setLocation("/profile/create")} size="lg" className="font-bold uppercase tracking-wider">
          Join The Draft
        </Button>
      </div>
    );
  }

  const days = editing ? form.availableDays : (player.availableDays ? JSON.parse(player.availableDays) : []);
  const tryouts = tryoutsData?.tryouts || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg mb-8">
        <div className="h-40 bg-gradient-to-r from-secondary via-background to-primary/20 relative">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518605368461-1ee7c51121d5?q=80&w=2000')] opacity-10 bg-cover bg-center" />
        </div>
        <div className="px-8 pb-8 relative -mt-16 flex flex-col md:flex-row gap-6 justify-between items-end">
          <div className="flex items-end gap-6">
            <div className="w-32 h-32 rounded-full border-4 border-card bg-secondary flex items-center justify-center text-5xl font-black text-muted-foreground shadow-2xl">
              {player.gamertag.charAt(0).toUpperCase()}
            </div>
            <div className="mb-2">
              {editing ? (
                <Input value={form.gamertag} onChange={e => set("gamertag", e.target.value)}
                  className="text-2xl font-black h-12 mb-2 max-w-xs" />
              ) : (
                <h1 className="text-4xl font-black uppercase tracking-tighter">{player.gamertag}</h1>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={cn("px-3 py-1 rounded text-sm font-bold border uppercase tracking-wider", getPositionColor(player.mainPosition))}>
                  {player.mainPosition}
                </span>
                <span className="px-3 py-1 rounded text-sm font-bold border border-border bg-secondary uppercase tracking-wider">{player.platform}</span>
                <span className={cn("px-3 py-1 rounded text-sm font-bold border uppercase tracking-wider",
                  player.freeAgent ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground"
                )}>
                  {player.freeAgent ? "Free Agent" : player.clubName || "Signed"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn("w-20 h-20 flex items-center justify-center rounded-xl text-4xl font-black border-2", getOvrColor(player.overallRating))}>
              {player.overallRating}
            </div>
            {editing ? (
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={updatePlayer.isPending} size="sm" className="font-bold uppercase gap-1">
                  <Save className="w-4 h-4" /> {updatePlayer.isPending ? "Saving..." : "Save"}
                </Button>
                <Button onClick={() => setEditing(false)} variant="outline" size="sm" className="gap-1">
                  <X className="w-4 h-4" /> Cancel
                </Button>
              </div>
            ) : (
              <Button onClick={startEdit} variant="outline" size="sm" className="font-bold uppercase gap-1">
                <Edit3 className="w-4 h-4" /> Edit
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Stats */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Stats
            </h2>
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">OVR Rating</label>
                  <div className="flex items-center gap-4">
                    <input type="range" min={1} max={99} value={form.overallRating}
                      onChange={e => set("overallRating", Number(e.target.value))} className="flex-1 accent-primary" />
                    <span className={cn("w-12 h-12 flex items-center justify-center rounded text-2xl font-black border-2", getOvrColor(form.overallRating))}>{form.overallRating}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[["matchesPlayed","Matches"],["goals","Goals"],["assists","Assists"],["passAccuracy","Pass Acc %"],["cleanSheets","Clean Sheets"]].map(([k, l]) => (
                    <div key={k}>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">{l}</label>
                      <Input type="number" min={0} max={k === "passAccuracy" ? 100 : undefined} step={k === "passAccuracy" ? 0.1 : 1}
                        value={form[k]} onChange={e => set(k, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: "Matches", value: player.matchesPlayed ?? 0 },
                  { label: "Goals", value: player.goals ?? 0 },
                  { label: "Assists", value: player.assists ?? 0 },
                  { label: "Pass Acc", value: player.passAccuracy ? `${player.passAccuracy}%` : "—" },
                  { label: "Clean Sh.", value: player.cleanSheets ?? 0 },
                ].map(s => (
                  <div key={s.label} className="bg-secondary/50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-black tracking-tighter">{s.value}</div>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Bio */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-4">About Me</h2>
            {editing ? (
              <Textarea rows={4} value={form.bio} onChange={e => set("bio", e.target.value)}
                placeholder="Tell clubs about yourself..." />
            ) : (
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {player.bio || "No bio added yet."}
              </p>
            )}
          </section>

          {/* Tryout history */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" /> Tryout History
            </h2>
            {tryouts.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-border rounded-lg text-muted-foreground">
                No tryouts yet. Apply to clubs to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {tryouts.slice(0, 5).map(t => (
                  <Link key={t.id} href="/tryouts">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/30 hover:border-primary/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                          <Shield className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-bold">{t.clubName}</div>
                          <div className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {t.clubRatingScore && (
                          <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
                            <Star className="w-4 h-4 fill-yellow-400" /> {t.clubRatingScore.toFixed(1)}
                          </div>
                        )}
                        <span className={cn("px-2 py-1 rounded text-xs font-bold border uppercase", getStatusColor(t.status))}>
                          {t.status}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
                {tryouts.length > 5 && (
                  <Link href="/tryouts">
                    <Button variant="ghost" className="w-full font-bold uppercase tracking-wider">View All Tryouts</Button>
                  </Link>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-8">
          {/* Position & Platform edit or display */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> Position
            </h2>
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Main</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {POSITIONS.map(p => (
                      <button key={p} onClick={() => set("mainPosition", p)}
                        className={cn("py-1.5 rounded text-xs font-bold uppercase border-2 transition-all",
                          form.mainPosition === p ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground"
                        )}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Secondary</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {POSITIONS.map(p => (
                      <button key={p} onClick={() => set("secondaryPosition", form.secondaryPosition === p ? "" : p)}
                        className={cn("py-1.5 rounded text-xs font-bold uppercase border-2 transition-all",
                          form.secondaryPosition === p ? "border-primary/60 bg-primary/5 text-primary" : "border-border bg-secondary text-muted-foreground"
                        )}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Platform</label>
                  <div className="flex gap-2">
                    {PLATFORMS.map(p => (
                      <button key={p} onClick={() => set("platform", p)}
                        className={cn("flex-1 py-2 rounded border-2 text-xs font-bold uppercase transition-all",
                          form.platform === p ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground"
                        )}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={cn("px-3 py-1 rounded text-sm font-bold border uppercase tracking-wider", getPositionColor(player.mainPosition))}>
                    {player.mainPosition}
                  </span>
                  <span className="text-xs text-muted-foreground font-bold uppercase">Main</span>
                </div>
                {player.secondaryPosition && (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded text-sm font-bold border border-border bg-secondary uppercase tracking-wider">
                      {player.secondaryPosition}
                    </span>
                    <span className="text-xs text-muted-foreground font-bold uppercase">Secondary</span>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Free Agent toggle */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Status
            </h2>
            {editing ? (
              <button onClick={() => set("freeAgent", !form.freeAgent)}
                className={cn("w-full py-3 rounded-lg border-2 font-bold uppercase tracking-wider transition-all",
                  form.freeAgent ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground"
                )}>
                {form.freeAgent ? "Free Agent (Visible)" : "Not Looking"}
              </button>
            ) : (
              <div className={cn("p-4 rounded-lg border font-bold uppercase tracking-wider",
                player.freeAgent ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-secondary text-foreground"
              )}>
                {player.freeAgent ? "Free Agent" : player.clubName ? `Playing for ${player.clubName}` : "Not Looking"}
              </div>
            )}
          </section>

          {/* Availability */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Availability
            </h2>
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Days</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {DAYS.map(d => (
                      <button key={d} onClick={() => toggleDay(d)}
                        className={cn("py-2 rounded text-xs font-bold uppercase border-2 transition-all",
                          days.includes(d) ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground"
                        )}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">From</label>
                    <Input type="time" value={form.availableFrom} onChange={e => set("availableFrom", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">To</label>
                    <Input type="time" value={form.availableTo} onChange={e => set("availableTo", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Country</label>
                  <select value={form.country} onChange={e => set("country", e.target.value)}
                    className="w-full h-9 px-3 rounded border border-border bg-background text-foreground text-sm">
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Timezone</label>
                  <select value={form.timezone} onChange={e => set("timezone", e.target.value)}
                    className="w-full h-9 px-3 rounded border border-border bg-background text-foreground text-sm">
                    {TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {player.country} · {player.timezone}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map(d => (
                    <span key={d} className={cn("text-xs font-bold px-2 py-1 rounded",
                      days.includes(d) ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    )}>{d}</span>
                  ))}
                </div>
                {player.availableFrom && player.availableTo && (
                  <div className="flex items-center gap-2 text-sm font-medium bg-secondary p-3 rounded-lg border border-border">
                    <Clock className="w-4 h-4 text-primary" />
                    {player.availableFrom} - {player.availableTo}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Quick links */}
          <div className="flex gap-3">
            <Button asChild variant="outline" size="sm" className="flex-1 font-bold uppercase tracking-wider text-xs">
              <Link href="/tryouts">My Tryouts</Link>
            </Button>
            {!player.clubId && (
              <Button asChild size="sm" className="flex-1 font-bold uppercase tracking-wider text-xs">
                <Link href="/clubs/create">Create Club</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
