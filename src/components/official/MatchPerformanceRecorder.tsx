import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { UserPlus, Save, Star } from "lucide-react";
import { useTeamData } from "@/contexts/TeamDataContext";
import { useToast } from "@/hooks/use-toast";

export const MatchPerformanceRecorder = () => {
  const { members, gameScores, addMatchPerformance } = useTeamData();
  const { toast } = useToast();

  const [selectedGameId, setSelectedGameId] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [performance, setPerformance] = useState({
    goals: 0, assists: 0, saves: 0, tackles: 0, 
    interceptions: 0, blocks: 0, clearances: 0,
    cleanSheet: false, aerialDuels: 0, rating: 6.0,
    isPotm: false, directShots: 0
  });

  const recentGames = gameScores.filter(g => g.status === "completed").slice(0, 5);
  const players = members.filter(m => m.role === "player" || m.role === "captain");

  const handleSave = async () => {
    if (!selectedGameId || !selectedPlayerId) {
      toast({ title: "Missing Data", description: "Please select both a game and a player.", variant: "destructive" });
      return;
    }

    try {
      await addMatchPerformance({
        matchId: selectedGameId,
        playerId: selectedPlayerId,
        ...performance
      });
      toast({ title: "Performance Recorded", description: "Player match stats have been updated." });
      setPerformance({
        goals: 0, assists: 0, saves: 0, tackles: 0, 
        interceptions: 0, blocks: 0, clearances: 0,
        cleanSheet: false, aerialDuels: 0, rating: 6.0,
        isPotm: false, directShots: 0
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Card className="bg-card border-border card-glow h-full">
      <CardHeader>
        <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" /> Performance Recorder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] text-muted-foreground font-heading uppercase">Match</label>
            <select 
              className="w-full bg-secondary border border-border rounded-md h-10 px-3 text-sm font-body"
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value)}
            >
              <option value="">Select Match</option>
              {recentGames.map(g => (
                <option key={g.id} value={g.id}>{g.opponent} ({g.date})</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-muted-foreground font-heading uppercase">Player</label>
            <select 
              className="w-full bg-secondary border border-border rounded-md h-10 px-3 text-sm font-body"
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
            >
              <option value="">Select Player</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {Object.entries(performance).map(([key, val]) => {
            if (typeof val === "boolean") return (
              <div key={key} className="flex flex-col items-center justify-center p-2 rounded-xl bg-secondary/20 border border-border gap-2">
                <label className="text-[10px] text-muted-foreground font-heading uppercase">{key}</label>
                <Switch 
                  checked={val} 
                  onCheckedChange={(checked) => setPerformance(prev => ({ ...prev, [key]: checked }))} 
                />
              </div>
            );
            if (key === "rating") return (
              <div key={key} className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-heading uppercase">{key}</label>
                <Input 
                  type="number" step="0.1"
                  value={val}
                  onChange={(e) => setPerformance(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                  className="h-10 bg-secondary border-border"
                />
              </div>
            );
            return (
              <div key={key} className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-heading uppercase">{key}</label>
                <Input 
                  type="number"
                  value={val}
                  onChange={(e) => setPerformance(prev => ({ ...prev, [key]: parseInt(e.target.value) || 0 }))}
                  className="h-10 bg-secondary border-border"
                />
              </div>
            );
          })}
        </div>

        <Button onClick={handleSave} className="w-full font-heading h-12 text-lg">
          <Save className="w-5 h-5 mr-2" /> Record Performance
        </Button>
      </CardContent>
    </Card>
  );
};
