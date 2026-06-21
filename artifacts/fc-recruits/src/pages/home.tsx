import { Link } from "wouter";
import { useGetPlatformStats, useGetFeaturedPlayers, useGetFeaturedClubs } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Shield, ArrowRight } from "lucide-react";
import { PlayerCard } from "@/components/player-card";
import { ClubCard } from "@/components/club-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetPlatformStats();
  const { data: playersData, isLoading: playersLoading } = useGetFeaturedPlayers();
  const { data: clubsData, isLoading: clubsLoading } = useGetFeaturedClubs();

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="container relative mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-6">
            The Transfer Market <br />
            <span className="text-primary">For Pro Clubs</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Find your next star player. Discover your dream club.
            FC Recruits is the professional hub for competitive virtual football.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="text-lg px-8 py-6 uppercase font-bold tracking-wider">
              <Link href="/players">Find Players</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 uppercase font-bold tracking-wider bg-background/50 backdrop-blur-sm hover:bg-secondary">
              <Link href="/clubs">Find Clubs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Players" value={stats?.totalPlayers} loading={statsLoading} />
          <StatCard icon={Shield} label="Active Clubs" value={stats?.activeClubs} loading={statsLoading} />
          <StatCard icon={Trophy} label="Free Agents" value={stats?.freeAgents} loading={statsLoading} />
          <StatCard icon={ArrowRight} label="Tryouts" value={stats?.totalTryouts} loading={statsLoading} />
        </div>
      </section>

      {/* Featured Players */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black uppercase italic tracking-tight">Featured Free Agents</h2>
          <Button asChild variant="ghost" className="uppercase font-bold tracking-wider">
            <Link href="/players">View All</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {playersLoading ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-lg" />)
          ) : playersData?.players.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-border rounded-lg">
              No featured players right now
            </div>
          ) : (
            playersData?.players.slice(0, 4).map(player => (
              <PlayerCard key={player.id} player={player} />
            ))
          )}
        </div>
      </section>

      {/* Featured Clubs */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black uppercase italic tracking-tight">Recruiting Clubs</h2>
          <Button asChild variant="ghost" className="uppercase font-bold tracking-wider">
            <Link href="/clubs">View All</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubsLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)
          ) : clubsData?.clubs.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-border rounded-lg">
              No featured clubs right now
            </div>
          ) : (
            clubsData?.clubs.slice(0, 3).map(club => (
              <ClubCard key={club.id} club={club} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, loading }: { icon: any, label: string, value?: number, loading: boolean }) {
  return (
    <div className="bg-card border border-border p-6 rounded-lg text-center flex flex-col items-center">
      <Icon className="w-8 h-8 text-primary mb-4" />
      {loading ? (
        <Skeleton className="h-10 w-24 mb-2" />
      ) : (
        <div className="text-4xl font-black tracking-tighter mb-1">{value?.toLocaleString() || 0}</div>
      )}
      <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{label}</div>
    </div>
  );
}
