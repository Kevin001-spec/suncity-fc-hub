import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Download } from "lucide-react";

interface AttendanceRankingProps {
  attendanceRanking: any[];
  attendance: any[];
  isOfficial: boolean;
  exportAttendancePdf: () => void;
  DAYS: string[];
}

export const AttendanceRanking = ({
  attendanceRanking,
  attendance,
  isOfficial,
  exportAttendancePdf,
  DAYS,
}: AttendanceRankingProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
      <Card className="bg-card border-border card-glow">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Attendance Ranking
          </CardTitle>
          {isOfficial && (
            <Button size="sm" variant="outline" onClick={exportAttendancePdf} className="font-body text-xs border-primary/30 text-primary">
              <Download className="w-3 h-3 mr-1" /> Export
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full font-body text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2">Rank</th>
                  <th className="text-left py-2">Player</th>
                  {DAYS.map((d) => <th key={d} className="text-center py-2 px-1">{d.slice(0, 3)}</th>)}
                  <th className="text-right py-2 px-2">%</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRanking.map((m, i) => {
                  const playerAtt = attendance.filter((a) => a.playerId === m.id);
                  return (
                    <tr key={m.id} className="border-b border-border">
                      <td className="py-2 text-primary font-heading">{i + 1}</td>
                      <td className="py-2 text-foreground">{m.name}</td>
                      {DAYS.map((day) => {
                        const record = playerAtt.find((a) => a.day === day);
                        const status = record?.status;
                        const display = status === "present" ? "✅" : status === "excused" ? "🔵" : status === "no_activity" ? "➖" : status === "absent" ? "⬜" : "";
                        return <td key={day} className="py-2 text-center text-sm">{display}</td>;
                      })}
                      <td className="py-2 px-2 text-right font-heading text-primary">{m.attendancePct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground font-body mt-2">Key: ✅ = Present, 🔵 = Excused, ⬜ = Absent, ➖ = No Activity</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};
