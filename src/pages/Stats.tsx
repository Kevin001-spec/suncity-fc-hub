import { useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamData } from "@/contexts/TeamDataContext";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, CheckCircle, Clock, DollarSign, Trophy, Calendar } from "lucide-react";
import { contributionMonths } from "@/data/team-data";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from "docx";
import { saveAs } from "file-saver";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const Stats = () => {
  const { user, isOfficial } = useAuth();
  const { members, financialRecords, gameScores, attendance } = useTeamData();

  if (!user) return <Navigate to="/" replace />;

  // Exclude Fabian (coach) and Kevin (manager) from player performance
  const performanceMembers = members.filter((m) => m.id !== "SCF-001" && m.id !== "SCF-003");
  // Exclude Fabian from contribution list
  const contributionMembers = members.filter((m) => m.id !== "SCF-001");

  // Sort contribution members: officials first, then by most paid
  const sortedContributionMembers = useMemo(() => {
    return [...contributionMembers].sort((a, b) => {
      const aOfficial = !a.id.includes("P");
      const bOfficial = !b.id.includes("P");
      if (aOfficial && !bOfficial) return -1;
      if (!aOfficial && bOfficial) return 1;
      const aCount = Object.values(a.contributions).filter((s) => s === "paid").length;
      const bCount = Object.values(b.contributions).filter((s) => s === "paid").length;
      return bCount - aCount;
    });
  }, [contributionMembers]);

  // Attendance ranking
  const attendanceRanking = useMemo(() => {
    const playerMembers = members.filter((m) => m.role === "player" || m.role === "captain");
    return playerMembers.map((m) => {
      const playerAtt = attendance.filter((a) => a.playerId === m.id);
      const activeDays = playerAtt.filter((a) => a.status !== "no_activity");
      const presentDays = playerAtt.filter((a) => a.status === "present" || a.status === "excused").length;
      const pct = activeDays.length > 0 ? Math.round((presentDays / activeDays.length) * 100) : 0;
      return { ...m, attendancePct: pct };
    }).sort((a, b) => b.attendancePct - a.attendancePct);
  }, [members, attendance]);

  const exportContributionsDocx = async () => {
    const rows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Member", bold: true })] })], width: { size: 3000, type: WidthType.DXA } }),
          ...contributionMonths.map((m) => new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: m.label, bold: true })] })],
            width: { size: 1500, type: WidthType.DXA },
          })),
        ],
      }),
      ...sortedContributionMembers.map((m) => new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: m.name })] })] }),
          ...contributionMonths.map((month) => {
            const status = m.contributions[month.key] || "unpaid";
            const icon = status === "paid" ? "✅" : status === "pending" ? "⏳" : "—";
            return new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: icon })] })] });
          }),
        ],
      })),
    ];

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "SUNCITY FC", bold: true, size: 36 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "Monthly Contribution Status Report", size: 24, italics: true })] }),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString()}`, size: 20 })] }),
          new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }),
          new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: "© 2026 Suncity FC — Discipline • Unity • Victory", size: 18, italics: true })] }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "suncity_fc_contributions.docx");
  };

  const exportAttendanceDocx = async () => {
    const playerMembers = members.filter((m) => m.role === "player" || m.role === "captain");
    const rows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Player", bold: true })] })] }),
          ...DAYS.map((d) => new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: d.slice(0, 3), bold: true })] })] })),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "%", bold: true })] })] }),
        ],
      }),
      ...playerMembers.map((m) => {
        const playerAtt = attendance.filter((a) => a.playerId === m.id);
        const activeDays = playerAtt.filter((a) => a.status !== "no_activity");
        const presentDays = playerAtt.filter((a) => a.status === "present" || a.status === "excused").length;
        const pct = activeDays.length > 0 ? Math.round((presentDays / activeDays.length) * 100) : 0;
        return new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: m.name })] })] }),
            ...DAYS.map((day) => {
              const record = playerAtt.find((a) => a.day === day);
              const label = record?.status === "present" ? "✓" : record?.status === "excused" ? "E" : record?.status === "no_activity" ? "—" : "✗";
              return new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: label })] })] });
            }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${pct}%` })] })] }),
          ],
        });
      }),
    ];

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "SUNCITY FC", bold: true, size: 36 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "Weekly Attendance Report", size: 24, italics: true })] }),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString()}`, size: 20 })] }),
          new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }),
          new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: "© 2026 Suncity FC — Discipline • Unity • Victory", size: 18, italics: true })] }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "suncity_fc_attendance.docx");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="font-heading text-2xl gold-text">Team Statistics</h1>
          <p className="text-muted-foreground text-sm font-body mt-1">Performance, contributions, attendance & finance</p>
        </motion.div>

        {/* Player Performance - excludes Fabian & Kevin */}
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
                      <th className="text-left py-2">Role</th>
                      <th className="text-right py-2 px-2">Goals</th>
                      <th className="text-right py-2 px-2">Assists</th>
                      <th className="text-right py-2 px-2">Games</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceMembers.map((m) => (
                      <tr key={m.id} className="border-b border-border hover:bg-secondary/30">
                        <td className="py-2 px-2 text-primary text-xs">{m.squadNumber || "—"}</td>
                        <td className="py-2 text-foreground font-medium">{m.name}</td>
                        <td className="py-2 capitalize text-muted-foreground text-xs">{m.role}</td>
                        <td className="py-2 px-2 text-right font-heading text-primary">{m.goals || 0}</td>
                        <td className="py-2 px-2 text-right">{m.assists || 0}</td>
                        <td className="py-2 px-2 text-right">{m.gamesPlayed || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Game History — all games, permanent */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="bg-card border-border card-glow">
            <CardHeader>
              <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" /> Game History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gameScores.length === 0 ? (
                <p className="text-muted-foreground text-sm font-body">No games recorded yet</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {gameScores.map((game) => (
                    <div key={game.id} className="border border-border rounded-lg p-3 navy-accent">
                      <div className="flex items-center justify-between">
                        <div className="font-body">
                          <p className="text-foreground font-medium">vs {game.opponent}</p>
                          <p className="text-xs text-muted-foreground">{new Date(game.date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-heading text-lg text-primary">{game.ourScore}</span>
                          <span className="text-muted-foreground">-</span>
                          <span className="font-heading text-lg text-muted-foreground">{game.theirScore}</span>
                          <Badge variant="outline" className={`ml-2 text-xs font-body ${
                            game.ourScore > game.theirScore ? "border-green-500/30 text-green-400"
                            : game.ourScore < game.theirScore ? "border-destructive/30 text-destructive"
                            : "border-primary/30 text-primary"
                          }`}>
                            {game.ourScore > game.theirScore ? "W" : game.ourScore < game.theirScore ? "L" : "D"}
                          </Badge>
                        </div>
                      </div>
                      {game.scorers && game.scorers.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1 font-body">
                          ⚽ {game.scorers.map((sid) => members.find((m) => m.id === sid)?.name || sid).join(", ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Attendance Ranking */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <Card className="bg-card border-border card-glow">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> Attendance Ranking
              </CardTitle>
              {isOfficial && (
                <Button size="sm" variant="outline" onClick={exportAttendanceDocx} className="font-body text-xs border-primary/30 text-primary">
                  <Download className="w-3 h-3 mr-1" /> Export .docx
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
                      <th className="text-right py-2 px-2">Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRanking.map((m, i) => (
                      <tr key={m.id} className="border-b border-border">
                        <td className="py-2 text-primary font-heading">{i + 1}</td>
                        <td className="py-2 text-foreground">{m.name}</td>
                        <td className="py-2 px-2 text-right font-heading text-primary">{m.attendancePct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Contribution Grid */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-card border-border card-glow">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" /> Contribution Status
              </CardTitle>
              {isOfficial && (
                <Button size="sm" variant="outline" onClick={exportContributionsDocx} className="font-body text-xs border-primary/30 text-primary">
                  <Download className="w-3 h-3 mr-1" /> Export .docx
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full font-body text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 sticky left-0 bg-card">Member</th>
                      {contributionMonths.map((m) => <th key={m.key} className="text-center py-2 px-3 whitespace-nowrap">{m.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedContributionMembers.map((m) => (
                      <tr key={m.id} className="border-b border-border">
                        <td className="py-2 text-foreground sticky left-0 bg-card font-medium whitespace-nowrap">{m.name}</td>
                        {contributionMonths.map((month) => {
                          const status = m.contributions[month.key] || "unpaid";
                          return (
                            <td key={month.key} className="py-2 text-center">
                              {status === "paid" && <span title="Paid" className="text-green-400">✅</span>}
                              {status === "pending" && <span title="Pending"><Clock className="w-4 h-4 text-primary inline" /></span>}
                              {status === "unpaid" && <span title="Unpaid" className="text-muted-foreground">—</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Financial Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-card border-border card-glow">
            <CardHeader>
              <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" /> Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {financialRecords.map((f) => {
                const totalExpenses = f.expenses.reduce((sum, e) => sum + e.amount, 0);
                return (
                  <div key={f.month} className="border border-border rounded-lg p-4 navy-accent">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-heading text-sm text-primary">{f.month}</h4>
                      <Badge variant="outline" className="font-body text-xs border-primary/30 text-primary">{f.contributors} contributors</Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-body text-sm">
                      <div><p className="text-xs text-muted-foreground">Opening</p><p className="text-foreground">KSh {f.openingBalance.toLocaleString()}</p></div>
                      <div><p className="text-xs text-muted-foreground">Contributions</p><p className="text-green-400">+KSh {f.contributions.toLocaleString()}</p></div>
                      <div><p className="text-xs text-muted-foreground">Expenses</p><p className="text-destructive">-KSh {totalExpenses.toLocaleString()}</p></div>
                      <div><p className="text-xs text-muted-foreground">Closing</p><p className={f.closingBalance >= 0 ? "text-primary font-medium" : "text-destructive font-medium"}>KSh {f.closingBalance.toLocaleString()}</p></div>
                    </div>
                    {f.expenses.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-border">
                        {f.expenses.map((exp, i) => (
                          <div key={i} className="flex justify-between text-xs text-muted-foreground py-0.5">
                            <span>{exp.date} — {exp.description}</span>
                            <span className="text-destructive/70">-KSh {exp.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Stats;
