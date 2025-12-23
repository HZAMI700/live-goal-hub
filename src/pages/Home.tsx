import { useState } from "react";
import { Header } from "@/components/Header";
import { DateSelector } from "@/components/DateSelector";
import { LeagueSection } from "@/components/LeagueSection";
import { useTodayMatches } from "@/hooks/useTodayMatches";
import { Zap, AlertCircle, RefreshCw, Loader2, Wifi, WifiOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const Home = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();

  const { topLeagues, otherLeagues, isLoading, isError, scraperOnline, isWaking, refetch } =
    useTodayMatches();

  const liveCount = [...topLeagues, ...otherLeagues]
    .flatMap((l) => l.matches)
    .filter((m) => m.status === "LIVE" || m.status === "HT").length;

  return (
    <div className="min-h-screen pb-24">
      <Header title="LiveScore" />

      {/* Connection Status */}
      {isWaking && (
        <div className="mx-4 mt-2 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-2 text-sm text-primary">
          <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
          <span>Waking up server... This may take 30-60 seconds.</span>
        </div>
      )}

      {!isWaking && scraperOnline === false && (
        <div className="mx-4 mt-2 p-3 bg-muted rounded-lg flex items-center gap-2 text-sm text-muted-foreground">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Scraper offline. Using demo data.</span>
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="ml-auto">
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {!isWaking && scraperOnline === true && (
        <div className="mx-4 mt-2 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-2 text-sm text-primary">
          <Wifi className="w-4 h-4 shrink-0" />
          <span>Live data connected</span>
        </div>
      )}

      {/* Live Banner */}
      {liveCount > 0 && (
        <button
          onClick={() => navigate("/live")}
          className="w-full bg-gradient-to-r from-live/20 via-live/10 to-transparent border-b border-live/20 py-3 px-4 mt-2"
        >
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-5 h-5 text-live fill-live" />
            <span className="font-semibold text-live">
              {liveCount} Live {liveCount === 1 ? "Match" : "Matches"}
            </span>
            <span className="text-muted-foreground text-sm">• Tap to view</span>
          </div>
        </button>
      )}

      <DateSelector
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* Error State */}
      {isError && (
        <div className="mx-4 mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span>Failed to load matches</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Top Leagues */}
          {topLeagues.length > 0 && (
            <section className="mt-4">
              <h2 className="px-4 text-lg font-bold mb-3 text-muted-foreground uppercase tracking-wider text-xs">
                Top Leagues
              </h2>
              {topLeagues.map((league) => (
                <LeagueSection key={league.id} league={league} />
              ))}
            </section>
          )}

          {/* Other Leagues */}
          {otherLeagues.length > 0 && (
            <section className="mt-6">
              <h2 className="px-4 text-lg font-bold mb-3 text-muted-foreground uppercase tracking-wider text-xs">
                Other Leagues
              </h2>
              {otherLeagues.map((league) => (
                <LeagueSection key={league.id} league={league} />
              ))}
            </section>
          )}

          {/* Empty State */}
          {topLeagues.length === 0 && otherLeagues.length === 0 && (
            <div className="text-center py-16">
              <Zap className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold text-muted-foreground">
                No matches today
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Check back later for upcoming matches
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
