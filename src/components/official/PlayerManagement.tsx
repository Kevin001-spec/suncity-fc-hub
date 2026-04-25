import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Search, Filter } from "lucide-react";
import { useTeamData } from "@/contexts/TeamDataContext";
import { getFullPositionName } from "@/data/team-data";

export const PlayerManagement = () => {
  const { members, profilePics } = useTeamData();
  const [search, setSearch] = useState("");
  
  const players = members.filter(m => m.role !== "fan" && m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Card className="bg-card border-border card-glow">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" /> Squad Management
        </CardTitle>
        <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-heading text-xs">
          <UserPlus className="w-3 h-3 mr-1" /> Add Member
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-secondary/30 border border-border rounded-lg pl-10 pr-4 py-2 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {players.map(player => {
            const pic = profilePics[player.id];
            return (
              <div key={player.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/10 hover:bg-secondary/30 transition-all group">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border border-primary/20">
                    {pic && <AvatarImage src={pic} className="aspect-square object-cover" />}
                    <AvatarFallback className="bg-secondary text-primary font-heading text-sm">{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-body font-medium text-foreground text-sm truncate group-hover:text-primary transition-colors">{player.name}</p>
                    <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">{getFullPositionName(player.position)}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">#{player.squadNumber || "??"}</Badge>
                  <Button size="sm" variant="ghost" className="h-6 text-[10px] font-heading px-2">Edit</Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
