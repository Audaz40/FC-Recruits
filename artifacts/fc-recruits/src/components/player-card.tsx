import { Link } from "wouter";
import { Player } from "@workspace/api-client-react";
import { getOvrColor, getPositionColor } from "@/lib/utils";

export function PlayerCard({ player }: { player: Player }) {
  return (
    <Link href={`/players/${player.id}`} className="block group">
      <div className="bg-card border border-border rounded-lg overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(132,255,89,0.15)] hover:-translate-y-1">
        <div className="relative aspect-[3/4] bg-gradient-to-b from-secondary to-background p-4 flex flex-col items-center justify-between">
          <div className="absolute top-4 left-4 flex flex-col items-center">
            <div className={`text-2xl font-black tracking-tighter w-12 h-12 flex items-center justify-center rounded-md border-2 ${getOvrColor(player.overallRating)}`}>
              {player.overallRating}
            </div>
            <div className={`mt-2 px-2 py-1 rounded text-xs font-bold border ${getPositionColor(player.mainPosition)}`}>
              {player.mainPosition}
            </div>
          </div>
          
          <div className="w-32 h-32 rounded-full mt-8 overflow-hidden border-4 border-background bg-secondary shadow-xl relative">
             {player.avatarUrl ? (
               <img src={player.avatarUrl} alt={player.gamertag} className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full bg-secondary flex items-center justify-center text-4xl font-black text-muted-foreground">
                 {player.gamertag.charAt(0).toUpperCase()}
               </div>
             )}
          </div>
          
          <div className="w-full text-center mt-auto">
            <h3 className="text-xl font-black uppercase tracking-tight truncate px-2">{player.gamertag}</h3>
            <div className="flex items-center justify-center gap-2 mt-1 text-sm text-muted-foreground">
              <span>{player.platform}</span>
              <span>•</span>
              <span>{player.country}</span>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-border/50 bg-secondary/20 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Status</span>
            <span className={`text-sm font-medium ${player.freeAgent ? "text-primary" : "text-foreground"}`}>
              {player.freeAgent ? "Free Agent" : player.clubName || "Signed"}
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Matches</span>
            <span className="text-sm font-medium">{player.matchesPlayed || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}