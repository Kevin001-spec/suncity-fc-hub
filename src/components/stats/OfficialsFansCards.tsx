import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { type TeamMember } from "@/data/team-data";

interface OfficialsFansCardsProps {
  officials: any[];
  members: TeamMember[];
  profilePics: Record<string, string>;
  setSelectedMemberCard: (member: TeamMember) => void;
  maskId: (id: string) => string;
}

export const OfficialsFansCards = ({
  officials,
  members,
  profilePics,
  setSelectedMemberCard,
  maskId,
}: OfficialsFansCardsProps) => {
  const fans = members.filter((m) => m.role === "fan");

  return (
    <div className="space-y-8">
      {/* Officials List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <Card className="bg-card border-border card-glow">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Team Officials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {officials.map((o) => {
                const pic = profilePics[o.id];
                const memberData = members.find((m) => m.id === o.id) || o;
                return (
                  <button
                    key={o.id}
                    onClick={() => setSelectedMemberCard(memberData)}
                    className="p-3 rounded-lg border border-border bg-secondary/30 flex items-center gap-3 hover:bg-secondary/50 transition-all text-left cursor-pointer"
                  >
                    <Avatar className="w-10 h-10 border border-primary/20 shrink-0">
                      {pic && <AvatarImage src={pic} className="aspect-square object-cover object-center" />}
                      <AvatarFallback className="bg-secondary text-primary font-heading text-xs">
                        {o.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-body font-medium text-foreground text-sm truncate">
                        {o.name} <span className="text-[10px] text-muted-foreground opacity-70">({maskId(o.id)})</span>
                      </p>
                      <p className="text-xs text-primary font-body capitalize">{o.role}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Fans Section */}
      {fans.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}>
          <Card className="bg-card border-border card-glow">
            <CardHeader>
              <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Team Fans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {fans.map((f) => {
                  const pic = profilePics[f.id];
                  return (
                    <button
                      key={f.id}
                      onClick={() => setSelectedMemberCard(f)}
                      className="p-3 rounded-lg border border-border bg-secondary/30 flex items-center gap-3 hover:bg-secondary/50 transition-all text-left cursor-pointer"
                    >
                      <Avatar className="w-10 h-10 border border-primary/20 shrink-0">
                        {pic && <AvatarImage src={pic} className="aspect-square object-cover object-center" />}
                        <AvatarFallback className="bg-secondary text-primary font-heading text-xs">
                          {f.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-body font-medium text-foreground text-sm truncate">
                          {f.name} <span className="text-[10px] text-muted-foreground opacity-70">({maskId(f.id)})</span>
                        </p>
                        <p className="text-xs text-primary font-body">Fan</p>
                        {f.fanBadge && (
                          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary mt-0.5">
                            {f.fanBadge}
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
