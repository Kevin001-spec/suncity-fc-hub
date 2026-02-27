import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamData } from "@/contexts/TeamDataContext";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Results = () => {
  const { user } = useAuth();
  const { members, gameScores } = useTeamData();
  const { toast } = useToast();
  const isManager = user?.role === "manager";

  const [standings, setStandings] = useState({ played: 0, won: 0, drawn: 0, lost: 0, gd: 0, pts: 0 });
  const [standingsLoaded, setStandingsLoaded] = useState(false);
  const [standingsId, setStandingsId] = useState<string | null>(null);

  // Load standings
  if (!standingsLoaded) {
    supabase.from("league_standings").select("*").limit(1).then(({ data }) => {
      if (data && data.length > 0) {
        const s = data[0] as any;
        setStandings({ played: s.played, won: s.won, drawn: s.drawn, lost: s.lost, gd: s.goal_difference, pts: s.points });
        setStandingsId(s.id);
      }
      setStandingsLoaded(true);
    });
  }

  const saveStandings = async () => {
    const payload = { played: standings.played, won: standings.won, drawn: standings.drawn, lost: standings.lost, goal_difference: standings.gd, points: standings.pts, updated_at: new Date().toISOString() };
    if (standingsId) {
      await supabase.from("league_standings").update(payload).eq("id", standingsId);
    } else {
      const { data } = await supabase.from("league_standings").insert(payload).select().single();
      if (data) setStandingsId((data as any).id);
    }
    toast({ title: "Standings Updated" });
  };

  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="font-heading text-2xl gold-text">Match Results</h1>
          <p className="text-muted-foreground text-sm font-body mt-1">All game history & league standings</p>
        </motion.div>

        {/* League Standings */}
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
                      <th className="text-center py-2 px-3">P</th>
                      <th className="text-center py-2 px-3">W</th>
                      <th className="text-center py-2 px-3">D</th>
                      <th className="text-center py-2 px-3">L</th>
                      <th className="text-center py-2 px-3">GD</th>
                      <th className="text-center py-2 px-3">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      {isManager ? (
                        <>
                          <td className="py-2 px-1 text-center"><Input type="number" value={standings.played} onChange={(e) => setStandings(s => ({ ...s, played: +e.target.value }))} className="w-14 h-8 text-center bg-secondary border-border text-xs" /></td>
                          <td className="py-2 px-1 text-center"><Input type="number" value={standings.won} onChange={(e) => setStandings(s => ({ ...s, won: +e.target.value }))} className="w-14 h-8 text-center bg-secondary border-border text-xs" /></td>
                          <td className="py-2 px-1 text-center"><Input type="number" value={standings.drawn} onChange={(e) => setStandings(s => ({ ...s, drawn: +e.target.value }))} className="w-14 h-8 text-center bg-secondary border-border text-xs" /></td>
                          <td className="py-2 px-1 text-center"><Input type="number" value={standings.lost} onChange={(e) => setStandings(s => ({ ...s, lost: +e.target.value }))} className="w-14 h-8 text-center bg-secondary border-border text-xs" /></td>
                          <td className="py-2 px-1 text-center"><Input type="number" value={standings.gd} onChange={(e) => setStandings(s => ({ ...s, gd: +e.target.value }))} className="w-14 h-8 text-center bg-secondary border-border text-xs" /></td>
                          <td className="py-2 px-1 text-center"><Input type="number" value={standings.pts} onChange={(e) => setStandings(s => ({ ...s, pts: +e.target.value }))} className="w-14 h-8 text-center bg-secondary border-border text-xs" /></td>
                        </>
                      ) : (
                        <>
                          <td className="py-2 px-3 text-center font-heading">{standings.played}</td>
                          <td className="py-2 px-3 text-center font-heading text-green-600">{standings.won}</td>
                          <td className="py-2 px-3 text-center font-heading text-primary">{standings.drawn}</td>
                          <td className="py-2 px-3 text-center font-heading text-destructive">{standings.lost}</td>
                          <td className="py-2 px-3 text-center font-heading">{standings.gd}</td>
                          <td className="py-2 px-3 text-center font-heading text-primary font-bold">{standings.pts}</td>
                        </>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
              {isManager && (
                <Button onClick={saveStandings} size="sm" className="mt-3 font-body">
                  <Save className="w-4 h-4 mr-1" /> Save Standings
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

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
                          Goals: {game.scorers.map((sid) => members.find((m) => m.id === sid)?.name || sid).join(", ")}
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
