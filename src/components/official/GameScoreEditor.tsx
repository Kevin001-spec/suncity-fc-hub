import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit2, Save, Trash2, Calendar, MapPin, Trophy } from "lucide-react";
import { useTeamData } from "@/contexts/TeamDataContext";
import { useToast } from "@/hooks/use-toast";

export const GameScoreEditor = () => {
  const { gameScores, addGameScore, updateGameScore, deleteGameScore } = useTeamData();
  const { toast } = useToast();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    opponent: "", date: "", location: "", competition: "", time: "",
    status: "scheduled" as "scheduled" | "completed",
    ourScore: 0, opponentScore: 0, result: ""
  });

  const handleAdd = async () => {
    try {
      await addGameScore(formData);
      toast({ title: "Match Added", description: `Fixture vs ${formData.opponent} created.` });
      setIsAdding(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateGameScore(id, formData);
      toast({ title: "Match Updated", description: "Changes saved successfully." });
      setEditingId(null);
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => setFormData({
    opponent: "", date: "", location: "", competition: "", time: "",
    status: "scheduled", ourScore: 0, opponentScore: 0, result: ""
  });

  return (
    <Card className="bg-card border-border card-glow">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" /> Fixtures & Results
        </CardTitle>
        <Button size="sm" onClick={() => { setIsAdding(true); resetForm(); }}>New Fixture</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Opponent" value={formData.opponent} onChange={e => setFormData({ ...formData, opponent: e.target.value })} className="bg-background" />
              <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="bg-background" />
              <Input placeholder="Location" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="bg-background" />
              <Input placeholder="Competition" value={formData.competition} onChange={e => setFormData({ ...formData, competition: e.target.value })} className="bg-background" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} className="flex-1 font-heading">Create Match</Button>
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {gameScores.map(score => (
          <div key={score.id} className="p-4 rounded-2xl bg-secondary/10 border border-border group hover:bg-secondary/20 transition-all">
            {editingId === score.id ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Our Score" type="number" value={formData.ourScore} onChange={e => setFormData({ ...formData, ourScore: +e.target.value })} className="bg-background" />
                  <Input placeholder="Opponent Score" type="number" value={formData.opponentScore} onChange={e => setFormData({ ...formData, opponentScore: +e.target.value })} className="bg-background" />
                </div>
                <select 
                  className="w-full bg-background border border-border rounded-md h-10 px-3 text-sm font-body"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                </select>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleUpdate(score.id)}>Save Changes</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-heading text-primary uppercase">{score.competition}</span>
                    <Badge variant={score.status === "completed" ? "default" : "outline"} className="text-[8px] h-4">
                      {score.status}
                    </Badge>
                  </div>
                  <h4 className="font-heading text-sm text-foreground">vs {score.opponent}</h4>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground font-body">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {score.date}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {score.location}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {score.status === "completed" && (
                    <div className="text-right mr-4">
                      <p className="text-lg font-heading text-foreground">{score.ourScore} - {score.opponentScore}</p>
                    </div>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingId(score.id); setFormData({ ...score } as any); }}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteGameScore(score.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
