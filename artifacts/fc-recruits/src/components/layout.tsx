import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Bell, Trophy, Users, Shield, UserCircle, Menu } from "lucide-react";
import { useGetMyPlayer } from "@workspace/api-client-react";
import { useListNotifications } from "@workspace/api-client-react";
import { Button } from "./ui/button";

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: myPlayer } = useGetMyPlayer();
  const { data: notifications } = useListNotifications();

  const unreadCount = notifications?.unreadCount || 0;

  const NavLink = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
    const isActive = location === href || location.startsWith(href + "/");
    return (
      <Link href={href} className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
        <Icon className="w-4 h-4" />
        <span className="hidden md:inline">{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/30">
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tighter uppercase italic text-foreground">
            <Trophy className="w-6 h-6 text-primary" />
            <span>FC <span className="text-primary">Recruits</span></span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/players" icon={Users} label="Players" />
            <NavLink href="/clubs" icon={Shield} label="Clubs" />
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/notifications" className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
            </Link>
            
            {myPlayer ? (
              <Link href="/profile" className="flex items-center gap-2 ml-2 p-1 pr-3 rounded-full border border-border bg-secondary/50 hover:bg-secondary transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                  {myPlayer.avatarUrl ? (
                    <img src={myPlayer.avatarUrl} alt={myPlayer.gamertag} className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle className="w-5 h-5 text-primary" />
                  )}
                </div>
                <span className="text-sm font-bold tracking-tight">{myPlayer.gamertag}</span>
              </Link>
            ) : (
              <Button asChild variant="default" size="sm" className="ml-2 font-bold uppercase tracking-wider">
                <Link href="/profile/create">Join Draft</Link>
              </Button>
            )}
            
            <Button variant="ghost" size="icon" className="md:hidden ml-2">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t border-border py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-lg font-black tracking-tighter uppercase italic opacity-50">
            <Trophy className="w-5 h-5" />
            <span>FC Recruits</span>
          </div>
          <p>The premier recruitment platform for EA Sports FC Pro Clubs.</p>
        </div>
      </footer>
    </div>
  );
}