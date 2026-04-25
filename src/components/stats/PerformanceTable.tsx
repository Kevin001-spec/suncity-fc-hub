import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { type TeamMember, getFullPositionName } from "@/data/team-data";

interface PerformanceTableProps {
  performanceMembers: TeamMember[];
  cumulativeStats: Record<string, any>;
  maskId: (id: string) => string;
  setSelectedMemberCard: (member: TeamMember) => void;
}

export const PerformanceTable = ({
  performanceMembers,
  cumulativeStats,
  maskId,
  setSelectedMemberCard,
}: PerformanceTableProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <Card className="bg-card border-border card-glow">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Player Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full font-body text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 px-2">#</th>
                  <th className="text-left py-2">Player</th>
                  <th className="text-left py-2">Pos</th>
                  <th className="text-right py-2 px-2">Goals</th>
                  <th className="text-right py-2 px-2">Assists</th>
                  <th className="text-right py-2 px-2">Games</th>
                </tr>
              </thead>
              <tbody>
                {performanceMembers.map((m) => {
                  const cs = cumulativeStats[m.id] || { goals: 0, assists: 0, gamesPlayed: 0 };
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-border hover:bg-secondary/30 cursor-pointer"
                      onClick={() => setSelectedMemberCard(m)}
                    >
                      <td className="py-2 px-2 text-primary text-xs font-heading">{m.squadNumber || "—"}</td>
                      <td className="py-2 text-foreground font-medium">
                        {m.name}{" "}
                        <span className="text-[10px] text-muted-foreground font-body font-normal opacity-70">
                          ({maskId(m.id)})
                        </span>
                      </td>
                      <td className="py-2 text-muted-foreground text-xs">{getFullPositionName(m.position)}</td>
                      <td className="py-2 px-2 text-right font-heading text-primary">{cs.goals}</td>
                      <td className="py-2 px-2 text-right">{cs.assists}</td>
                      <td className="py-2 px-2 text-right">{cs.gamesPlayed}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
