import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Download } from "lucide-react";
import { type TeamMember } from "@/data/team-data";

interface MatchDayReportsProps {
  isOfficial: boolean;
  matchReportsByGame: any[];
  matchReportGameId: string | null;
  setMatchReportGameId: (id: string | null) => void;
  exportMatchReport: (id: string) => void;
  members: TeamMember[];
}

export const MatchDayReports = ({
  isOfficial,
  matchReportsByGame,
  matchReportGameId,
  setMatchReportGameId,
  exportMatchReport,
  members,
}: MatchDayReportsProps) => {
  if (!isOfficial || matchReportsByGame.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
      <Card className="bg-card border-border card-glow">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" /> Match Day Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {matchReportsByGame.map((report) => (
            <div key={report.gameId} className="border border-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-body text-sm text-foreground font-medium">vs {report.game!.opponent}</span>
                  <span className="ml-2 font-heading text-primary text-sm">
                    {report.game!.ourScore}-{report.game!.theirScore}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">{report.game!.date}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-body"
                    onClick={() => setMatchReportGameId(matchReportGameId === report.gameId ? null : report.gameId)}
                  >
                    {matchReportGameId === report.gameId ? "Hide" : "View"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-body border-primary/30 text-primary"
                    onClick={() => exportMatchReport(report.gameId)}
                  >
                    <Download className="w-3 h-3 mr-1" /> Export
                  </Button>
                </div>
              </div>
              {matchReportGameId === report.gameId && (
                <div className="overflow-x-auto mt-2">
                  <table className="w-full font-body text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-1">Rank</th>
                        <th className="text-left py-1">Player</th>
                        <th className="text-right py-1">Goals</th>
                        <th className="text-right py-1">Assists</th>
                        <th className="text-right py-1">Tackles</th>
                        <th className="text-right py-1">Saves</th>
                        <th className="text-center py-1">POTM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.performances.map((p: any, i: number) => {
                        const player = members.find((m) => m.id === p.playerId);
                        return (
                          <tr key={p.id} className={`border-b border-border ${p.isPotm ? "bg-primary/10" : ""}`}>
                            <td className="py-1 text-primary font-heading">{i + 1}</td>
                            <td className="py-1 text-foreground">{player?.name || p.playerId}</td>
                            <td className="py-1 text-right">{p.goals || 0}</td>
                            <td className="py-1 text-right">{p.assists || 0}</td>
                            <td className="py-1 text-right">{p.tackles || 0}</td>
                            <td className="py-1 text-right">{p.saves || 0}</td>
                            <td className="py-1 text-center">{p.isPotm ? "⭐" : ""}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
};
