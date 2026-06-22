import { useState } from "react";
import { useLocation } from "wouter";
import { useCreatePlayer } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMyPlayerQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { User, Activity, Calendar, Globe, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const POSITIONS = ["GK","RB","CB","LB","CDM","CM","CAM","RM","LM","RW","LW","ST"];
const PLATFORMS = ["PS5","Xbox","PC"];
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const TIMEZONES = [
  "Europe/Madrid","Europe/London","Europe/Paris","Europe/Berlin","Europe/Rome",
  "Europe/Lisbon","America/New_York","America/Chicago","America/Los_Angeles",
  "America/Mexico_City","America/Sao_Paulo","Asia/Tokyo","Asia/Seoul",
  "Australia/Sydney","Africa/Johannesburg"
];
const COUNTRIES = [
  "Spain","United Kingdom","France","Germany","Italy","Portugal","Brazil","Mexico",
  "United States","Argentina","Colombia","Netherlands","Belgium","Turkey","Poland",
  "United Arab Emirates","Saudi Arabia","Japan","South Korea","Australia"
];

const STEPS = [
  { label: "Identity", icon: User },
  { label: "Stats", icon: Activity },
  { label: "Schedule", icon: Calendar },
  { label: "Details", icon: Globe },
];

export default function CreateProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const createPlayer = useCreatePlayer();
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    gamertag: "",
    displayName: "",
    platform: "" as string,
    mainPosition: "" as string,
    secondaryPosition: "" as string,
    overallRating: 75,
    goals: "" as string | number,
    assists: "" as string | number,
    passAccuracy: "" as string | number,
    cleanSheets: "" as string | number,
    matchesPlayed: "" as string | number,
    availableDays: [] as string[],
    availableFrom: "20:00",
    availableTo: "23:00",
    country: "" as string,
    timezone: "" as string,
    bio: "",
  });

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  const toggleDay = (d: string) => {
    set("availableDays", form.availableDays.includes(d)
      ? form.availableDays.filter(x => x !== d)
      : [...form.availableDays, d]);
  };

  const canNext = () => {
    if (step === 0) return form.gamertag.trim().length >= 2 && form.platform && form.mainPosition;
    if (step === 1) return form.overallRating >= 1 && form.overallRating <= 99;
    if (step === 2) return form.availableDays.length > 0;
    if (step === 3) return form.country && form.timezone;
    return false;
  };

  const handleSubmit = () => {
    createPlayer.mutate({
      data: {
        gamertag: form.gamertag.trim(),
        displayName: form.displayName.trim() || undefined,
        platform: form.platform,
        mainPosition: form.mainPosition,
        secondaryPosition: form.secondaryPosition || undefined,
        overallRating: form.overallRating,
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
        bio: form.bio.trim() || undefined,
      }
    }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMyPlayerQueryKey() });
        toast({ title: "Profile created!", description: "Welcome to FC Recruits." });
        setLocation("/profile");
      },
      onError: (e: any) => {
        toast({ title: "Error", description: e?.message || "Could not create profile.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-2">Join The Draft</h1>
          <p className="text-muted-foreground">Create your player profile and enter the recruitment pool</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <div key={i} className="flex items-center">
                <div className={cn(
                  "flex flex-col items-center gap-1 px-4",
                )}>
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    done ? "bg-primary border-primary text-primary-foreground" :
                    active ? "border-primary text-primary" : "border-border text-muted-foreground"
                  )}>
                    {done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={cn("text-xs font-bold uppercase tracking-wider",
                    active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
                  )}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("h-px w-8 -mt-5", i < step ? "bg-primary" : "bg-border")} />
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-card border border-border rounded-xl p-8">
          {/* STEP 0: Identity */}
          {step === 0 && (
            <div className="space-y-6">
              <StepTitle>Your Identity</StepTitle>
              <Field label="Gamertag *" hint="Your in-game name">
                <Input placeholder="xXSniper99Xx" value={form.gamertag} onChange={e => set("gamertag", e.target.value)} className="font-bold" />
              </Field>
              <Field label="Display Name" hint="Optional real name or alias">
                <Input placeholder="Carlos M." value={form.displayName} onChange={e => set("displayName", e.target.value)} />
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
              <Field label="Main Position *">
                <div className="grid grid-cols-6 gap-2">
                  {POSITIONS.map(pos => (
                    <button key={pos} onClick={() => set("mainPosition", pos)}
                      className={cn("py-2 rounded text-xs font-bold uppercase border-2 transition-all",
                        form.mainPosition === pos ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground hover:border-primary/50"
                      )}>
                      {pos}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Secondary Position">
                <div className="grid grid-cols-6 gap-2">
                  {POSITIONS.filter(p => p !== form.mainPosition).map(pos => (
                    <button key={pos} onClick={() => set("secondaryPosition", form.secondaryPosition === pos ? "" : pos)}
                      className={cn("py-2 rounded text-xs font-bold uppercase border-2 transition-all",
                        form.secondaryPosition === pos ? "border-primary/60 bg-primary/5 text-primary" : "border-border bg-secondary text-muted-foreground hover:border-primary/30"
                      )}>
                      {pos}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {/* STEP 1: Stats */}
          {step === 1 && (
            <div className="space-y-6">
              <StepTitle>Your Stats</StepTitle>
              <Field label="Overall Rating (OVR) *" hint="Your in-game overall rating (1–99)">
                <div className="flex items-center gap-4">
                  <input type="range" min={1} max={99} value={form.overallRating}
                    onChange={e => set("overallRating", Number(e.target.value))}
                    className="flex-1 accent-primary" />
                  <div className={cn("w-16 h-16 flex items-center justify-center rounded-xl text-3xl font-black border-2",
                    form.overallRating >= 85 ? "border-yellow-400 text-yellow-400" :
                    form.overallRating >= 75 ? "border-slate-300 text-slate-300" :
                    "border-amber-700 text-amber-700"
                  )}>
                    {form.overallRating}
                  </div>
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Matches Played">
                  <Input type="number" min={0} placeholder="0" value={form.matchesPlayed}
                    onChange={e => set("matchesPlayed", e.target.value)} />
                </Field>
                <Field label="Goals">
                  <Input type="number" min={0} placeholder="0" value={form.goals}
                    onChange={e => set("goals", e.target.value)} />
                </Field>
                <Field label="Assists">
                  <Input type="number" min={0} placeholder="0" value={form.assists}
                    onChange={e => set("assists", e.target.value)} />
                </Field>
                <Field label="Clean Sheets (GK)">
                  <Input type="number" min={0} placeholder="0" value={form.cleanSheets}
                    onChange={e => set("cleanSheets", e.target.value)} />
                </Field>
              </div>
              <Field label="Pass Accuracy %" hint="e.g. 84.5">
                <Input type="number" min={0} max={100} step={0.1} placeholder="80.0" value={form.passAccuracy}
                  onChange={e => set("passAccuracy", e.target.value)} />
              </Field>
            </div>
          )}

          {/* STEP 2: Schedule */}
          {step === 2 && (
            <div className="space-y-6">
              <StepTitle>Your Schedule</StepTitle>
              <Field label="Days Available *" hint="Select all days you normally play">
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map(d => (
                    <button key={d} onClick={() => toggleDay(d)}
                      className={cn("flex-1 min-w-[3rem] py-3 rounded-lg border-2 text-sm font-bold uppercase transition-all",
                        form.availableDays.includes(d) ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground hover:border-primary/50"
                      )}>
                      {d}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Available From">
                  <Input type="time" value={form.availableFrom} onChange={e => set("availableFrom", e.target.value)} />
                </Field>
                <Field label="Available To">
                  <Input type="time" value={form.availableTo} onChange={e => set("availableTo", e.target.value)} />
                </Field>
              </div>
              <div className="bg-secondary/50 border border-border rounded-lg p-4 text-sm text-muted-foreground">
                This tells clubs when they can schedule tryouts with you. All times are in your local timezone.
              </div>
            </div>
          )}

          {/* STEP 3: Details */}
          {step === 3 && (
            <div className="space-y-6">
              <StepTitle>Final Details</StepTitle>
              <Field label="Country *">
                <select value={form.country} onChange={e => set("country", e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                  <option value="">Select country...</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Timezone *">
                <select value={form.timezone} onChange={e => set("timezone", e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm">
                  <option value="">Select timezone...</option>
                  {TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Bio" hint="Tell clubs about yourself — your style, experience, goals">
                <Textarea rows={4} placeholder="I'm a competitive ST with 3 seasons in Division 1..."
                  value={form.bio} onChange={e => set("bio", e.target.value)} />
              </Field>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="flex items-center gap-2 font-bold uppercase tracking-wider">
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!canNext() || createPlayer.isPending} className="font-bold uppercase tracking-wider px-8">
                {createPlayer.isPending ? "Creating..." : "Create Profile"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-black uppercase italic tracking-tight mb-2">{children}</h2>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-bold uppercase tracking-wider text-foreground">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}
