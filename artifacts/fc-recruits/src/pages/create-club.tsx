import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateClub, useGetMyPlayer } from "@workspace/api-client-react";
import { getGetFeaturedClubsQueryKey, getListClubsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Shield, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORMS = ["PS5","Xbox","PC"];
const STYLES = [
  { value: "casual", label: "Casual", desc: "Play for fun, no pressure" },
  { value: "semi-competitive", label: "Semi-Comp", desc: "Balanced fun & results" },
  { value: "competitive", label: "Competitive", desc: "Win-focused, serious play" },
];
const POSITIONS = ["GK","RB","CB","LB","CDM","CM","CAM","RM","LM","RW","LW","ST"];
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const COUNTRIES = [
  "Spain","United Kingdom","France","Germany","Italy","Portugal","Brazil","Mexico",
  "United States","Argentina","Colombia","Netherlands","Belgium","Turkey","Poland",
  "United Arab Emirates","Saudi Arabia","Japan","South Korea","Australia"
];

export default function CreateClub() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const createClub = useCreateClub();
  const { data: myPlayer } = useGetMyPlayer();

  const [form, setForm] = useState({
    name: "",
    platform: "" as string,
    division: 5,
    style: "" as string,
    country: "" as string,
    description: "",
    playDays: [] as string[],
    playFrom: "20:00",
    playTo: "23:00",
    openPositions: [] as string[],
    maxMembers: 11,
  });

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  const toggleDay = (d: string) => set("playDays",
    form.playDays.includes(d) ? form.playDays.filter(x => x !== d) : [...form.playDays, d]);

  const togglePosition = (p: string) => set("openPositions",
    form.openPositions.includes(p) ? form.openPositions.filter(x => x !== p) : [...form.openPositions, p]);

  const canSubmit = form.name.trim().length >= 2 && form.platform && form.style && form.country;

  if (!myPlayer) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-black uppercase italic tracking-tight mb-2">Player Profile Required</h2>
        <p className="text-muted-foreground mb-6">You need a player profile before creating a club.</p>
        <Button onClick={() => setLocation("/profile/create")} className="font-bold uppercase tracking-wider">
          Create Player Profile
        </Button>
      </div>
    );
  }

  const handleSubmit = () => {
    createClub.mutate({
      data: {
        name: form.name.trim(),
        platform: form.platform,
        division: form.division,
        style: form.style,
        country: form.country,
        description: form.description.trim() || undefined,
        playDays: JSON.stringify(form.playDays),
        playFrom: form.playFrom,
        playTo: form.playTo,
        openPositions: JSON.stringify(form.openPositions),
        maxMembers: form.maxMembers,
      }
    }, {
      onSuccess: (club) => {
        qc.invalidateQueries({ queryKey: getGetFeaturedClubsQueryKey() });
        qc.invalidateQueries({ queryKey: getListClubsQueryKey() });
        toast({ title: "Club created!", description: `${club.name} is now live.` });
        setLocation(`/clubs/${club.id}`);
      },
      onError: (e: any) => {
        toast({ title: "Error", description: e?.message || "Could not create club.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-2">Create Your Club</h1>
        <p className="text-muted-foreground">Set up your club profile and start recruiting players</p>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <Section title="Club Identity">
          <Field label="Club Name *">
            <Input placeholder="FC Élite Madrid" value={form.name} onChange={e => set("name", e.target.value)} className="text-lg font-bold" />
          </Field>
          <Field label="Platform *">
            <div className="flex gap-3">
              {PLATFORMS.map(p => (
                <button key={p} onClick={() => set("platform", p)}
                  className={cn("flex-1 py-3 rounded-lg border-2 text-sm font-bold uppercase tracking-wider transition-all",
                    form.platform === p ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground hover:border-primary/50"
                  )}>
                  {p}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Country *">
            <select value={form.country} onChange={e => set("country", e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm">
              <option value="">Select country...</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </Section>

        {/* Division & Style */}
        <Section title="Division & Style">
          <Field label={`Division: ${form.division} ${form.division === 1 ? "(Top)" : form.division === 10 ? "(Entry)" : ""}`} hint="1 = top, 10 = entry level">
            <input type="range" min={1} max={10} value={form.division}
              onChange={e => set("division", Number(e.target.value))}
              className="w-full accent-primary" />
            <div className="flex justify-between text-xs text-muted-foreground font-bold mt-1">
              <span>Division 1</span>
              <span>Division 10</span>
            </div>
          </Field>
          <Field label="Play Style *">
            <div className="grid grid-cols-3 gap-3">
              {STYLES.map(s => (
                <button key={s.value} onClick={() => set("style", s.value)}
                  className={cn("p-3 rounded-lg border-2 text-left transition-all",
                    form.style === s.value ? "border-primary bg-primary/10" : "border-border bg-secondary hover:border-primary/50"
                  )}>
                  <div className={cn("text-sm font-bold uppercase tracking-wider mb-1",
                    form.style === s.value ? "text-primary" : "text-foreground"
                  )}>{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.desc}</div>
                </button>
              ))}
            </div>
          </Field>
        </Section>

        {/* Schedule */}
        <Section title="Play Schedule">
          <Field label="Play Days">
            <div className="flex gap-2">
              {DAYS.map(d => (
                <button key={d} onClick={() => toggleDay(d)}
                  className={cn("flex-1 py-2 rounded border-2 text-xs font-bold uppercase transition-all",
                    form.playDays.includes(d) ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground hover:border-primary/50"
                  )}>
                  {d}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Plays From">
              <Input type="time" value={form.playFrom} onChange={e => set("playFrom", e.target.value)} />
            </Field>
            <Field label="Plays To">
              <Input type="time" value={form.playTo} onChange={e => set("playTo", e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* Recruiting */}
        <Section title="Open Positions">
          <Field label="Positions You Are Recruiting" hint="Leave empty if not actively recruiting">
            <div className="grid grid-cols-6 gap-2">
              {POSITIONS.map(pos => (
                <button key={pos} onClick={() => togglePosition(pos)}
                  className={cn("py-2 rounded text-xs font-bold uppercase border-2 transition-all",
                    form.openPositions.includes(pos) ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground hover:border-primary/50"
                  )}>
                  {pos}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Max Squad Size">
            <div className="flex items-center gap-4">
              <input type="range" min={5} max={20} value={form.maxMembers}
                onChange={e => set("maxMembers", Number(e.target.value))}
                className="flex-1 accent-primary" />
              <span className="text-xl font-black w-8 text-center">{form.maxMembers}</span>
            </div>
          </Field>
        </Section>

        {/* Description */}
        <Section title="About The Club">
          <Field label="Description">
            <Textarea rows={4} placeholder="We are a competitive club looking for dedicated players..."
              value={form.description} onChange={e => set("description", e.target.value)} />
          </Field>
        </Section>

        <Button onClick={handleSubmit} disabled={!canSubmit || createClub.isPending}
          size="lg" className="w-full font-bold uppercase tracking-wider text-lg py-6">
          {createClub.isPending ? "Creating Club..." : "Create Club"}
        </Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
      <h2 className="text-lg font-black uppercase italic tracking-tight text-foreground border-b border-border pb-3">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-bold uppercase tracking-wider">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}
