import { Link } from "wouter";
import { Club } from "@workspace/api-client-react";
import { Shield } from "lucide-react";

export function ClubCard({ club }: { club: Club }) {
  return (
    <Link href={`/clubs/${club.id}`} className="block group">
      <div className="bg-card border border-border rounded-lg overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(132,255,89,0.15)] hover:-translate-y-1">
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-lg bg-secondary/50 flex items-center justify-center border border-border overflow-hidden shrink-0">
              {club.logoUrl ? (
                <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover" />
              ) : (
                <Shield className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight line-clamp-1">{club.name}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  Div {club.division}
                </span>
                <span className="text-xs text-muted-foreground">{club.platform}</span>
                <span className="text-xs text-muted-foreground capitalize">{club.style}</span>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-6 flex-1">
            {club.description || "No description provided."}
          </p>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
            <div>
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider block mb-1">Looking For</span>
              <div className="flex flex-wrap gap-1">
                {club.openPositions ? (
                  JSON.parse(club.openPositions).slice(0, 3).map((pos: string) => (
                    <span key={pos} className="text-xs font-bold bg-secondary px-1.5 py-0.5 rounded">{pos}</span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">None</span>
                )}
                {club.openPositions && JSON.parse(club.openPositions).length > 3 && (
                  <span className="text-xs font-bold bg-secondary px-1.5 py-0.5 rounded">+{JSON.parse(club.openPositions).length - 3}</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider block mb-1">Roster</span>
              <span className="text-sm font-medium">{club.memberCount || 0} / {club.maxMembers || 11}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}