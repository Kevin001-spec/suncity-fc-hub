import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Award, Shield, Phone, Trash2 } from "lucide-react";
import { useTeamData } from "@/contexts/TeamDataContext";
import { useToast } from "@/hooks/use-toast";
import { maskId } from "@/lib/utils";

export const FanManagement = () => {
  const { members, updateFanBadge, updateFanPoints, removePlayer } = useTeamData();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const fans = members.filter(m => m.role === "fan" && m.name.toLowerCase().includes(search.toLowerCase()));

  const handleUpdateBadge = async (id: string, current: string) => {
    const badges = ["Bronze", "Silver", "Gold", "Platinum", "Legend"];
    const next = badges[(badges.indexOf(current || "Bronze") + 1) % badges.length];
    await updateFanBadge(id, next);
    toast({ title: "Badge Updated", description: `Member is now a ${next} fan.` });
  };

  const handleAddPoints = async (id: string, current: number) => {
    await updateFanPoints(id, (current || 0) + 10);
    toast({ title: "Points Added", description: "+10 Loyalty Points awarded." });
  };

  return (
    <Card className="bg-card border-border card-glow">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" /> Fan & Member Loyalty
        </CardTitle>
        <Input 
          placeholder="Search fans..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          className="w-48 bg-secondary border-border h-9 text-xs"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {fans.map(fan => (
          <div key={fan.id} className="p-4 rounded-2xl bg-secondary/10 border border-border/50 flex items-center justify-between group hover:bg-secondary/20 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-heading text-sm text-foreground">{fan.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] h-5 bg-background">{fan.fan_badge || "Standard"}</Badge>
                  <span className="text-[10px] text-muted-foreground font-body">ID: {maskId(fan.id)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right mr-4 hidden md:block">
                <p className="text-[10px] text-muted-foreground font-heading uppercase">Points</p>
                <p className="text-sm font-heading text-primary">{fan.fan_points || 0}</p>
              </div>
              <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleUpdateBadge(fan.id, fan.fan_badge || "")}>
                <Award className="w-4 h-4 text-yellow-500" />
              </Button>
              <Button size="sm" variant="outline" className="h-8 px-3 text-[10px] font-heading" onClick={() => handleAddPoints(fan.id, fan.fan_points || 0)}>
                +10 PTS
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removePlayer(fan.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {fans.length === 0 && (
          <div className="text-center py-8 text-muted-foreground font-body text-sm">No fans matching your search found.</div>
        )}
      </CardContent>
    </Card>
  );
};
