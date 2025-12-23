import { Header } from "@/components/Header";
import { MatchCard } from "@/components/MatchCard";
import { useLiveMatches } from "@/hooks/useLiveMatches";
import { RefreshCw, Zap, AlertCircle, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const Live = () => {
  const { matches, isLoading, lastUpdated, refetch, isError, isConfigured } =
    useLiveMatches();

  return (
    <div className="min-h-screen pb-24">
      <Header title="Live Matches" />

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-live fill-live" />
          <span className="font-semibold">
            {matches.length} Live {matches.length === 1 ? "Match" : "Matches"}
          </span>
          {!isConfigured && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              Demo
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {isError ? (
              <span className="text-destructive flex items-center gap-1">
                <WifiOff className="w-3 h-3" />
                Offline
              </span>
            ) : (
              `Updated ${format(lastUpdated, "HH:mm:ss")}`
            )}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
            className="rounded-full"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {isError && (
        <div className="mx-4 mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Connection issue. Showing last known data.</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && matches.length === 0 ? (
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        /* Live Matches */
        <div className="p-4 space-y-3">
          {matches.length === 0 ? (
            <div className="text-center py-16">
              <Zap className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold text-muted-foreground">
                No live matches right now
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Check back later for live action
              </p>
            </div>
          ) : (
            <div className="match-list space-y-3">
              {matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Auto-refresh indicator */}
      {matches.length > 0 && !isError && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2">
          <div className="bg-secondary/90 backdrop-blur-sm px-4 py-2 rounded-full text-xs text-muted-foreground flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Auto-refreshing every 15s
          </div>
        </div>
      )}
    </div>
  );
};

export default Live;
