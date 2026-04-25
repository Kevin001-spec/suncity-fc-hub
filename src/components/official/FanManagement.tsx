import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Heart } from "lucide-react";
import { useTeamData } from "@/contexts/TeamDataContext";

export const FanManagement = () => {
  const { members, profilePics } = useTeamData();
  const fans = members.filter(m => m.role === "fan");

  return (
    <Card className="bg-card border-border card-glow">
      <CardHeader>
        <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary" /> Fans Directory
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {fans.map(fan => {
            const pic = profilePics[fan.id];
            return (
              <div key={fan.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border border-primary/20">
                    {pic && <AvatarImage src={pic} className="aspect-square object-cover" />}
                    <AvatarFallback className="bg-secondary text-primary text-xs">{fan.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-body font-medium text-sm text-foreground truncate">{fan.name}</p>
                    <p className="text-[10px] text-muted-foreground font-body">{fan.fanBadge || "Supporter"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-heading text-primary">{fan.fanPoints || 0}</p>
                  <p className="text-[10px] text-muted-foreground font-body">Points</p>
                </div>
              </div>
            );
          })}
          {fans.length === 0 && <p className="text-center text-sm text-muted-foreground font-body py-4">No fans registered yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
};
