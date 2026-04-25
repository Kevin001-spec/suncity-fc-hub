import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Gamepad2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTeamData } from "@/contexts/TeamDataContext";
import { useToast } from "@/hooks/use-toast";

export const TrainingRecorder = () => {
  const { members, recordTrainingMatch } = useTeamData();
  const { toast } = useToast();

  const [showTrainingRecorder, setShowTrainingRecorder] = useState(false);
  const [trainingTeams, setTrainingTeams] = useState<{ teamA: string[], teamB: string[] }>({ teamA: [], teamB: [] });
  const [trainingScores, setTrainingScores] = useState({ teamA: 0, teamB: 0 });
  const [trainingPerfs, setTrainingPerfs] = useState<Record<string, any>>({});
  
  const playerMembers = useMemo(() => 
    members.filter((m) => m.role === "player" || m.role === "captain" || m.role === "finance" || m.role === "manager"),
    [members]
  );

  const membersMap = useMemo(() => {
    const map: Record<string, any> = {};
    playerMembers.forEach(m => map[m.id] = m);
    return map;
  }, [playerMembers]);

  const selectedPlayerIds = useMemo(() => [...trainingTeams.teamA, ...trainingTeams.teamB], [trainingTeams]);

  const handleRecordTraining = async () => {
    try {
      const perfs = playerMembers
        .filter(m => trainingPerfs[m.id])
        .map(m => ({
          playerId: m.id,
          team: trainingTeams.teamA.includes(m.id) ? 'A' : 'B',
          goals: trainingPerfs[m.id].goals || 0,
          assists: trainingPerfs[m.id].assists || 0,
          rating: trainingPerfs[m.id].rating || 5.0,
          isPotm: trainingPerfs[m.id].isPotm || false
        }));
      
      if (perfs.length === 0) {
        toast({ title: "No data", description: "Please record stats for at least one player.", variant: "destructive" });
        return;
      }

      await recordTrainingMatch({
        teamAScore: trainingScores.teamA,
        teamBScore: trainingScores.teamB,
        performances: perfs
      });

      toast({ title: "Training Recorded", description: "Results and player stats have been saved." });
      setShowTrainingRecorder(false);
      setTrainingTeams({ teamA: [], teamB: [] });
      setTrainingScores({ teamA: 0, teamB: 0 });
      setTrainingPerfs({});
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
      <Card className="bg-card border-border card-glow overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4">
          <Badge className="bg-green-600 text-white font-heading text-[10px] animate-pulse">NEW EVENT</Badge>
        </div>
        <CardHeader>
          <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary" /> Training Match Recorder
          </CardTitle>
          <p className="text-xs text-muted-foreground font-body">Record Team A vs Team B performance and results.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => setShowTrainingRecorder(!showTrainingRecorder)} variant={showTrainingRecorder ? "outline" : "default"} className="w-full font-body">
            {showTrainingRecorder ? "Close Recorder" : "Start New Recording"}
          </Button>

          {showTrainingRecorder && (
            <div className="space-y-6 pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-heading text-primary uppercase">Select Team A Players</label>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-1 border border-border rounded bg-secondary/20">
                    {playerMembers.map(m => (
                      <Badge key={m.id} variant={trainingTeams.teamA.includes(m.id) ? "default" : "outline"} 
                        className="cursor-pointer text-[10px]"
                        onClick={() => {
                          if (trainingTeams.teamA.includes(m.id)) setTrainingTeams(prev => ({ ...prev, teamA: prev.teamA.filter(id => id !== m.id) }));
                          else setTrainingTeams(prev => ({ teamA: [...prev.teamA, m.id], teamB: prev.teamB.filter(id => id !== m.id) }));
                        }}>{m.name}</Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-heading text-primary uppercase">Select Team B Players</label>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-1 border border-border rounded bg-secondary/20">
                    {playerMembers.map(m => (
                      <Badge key={m.id} variant={trainingTeams.teamB.includes(m.id) ? "default" : "outline"} 
                        className="cursor-pointer text-[10px]"
                        onClick={() => {
                          if (trainingTeams.teamB.includes(m.id)) setTrainingTeams(prev => ({ ...prev, teamB: prev.teamB.filter(id => id !== m.id) }));
                          else setTrainingTeams(prev => ({ teamB: [...prev.teamB, m.id], teamA: prev.teamA.filter(id => id !== m.id) }));
                        }}>{m.name}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 text-center">
                  <label className="text-xs font-heading text-primary">TEAM A SCORE</label>
                  <Input type="number" value={trainingScores.teamA} onChange={(e) => setTrainingScores(prev => ({ ...prev, teamA: +e.target.value }))} className="bg-secondary border-border font-body text-center text-xl" />
                </div>
                <div className="space-y-2 text-center">
                  <label className="text-xs font-heading text-primary">TEAM B SCORE</label>
                  <Input type="number" value={trainingScores.teamB} onChange={(e) => setTrainingScores(prev => ({ ...prev, teamB: +e.target.value }))} className="bg-secondary border-border font-body text-center text-xl" />
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-heading text-primary uppercase tracking-wider">Record Player Performances</p>
                <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {selectedPlayerIds.map(pid => {
                    const m = membersMap[pid];
                    if (!m) return null;
                    const isTeamA = trainingTeams.teamA.includes(pid);
                    const stats = trainingPerfs[pid] || { goals: 0, assists: 0, rating: 5.0, isPotm: false };
                    
                    return (
                      <div key={pid} className={cn("p-3 rounded-lg border flex flex-col gap-3 transition-colors", isTeamA ? "border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10" : "border-red-500/20 bg-red-500/5 hover:bg-red-500/10")}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={isTeamA ? "border-blue-500/40 text-blue-600" : "border-red-500/40 text-red-600"}>{isTeamA ? "Team A" : "Team B"}</Badge>
                            <span className="font-body text-sm font-medium text-foreground">{m.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] text-muted-foreground font-body">POTM?</label>
                            <Switch checked={stats.isPotm} onCheckedChange={(val) => setTrainingPerfs(prev => ({ ...prev, [pid]: { ...stats, isPotm: val } }))} />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] text-muted-foreground font-body">Goals</label>
                            <Input type="number" value={stats.goals} onChange={(e) => setTrainingPerfs(prev => ({ ...prev, [pid]: { ...stats, goals: +e.target.value } }))} className="h-8 text-xs bg-secondary border-border" />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground font-body">Assists</label>
                            <Input type="number" value={stats.assists} onChange={(e) => setTrainingPerfs(prev => ({ ...prev, [pid]: { ...stats, assists: +e.target.value } }))} className="h-8 text-xs bg-secondary border-border" />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground font-body">Rating (1-10)</label>
                            <Input type="number" step="0.1" value={stats.rating} onChange={(e) => setTrainingPerfs(prev => ({ ...prev, [pid]: { ...stats, rating: +e.target.value } }))} className="h-8 text-xs bg-secondary border-border" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleRecordTraining} className="w-full font-heading bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
                  <Save className="w-4 h-4 mr-2" /> Save Results
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
