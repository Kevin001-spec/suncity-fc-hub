import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Save, X, Plus, Calendar } from "lucide-react";
import { useTeamData } from "@/contexts/TeamDataContext";
import { type GameScore } from "@/data/team-data";

export const GameScoreEditor = ({ game, onSave, onCancel }: { game?: GameScore; onSave: (g: any) => void; onCancel: () => void }) => {
  const [formData, setFormData] = useState({
    opponent: game?.opponent || "",
    ourScore: game?.ourScore || 0,
    theirScore: game?.theirScore || 0,
    date: game?.date || new Date().toISOString().split("T")[0],
    scorers: game?.scorers || [],
  });

  return (
    <Card className="bg-card border-border shadow-xl">
      <CardHeader>
        <CardTitle className="font-heading text-lg text-primary flex items-center gap-2">
          <Trophy className="w-5 h-5" /> {game ? "Edit Match Result" : "Record New Match"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 font-body">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wider">Opponent Team</label>
          <input
            type="text"
            value={formData.opponent}
            onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
            className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Enter opponent name"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">SunCity Score</label>
            <input
              type="number"
              value={formData.ourScore}
              onChange={(e) => setFormData({ ...formData, ourScore: parseInt(e.target.value) || 0 })}
              className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Their Score</label>
            <input
              type="number"
              value={formData.theirScore}
              onChange={(e) => setFormData({ ...formData, theirScore: parseInt(e.target.value) || 0 })}
              className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wider">Match Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-secondary/30 border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-heading text-xs" onClick={() => onSave(formData)}>
            <Save className="w-3.5 h-3.5 mr-2" /> Save Result
          </Button>
          <Button variant="outline" className="flex-1 font-heading text-xs" onClick={onCancel}>
            <X className="w-3.5 h-3.5 mr-2" /> Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
