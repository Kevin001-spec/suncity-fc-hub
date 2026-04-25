import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download } from "lucide-react";
import { type TeamMember, getContribMonthsForMember } from "@/data/team-data";

interface ContributionGridProps {
  sortedContributionMembers: TeamMember[];
  contributionMonths: any[];
  isOfficial: boolean;
  exportContributionsPdf: () => void;
}

export const ContributionGrid = ({
  sortedContributionMembers,
  contributionMonths,
  isOfficial,
  exportContributionsPdf,
}: ContributionGridProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <Card className="bg-card border-border card-glow">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" /> Contribution Status
          </CardTitle>
          {isOfficial && (
            <Button size="sm" variant="outline" onClick={exportContributionsPdf} className="font-body text-xs border-primary/30 text-primary">
              <Download className="w-3 h-3 mr-1" /> Export
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full font-body text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 sticky left-0 bg-card">Member</th>
                  {contributionMonths.map((m) => (
                    <th key={m.key} className="text-center py-2 px-3 whitespace-nowrap">
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedContributionMembers.map((m) => {
                  const memberMonths = getContribMonthsForMember(m.id);
                  return (
                    <tr key={m.id} className="border-b border-border">
                      <td className="py-2 text-foreground sticky left-0 bg-card font-medium whitespace-nowrap">{m.name}</td>
                      {contributionMonths.map((month) => {
                        if (!memberMonths.some((mm) => mm.key === month.key)) {
                          return (
                            <td key={month.key} className="py-2 text-center text-muted-foreground">
                              —
                            </td>
                          );
                        }
                        const status = m.contributions[month.key] || "unpaid";
                        return (
                          <td key={month.key} className="py-2 text-center">
                            {status === "paid" && <span title="Paid">✅</span>}
                            {status === "pending" && <span title="Pending">⏳</span>}
                            {status === "unpaid" && <span title="Unpaid">⬜</span>}
                          </td>
                        );
                      })}
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
