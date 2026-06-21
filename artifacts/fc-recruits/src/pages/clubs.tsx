import { useState } from "react";
import { useListClubs } from "@workspace/api-client-react";
import { ClubCard } from "@/components/club-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, SlidersHorizontal } from "lucide-react";

export default function Clubs() {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("");
  const [style, setStyle] = useState("");
  const [division, setDivision] = useState("");

  const { data, isLoading } = useListClubs({ 
    search: search || undefined,
    platform: platform && platform !== "all" ? platform : undefined,
    style: style && style !== "all" ? style : undefined,
    division: division && division !== "all" ? parseInt(division) : undefined
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Club Directory</h1>
          <p className="text-muted-foreground">Find a team that matches your playstyle.</p>
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
                  placeholder="Club name..." 
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
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Playstyle</label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="All Styles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Styles</SelectItem>
                  <SelectItem value="competitive">Competitive</SelectItem>
                  <SelectItem value="semi-competitive">Semi-Competitive</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Division</label>
              <Select value={division} onValueChange={setDivision}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="All Divisions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions</SelectItem>
                  <SelectItem value="1">Division 1</SelectItem>
                  <SelectItem value="2">Division 2</SelectItem>
                  <SelectItem value="3">Division 3</SelectItem>
                  <SelectItem value="4">Division 4+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              variant="outline" 
              className="w-full uppercase font-bold tracking-wider"
              onClick={() => { setSearch(""); setPlatform(""); setStyle(""); setDivision("all"); }}
            >
              Reset Filters
            </Button>
          </div>
        </aside>

        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-lg" />)}
            </div>
          ) : data?.clubs.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-border rounded-lg bg-card">
              <h3 className="text-2xl font-black uppercase tracking-tight mb-2">No clubs found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your filters to see more results.</p>
              <Button 
                variant="outline" 
                onClick={() => { setSearch(""); setPlatform(""); setStyle(""); setDivision("all"); }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {data?.clubs.map(club => (
                <ClubCard key={club.id} club={club} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}