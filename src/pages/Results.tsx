import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamData } from "@/contexts/TeamDataContext";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, MapPin, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LottieAnimation from "@/components/LottieAnimation";
import resultsAnimation from "@/assets/animations/resultsanimation.json";

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

interface GameStatRow {
  id: string;
  game_id: string;
  half: string;
  shots: number;
  shots_on_target: number;
  penalties: number;
  freekicks: number;
  corner_kicks: number;
  fouls: number;
  offsides: number;
  yellow_cards: number;
  red_cards: number;
}

const STAT_LABELS: [string, keyof Omit<GameStatRow, "id" | "game_id" | "half">][] = [
  ["Shots", "shots"],
  ["Shots on Target", "shots_on_target"],
  ["Penalties", "penalties"],
  ["Freekicks", "freekicks"],
  ["Corner Kicks", "corner_kicks"],
  ["Fouls", "fouls"],
  ["Offsides", "offsides"],
  ["Yellow Cards", "yellow_cards"],
  ["Red Cards", "red_cards"],
];

const Results = () => {
  const { user } = useAuth();
  const { members, gameScores } = useTeamData();
  const [leagueTeams, setLeagueTeams] = useState<LeagueTeam[]>([]);
  const [latestGameStats, setLatestGameStats] = useState<GameStatRow[]>([]);

  useEffect(() => {
    supabase.from("league_teams").select("*").then(({ data }) => {
      if (data) setLeagueTeams((data as LeagueTeam[]).sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference));
    });
  }, []);

  // Find most recent game and load its stats
  const latestGame = useMemo(() => {
    if (gameScores.length === 0) return null;
    return [...gameScores].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [gameScores]);

  useEffect(() => {
    if (!latestGame) return;
    supabase.from("game_stats").select("*").eq("game_id", latestGame.id).then(({ data }) => {
      if (data && data.length > 0) setLatestGameStats(data as GameStatRow[]);
      else setLatestGameStats([]);
    });
  }, [latestGame]);

  const firstHalf = latestGameStats.find(s => s.half === "first");
  const secondHalf = latestGameStats.find(s => s.half === "second");

  const mainTeams = leagueTeams.filter(t => !t.division || t.division === "league");
  const amateurTeams = leagueTeams.filter(t => t.division === "amateur");

  if (!user) return <Navigate to="/" replace />;

  const gameTypeBadgeColor = (type?: string) => {
    if (type === "league") return "bg-primary text-primary-foreground";
    if (type === "amateur") return "bg-green-600 text-white";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <LottieAnimation animationData={resultsAnimation} className="h-36 mb-2" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="font-heading text-2xl gold-text">Match Results</h1>
          <p className="text-muted-foreground text-sm font-body mt-1">All game history & league standings</p>
        </motion.div>

        {/* Latest Game Stats Table */}
        {latestGame && (firstHalf || secondHalf) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader>
                <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" /> Match Stats — vs {latestGame.opponent}
                </CardTitle>
                <p className="text-xs text-muted-foreground font-body">
                  {new Date(latestGame.date).toLocaleDateString()} · {latestGame.ourScore} - {latestGame.theirScore}
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full font-body text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2 px-2">Stat</th>
                        <th className="text-center py-2 px-2">1st Half</th>
                        <th className="text-center py-2 px-2">2nd Half</th>
                        <th className="text-center py-2 px-2 font-heading">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {STAT_LABELS.map(([label, key]) => {
                        const f = firstHalf ? (firstHalf[key] as number) || 0 : 0;
                        const s = secondHalf ? (secondHalf[key] as number) || 0 : 0;
                        return (
                          <tr key={key} className="border-b border-border">
                            <td className="py-2 px-2 text-foreground">{label}</td>
                            <td className="py-2 px-2 text-center">{f}</td>
                            <td className="py-2 px-2 text-center">{s}</td>
                            <td className="py-2 px-2 text-center font-heading text-primary">{f + s}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* League Standings */}
        {mainTeams.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader>
                <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" /> Kanjuri League Standings
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
                      {mainTeams.map((team, i) => (
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

        {/* Amateur Standings */}
        {amateurTeams.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader>
                <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" /> Amateur Standings
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
                      {amateurTeams.map((team, i) => (
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
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-[10px] py-0 px-1.5 font-heading uppercase ${gameTypeBadgeColor(game.gameType)}`}>
                              {game.gameType || "friendly"}
                            </Badge>
                            {game.venue && (
                              <span className="text-[10px] text-muted-foreground font-body flex items-center gap-0.5">
                                <MapPin className="w-3 h-3" /> {game.venue}
                              </span>
                            )}
                          </div>
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
