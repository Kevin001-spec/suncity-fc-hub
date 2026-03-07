import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamData } from "@/contexts/TeamDataContext";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LeagueTeam {
  id: string;
  team_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goal_difference: number;
  points: number;
  is_own_team: boolean;
  division: string;
}

const Results = () => {
  const { user } = useAuth();
  const { members, gameScores } = useTeamData();
  const [leagueTeams, setLeagueTeams] = useState<LeagueTeam[]>([]);

  useEffect(() => {
    supabase.from("league_teams").select("*").then(({ data }) => {
      if (data) setLeagueTeams((data as LeagueTeam[]).sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference));
    });
  }, []);

  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="font-heading text-2xl gold-text">Match Results</h1>
          <p className="text-muted-foreground text-sm font-body mt-1">All game history & league standings</p>
        </motion.div>

        {/* League Standings — Read-only, multi-team */}
        {leagueTeams.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader>
                <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" /> League Standings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full font-body text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2 px-2">#</th>
                        <th className="text-left py-2">Team</th>
                        <th className="text-center py-2 px-2">P</th>
                        <th className="text-center py-2 px-2">W</th>
                        <th className="text-center py-2 px-2">D</th>
                        <th className="text-center py-2 px-2">L</th>
                        <th className="text-center py-2 px-2">GD</th>
                        <th className="text-center py-2 px-2">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leagueTeams.map((team, i) => (
                        <tr key={team.id} className={`border-b border-border ${team.is_own_team ? "bg-primary/10 font-bold" : ""}`}>
                          <td className="py-2 px-2 text-muted-foreground">{i + 1}</td>
                          <td className={`py-2 ${team.is_own_team ? "text-primary font-heading" : "text-foreground"}`}>
                            {team.team_name}
                            {team.is_own_team && <Badge className="ml-2 bg-primary text-primary-foreground text-[10px] py-0 px-1">Us</Badge>}
                          </td>
                          <td className="py-2 px-2 text-center">{team.played}</td>
                          <td className="py-2 px-2 text-center text-green-600">{team.won}</td>
                          <td className="py-2 px-2 text-center text-primary">{team.drawn}</td>
                          <td className="py-2 px-2 text-center text-destructive">{team.lost}</td>
                          <td className="py-2 px-2 text-center">{team.goal_difference}</td>
                          <td className="py-2 px-2 text-center font-heading text-primary">{team.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* All Game Results */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-card border-border card-glow">
            <CardHeader>
              <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" /> All Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gameScores.length === 0 ? (
                <p className="text-muted-foreground text-sm font-body">No games recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {gameScores.map((game) => (
                    <div key={game.id} className="border border-border rounded-lg p-3 navy-accent">
                      <div className="flex items-center justify-between">
                        <div className="font-body">
                          <p className="text-foreground font-medium">vs {game.opponent}</p>
                          <p className="text-xs text-muted-foreground">{new Date(game.date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-heading text-lg text-primary">{game.ourScore}</span>
                          <span className="text-muted-foreground">-</span>
                          <span className="font-heading text-lg text-muted-foreground">{game.theirScore}</span>
                          <Badge variant="outline" className={`ml-2 text-xs font-body ${
                            game.ourScore > game.theirScore ? "border-green-500/30 text-green-600"
                            : game.ourScore < game.theirScore ? "border-destructive/30 text-destructive"
                            : "border-primary/30 text-primary"
                          }`}>
                            {game.ourScore > game.theirScore ? "W" : game.ourScore < game.theirScore ? "L" : "D"}
                          </Badge>
                        </div>
                      </div>
                      {game.scorers && game.scorers.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1 font-body">
                          ⚽ {game.scorers.map((sid) => members.find((m) => m.id === sid)?.name || sid).join(", ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Results;
