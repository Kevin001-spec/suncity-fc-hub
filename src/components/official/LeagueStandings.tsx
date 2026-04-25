import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useTeamData } from "@/contexts/TeamDataContext";

export const LeagueStandings = () => {
  const { leagueTeams } = useTeamData();
  const [filter, setFilter] = useState<"all" | "top4" | "relegation">("all");

  const sortedTeams = useMemo(() => {
    return [...leagueTeams].sort((a, b) => b.points - a.points || b.gd - a.gd);
  }, [leagueTeams]);

  const filteredTeams = useMemo(() => {
    if (filter === "top4") return sortedTeams.slice(0, 4);
    if (filter === "relegation") return sortedTeams.slice(-3);
    return sortedTeams;
  }, [sortedTeams, filter]);

  return (
    <Card className="bg-card border-border card-glow h-full overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" /> NSL League Standings
        </CardTitle>
        <div className="flex gap-1">
          <button onClick={() => setFilter("all")} className={`px-2 py-1 rounded text-[10px] font-heading transition-colors ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>ALL</button>
          <button onClick={() => setFilter("top4")} className={`px-2 py-1 rounded text-[10px] font-heading transition-colors ${filter === "top4" ? "bg-green-500 text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>TOP 4</button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-[10px] font-heading text-muted-foreground uppercase">Pos</th>
                <th className="px-4 py-3 text-[10px] font-heading text-muted-foreground uppercase">Team</th>
                <th className="px-2 py-3 text-[10px] font-heading text-muted-foreground uppercase text-center">P</th>
                <th className="px-2 py-3 text-[10px] font-heading text-muted-foreground uppercase text-center">GD</th>
                <th className="px-4 py-3 text-[10px] font-heading text-muted-foreground uppercase text-center">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredTeams.map((team, idx) => {
                const actualPos = sortedTeams.findIndex(t => t.id === team.id) + 1;
                const isSuncity = team.name.toLowerCase().includes("suncity");
                const isPromotion = actualPos <= 2;
                const isPlayoff = actualPos > 2 && actualPos <= 4;
                const isRelegation = actualPos > sortedTeams.length - 3;

                return (
                  <tr key={team.id} className={`group hover:bg-primary/5 transition-colors ${isSuncity ? "bg-primary/10" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-heading w-6 h-6 rounded-full flex items-center justify-center ${isPromotion ? "bg-green-500/20 text-green-500" : isPlayoff ? "bg-blue-500/20 text-blue-500" : isRelegation ? "bg-red-500/20 text-red-500" : "bg-secondary text-muted-foreground"}`}>
                          {actualPos}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded bg-secondary flex items-center justify-center overflow-hidden">
                          {team.logo_url ? (
                            <img src={team.logo_url} alt={team.name} className="w-4 h-4 object-contain" />
                          ) : (
                            <Trophy className="w-3 h-3 text-muted-foreground/40" />
                          )}
                        </div>
                        <span className={`text-sm font-body ${isSuncity ? "font-bold text-primary" : "text-foreground"}`}>
                          {team.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center text-xs font-body text-muted-foreground">{team.played}</td>
                    <td className="px-2 py-3 text-center text-xs font-body">
                      <span className={team.gd > 0 ? "text-green-500" : team.gd < 0 ? "text-red-500" : "text-muted-foreground"}>
                        {team.gd > 0 ? `+${team.gd}` : team.gd}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-heading font-bold text-foreground">{team.points}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border bg-secondary/10 flex flex-wrap gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[10px] text-muted-foreground font-body">Promotion</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[10px] text-muted-foreground font-body">Playoffs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[10px] text-muted-foreground font-body">Relegation</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
