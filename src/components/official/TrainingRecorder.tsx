import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/badge";
import { Calendar, UserCheck, Clock, Plus } from "lucide-react";
import { useTeamData } from "@/contexts/TeamDataContext";

export const TrainingRecorder = () => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const { members } = useTeamData();
  const playerMembers = members.filter(m => m.role === "player" || m.role === "captain");

  return (
    <Card className="bg-card border-border card-glow">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-primary" /> Training Log
        </CardTitle>
        <input 
          type="date" 
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-secondary/30 border border-border rounded px-2 py-1 text-xs font-body focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-xs font-body text-muted-foreground pb-2 border-b border-border">
          <span>Active Session</span>
          <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-500">Live</Badge>
        </div>
        
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
          {playerMembers.slice(0, 8).map(player => (
            <div key={player.id} className="flex items-center justify-between p-2 rounded-lg border border-border/50 bg-secondary/10">
              <span className="font-body text-sm text-foreground">{player.name}</span>
              <div className="flex gap-1">
                <button className="w-6 h-6 rounded bg-green-500/10 text-green-500 border border-green-500/20 flex items-center justify-center text-[10px] hover:bg-green-500/20 transition-colors">P</button>
                <button className="w-6 h-6 rounded bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center text-[10px] hover:bg-destructive/20 transition-colors">A</button>
                <button className="w-6 h-6 rounded bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-[10px] hover:bg-primary/20 transition-colors">E</button>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-heading text-xs transition-colors mt-2">
          Submit Attendance
        </button>
      </CardContent>
    </Card>
  );
};
