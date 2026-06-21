import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";

import Layout from "@/components/layout";
import Home from "@/pages/home";
import Players from "@/pages/players";
import PlayerProfile from "@/pages/player-profile";
import Clubs from "@/pages/clubs";
import ClubProfile from "@/pages/club-profile";
import CreateClub from "@/pages/create-club";
import MyProfile from "@/pages/my-profile";
import CreateProfile from "@/pages/create-profile";
import Tryouts from "@/pages/tryouts";
import Notifications from "@/pages/notifications";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/players" component={Players} />
        <Route path="/players/:id" component={PlayerProfile} />
        <Route path="/clubs" component={Clubs} />
        <Route path="/clubs/create" component={CreateClub} />
        <Route path="/clubs/:id" component={ClubProfile} />
        <Route path="/profile" component={MyProfile} />
        <Route path="/profile/create" component={CreateProfile} />
        <Route path="/tryouts" component={Tryouts} />
        <Route path="/notifications" component={Notifications} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
