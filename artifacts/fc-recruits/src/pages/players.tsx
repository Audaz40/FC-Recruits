import { useState } from "react";
import { useListPlayers } from "@workspace/api-client-react";
import { PlayerCard } from "@/components/player-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, SlidersHorizontal } from "lucide-react";

export default function Players() {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("");
  const [position, setPosition] = useState("");
  const [freeAgent, setFreeAgent] = useState("true");

  const { data, isLoading } = useListPlayers({ 
    search: search || undefined,
    platform: platform && platform !== "all" ? platform : undefined,
    position: position && position !== "all" ? position : undefined,
    freeAgent: freeAgent === "true" ? true : freeAgent === "false" ? false : undefined
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Player Directory</h1>
          <p className="text-muted-foreground">Find the perfect addition to your squad.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 space-y-6 shrink-0">
          <div className="bg-card border border-border p-4 rounded-lg space-y-4">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider mb-2">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              Filters
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Gamertag..." 
                  className="pl-9 bg-secondary border-border"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Platform</label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="All Platforms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="PS5">PlayStation 5</SelectItem>
                  <SelectItem value="Xbox">Xbox Series X|S</SelectItem>
                  <SelectItem value="PC">PC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Position</label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="All Positions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  <SelectItem value="ST">ST - Striker</SelectItem>
                  <SelectItem value="LW">LW - Left Wing</SelectItem>
                  <SelectItem value="RW">RW - Right Wing</SelectItem>
                  <SelectItem value="CAM">CAM - Att. Mid</SelectItem>
                  <SelectItem value="CM">CM - Center Mid</SelectItem>
                  <SelectItem value="CDM">CDM - Def. Mid</SelectItem>
                  <SelectItem value="CB">CB - Center Back</SelectItem>
                  <SelectItem value="LB">LB - Left Back</SelectItem>
                  <SelectItem value="RB">RB - Right Back</SelectItem>
                  <SelectItem value="GK">GK - Goalkeeper</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</label>
              <Select value={freeAgent} onValueChange={setFreeAgent}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Free Agents Only" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Players</SelectItem>
                  <SelectItem value="true">Free Agents Only</SelectItem>
                  <SelectItem value="false">Signed Players</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              variant="outline" 
              className="w-full uppercase font-bold tracking-wider"
              onClick={() => { setSearch(""); setPlatform(""); setPosition(""); setFreeAgent("all"); }}
            >
              Reset Filters
            </Button>
          </div>
        </aside>

        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-lg" />)}
            </div>
          ) : data?.players.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-border rounded-lg bg-card">
              <h3 className="text-2xl font-black uppercase tracking-tight mb-2">No players found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your filters to see more results.</p>
              <Button 
                variant="outline" 
                onClick={() => { setSearch(""); setPlatform(""); setPosition(""); setFreeAgent("all"); }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.players.map(player => (
                <PlayerCard key={player.id} player={player} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}