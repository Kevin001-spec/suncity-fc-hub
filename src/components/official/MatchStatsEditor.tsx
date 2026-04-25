import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Save, X, Activity } from "lucide-react";

export const MatchStatsEditor = ({ playerId, gameId, onSave, onCancel }: { playerId: string, gameId: string, onSave: (s: any) => void, onCancel: () => void }) => {
  const [stats, setStats] = useState({
    goals: 0,
    assists: 0,
    tackles: 0,
    saves: 0,
    rating: 6.0,
    isPotm: false
  });

  return (
    <Card className="bg-card border-border shadow-2xl">
      <CardHeader>
        <CardTitle className="font-heading text-lg text-primary flex items-center gap-2">
          <Activity className="w-5 h-5" /> Edit Player Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 font-body">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase">Goals</label>
            <input type="number" value={stats.goals} onChange={(e) => setStats({...stats, goals: parseInt(e.target.value)||0})} className="w-full bg-secondary/30 border border-border rounded p-2 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase">Assists</label>
            <input type="number" value={stats.assists} onChange={(e) => setStats({...stats, assists: parseInt(e.target.value)||0})} className="w-full bg-secondary/30 border border-border rounded p-2 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase">Tackles</label>
            <input type="number" value={stats.tackles} onChange={(e) => setStats({...stats, tackles: parseInt(e.target.value)||0})} className="w-full bg-secondary/30 border border-border rounded p-2 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase">Saves</label>
            <input type="number" value={stats.saves} onChange={(e) => setStats({...stats, saves: parseInt(e.target.value)||0})} className="w-full bg-secondary/30 border border-border rounded p-2 text-sm" />
          </div>
        </div>
        
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
          <span className="text-xs font-heading">Man of the Match</span>
          <input type="checkbox" checked={stats.isPotm} onChange={(e) => setStats({...stats, isPotm: e.target.checked})} className="w-4 h-4 accent-primary" />
        </div>

        <div className="flex gap-2 pt-2">
          <Button size="sm" className="flex-1 bg-primary font-heading text-[10px]" onClick={() => onSave(stats)}><Save className="w-3 h-3 mr-1" /> Save</Button>
          <Button size="sm" variant="outline" className="flex-1 font-heading text-[10px]" onClick={onCancel}><X className="w-3 h-3 mr-1" /> Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
};
