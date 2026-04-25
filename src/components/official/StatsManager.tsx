import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Award, BarChart3, Clock, Zap } from "lucide-react";
import { useTeamData } from "@/contexts/TeamDataContext";

export const StatsManager = () => {
  const { members, gameScores } = useTeamData();

  const totalGoals = members.reduce((sum, m) => sum + (m.goals || 0), 0);
  const totalAssists = members.reduce((sum, m) => sum + (m.assists || 0), 0);
  const totalGames = gameScores.length;

  return (
    <Card className="bg-card border-border card-glow">
      <CardHeader>
        <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" /> Analytics Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground font-body uppercase tracking-widest">Season Goals</p>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-heading text-foreground">{totalGoals}</h3>
              <Badge variant="outline" className="bg-green-500/5 text-green-500 border-green-500/20 text-[10px]">
                <TrendingUp className="w-2.5 h-2.5 mr-1" /> +12%
              </Badge>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground font-body uppercase tracking-widest">Total Assists</p>
            <h3 className="text-2xl font-heading text-foreground">{totalAssists}</h3>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground font-body uppercase tracking-widest">Clean Sheets</p>
            <h3 className="text-2xl font-heading text-foreground">8</h3>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground font-body uppercase tracking-widest">Matches Played</p>
            <h3 className="text-2xl font-heading text-foreground">{totalGames}</h3>
          </div>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-border bg-secondary/20 flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-heading text-sm text-foreground">Generate Report</p>
                <p className="text-xs text-muted-foreground font-body">Download season summary</p>
              </div>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8">
              <Clock className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
