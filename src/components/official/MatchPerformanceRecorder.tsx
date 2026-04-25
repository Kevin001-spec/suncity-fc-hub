import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Star, History, TrendingUp } from "lucide-react";
import { useTeamData } from "@/contexts/TeamDataContext";

export const MatchPerformanceRecorder = () => {
  const { gameScores } = useTeamData();
  const latestGame = gameScores[0];

  return (
    <Card className="bg-card border-border card-glow h-full">
      <CardHeader>
        <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" /> Performance Log
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground font-body uppercase">Latest Match</p>
              <h4 className="font-heading text-sm text-foreground">vs {latestGame?.opponent || "N/A"}</h4>
            </div>
            <Badge variant="outline" className="border-primary/30 text-primary font-body">
              {latestGame?.ourScore}-{latestGame?.theirScore}
            </Badge>
          </div>
          <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-heading text-xs">
            Record Stats
          </Button>
        </div>

        <div className="space-y-3">
          <h4 className="text-[10px] font-heading text-muted-foreground uppercase tracking-widest">Recent Performance Records</h4>
          {gameScores.slice(1, 4).map(game => (
            <div key={game.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="min-w-0">
                <p className="font-body font-medium text-sm text-foreground truncate">vs {game.opponent}</p>
                <p className="text-[10px] text-muted-foreground font-body">{game.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-heading text-primary">{game.ourScore}-{game.theirScore}</p>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7">
                  <History className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
