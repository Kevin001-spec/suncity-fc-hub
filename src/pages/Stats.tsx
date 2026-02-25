import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamData } from "@/contexts/TeamDataContext";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart3, Download, CheckCircle, Clock, DollarSign, Trophy, Calendar, Image, X, Star, Award } from "lucide-react";
import { contributionMonths } from "@/data/team-data";
import { generateBrandedPdf, type TableData } from "@/lib/pdf-export";
import useEmblaCarousel from "embla-carousel-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const Stats = () => {
  const { user, isOfficial } = useAuth();
  const { members, financialRecords, gameScores, attendance, mediaItems } = useTeamData();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  if (!user) return <Navigate to="/" replace />;

  const performanceMembers = members.filter((m) => m.id !== "SCF-001" && m.id !== "SCF-003");
  const contributionMembers = members.filter((m) => m.id !== "SCF-001");

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

  // Attendance ranking — sorted: highest ticks first, then those with excuses, then absent-only at bottom
  const attendanceRanking = useMemo(() => {
    const playerMembers = members.filter((m) => m.role === "player" || m.role === "captain");
    return playerMembers.map((m) => {
      const playerAtt = attendance.filter((a) => a.playerId === m.id);
      const activeDays = playerAtt.filter((a) => a.status !== "no_activity");
      const presentDays = playerAtt.filter((a) => a.status === "present").length;
      const excusedDays = playerAtt.filter((a) => a.status === "excused").length;
      const pct = activeDays.length > 0 ? Math.round(((presentDays + excusedDays) / activeDays.length) * 100) : 0;
      return { ...m, attendancePct: pct, presentDays, excusedDays, hasExcuse: excusedDays > 0 };
    }).sort((a, b) => {
      if (b.presentDays !== a.presentDays) return b.presentDays - a.presentDays;
      if (a.hasExcuse && !b.hasExcuse) return -1;
      if (!a.hasExcuse && b.hasExcuse) return 1;
      return b.attendancePct - a.attendancePct;
    });
  }, [members, attendance]);

  // Media grouped by date for gallery
  const mediaByDate = useMemo(() => {
    const grouped: Record<string, typeof mediaItems> = {};
    mediaItems.forEach((item) => {
      const dateKey = item.date.split("T")[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(item);
    });
    return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));
  }, [mediaItems]);

  // Weekly overview — only visible Friday, Saturday, Sunday
  const dayOfWeek = new Date().getDay();
  const showWeeklyOverview = dayOfWeek >= 5 || dayOfWeek === 0; // 5=Fri, 6=Sat, 0=Sun

  const weeklyOverview = useMemo(() => {
    if (!showWeeklyOverview) return null;
    const playerMembers = members.filter((m) => m.role === "player" || m.role === "captain");

    // Most disciplined: attended every training day
    const mostDisciplined = playerMembers.filter((m) => {
      const playerAtt = attendance.filter((a) => a.playerId === m.id && a.status !== "no_activity");
      return playerAtt.length > 0 && playerAtt.every((a) => a.status === "present");
    });

    // Best player of the week: highest goals+assists
    const sortedByPerf = [...playerMembers].sort((a, b) => ((b.goals || 0) + (b.assists || 0)) - ((a.goals || 0) + (a.assists || 0)));
    const bestPlayer = sortedByPerf[0];

    // Low contributors with low attendance
    const lowContributors = playerMembers.filter((m) => {
      const paidCount = Object.values(m.contributions).filter((s) => s === "paid").length;
      const playerAtt = attendance.filter((a) => a.playerId === m.id);
      const activeDays = playerAtt.filter((a) => a.status !== "no_activity");
      const presentDays = playerAtt.filter((a) => a.status === "present" || a.status === "excused").length;
      const pct = activeDays.length > 0 ? Math.round((presentDays / activeDays.length) * 100) : 0;
      return paidCount <= 1 && pct < 60;
    });

    return { mostDisciplined, bestPlayer, lowContributors };
  }, [showWeeklyOverview, members, attendance]);

  const exportContributionsPdf = () => {
    const head = [["Member", ...contributionMonths.map((m) => m.label)]];
    const body = sortedContributionMembers.map((m) => [
      m.name,
      ...contributionMonths.map((month) => {
        const status = m.contributions[month.key] || "unpaid";
        return status === "paid" ? "✅" : status === "pending" ? "⏳" : "—";
      }),
    ]);
    generateBrandedPdf("Monthly Contribution Status Report", [{ head, body }], "suncity_fc_contributions.pdf");
  };

  const exportAttendancePdf = () => {
    const head = [["Player", ...DAYS.map((d) => d.slice(0, 3)), "%"]];
    const body = attendanceRanking.map((m) => {
      const playerAtt = attendance.filter((a) => a.playerId === m.id);
      return [
        m.name,
        ...DAYS.map((day) => {
          const record = playerAtt.find((a) => a.day === day);
          return record?.status === "present" ? "✅" : record?.status === "excused" ? "E" : record?.status === "no_activity" ? "➖" : "❌";
        }),
        `${m.attendancePct}%`,
      ];
    });
    const keyRow = [["Key: E = Excused, ✅ = Present, ❌ = Absent, ➖ = No Activity", "", "", "", "", "", ""]];
    generateBrandedPdf("Weekly Attendance Report", [{ head, body }, { head: [], body: keyRow }], "suncity_fc_attendance.pdf");
  };

  const exportFinancialPdf = () => {
    const head = [["Month", "Contributors", "Opening", "Contributions", "Expenses", "Closing"]];
    const body = financialRecords.map((f) => {
      const totalExp = f.expenses.reduce((sum, e) => sum + e.amount, 0);
      return [f.month, String(f.contributors), `KSh ${f.openingBalance.toLocaleString()}`, `KSh ${f.contributions.toLocaleString()}`, `KSh ${totalExp.toLocaleString()}`, `KSh ${f.closingBalance.toLocaleString()}`];
    });
    generateBrandedPdf("Financial Summary Report", [{ head, body }], "suncity_fc_financial.pdf");
  };

  const exportWeeklyOverviewPdf = () => {
    if (!weeklyOverview) return;
    const tables: TableData[] = [];
    if (weeklyOverview.mostDisciplined.length > 0) {
      tables.push({ head: [["Most Disciplined (100% Attendance)"]], body: weeklyOverview.mostDisciplined.map((m) => [m.name]) });
    }
    if (weeklyOverview.bestPlayer) {
      tables.push({ head: [["Best Player of the Week"]], body: [[`${weeklyOverview.bestPlayer.name} — Goals: ${weeklyOverview.bestPlayer.goals || 0}, Assists: ${weeklyOverview.bestPlayer.assists || 0}`]] });
    }
    if (weeklyOverview.lowContributors.length > 0) {
      tables.push({ head: [["Low Contribution & Attendance"]], body: weeklyOverview.lowContributors.map((m) => [m.name]) });
    }
    generateBrandedPdf("Weekly Overview", tables, "suncity_fc_weekly_overview.pdf");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="font-heading text-2xl gold-text">Team Statistics</h1>
          <p className="text-muted-foreground text-sm font-body mt-1">Performance, contributions, attendance & finance</p>
        </motion.div>

        {/* Weekly Overview — Friday/Sat/Sun only */}
        {weeklyOverview && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="bg-card border-border card-glow border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" /> Weekly Overview
                </CardTitle>
                {isOfficial && (
                  <Button size="sm" variant="outline" onClick={exportWeeklyOverviewPdf} className="font-body text-xs border-primary/30 text-primary">
                    <Download className="w-3 h-3 mr-1" /> Export PDF
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {weeklyOverview.mostDisciplined.length > 0 && (
                  <div>
                    <h4 className="font-heading text-xs text-primary tracking-wider mb-2">🏆 MOST DISCIPLINED</h4>
                    <div className="flex flex-wrap gap-2">
                      {weeklyOverview.mostDisciplined.map((m) => (
                        <Badge key={m.id} variant="outline" className="border-green-500/30 text-green-400 font-body">{m.name}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {weeklyOverview.bestPlayer && (
                  <div>
                    <h4 className="font-heading text-xs text-primary tracking-wider mb-2">⭐ BEST PLAYER OF THE WEEK</h4>
                    <p className="font-body text-foreground">{weeklyOverview.bestPlayer.name} — <span className="text-primary">{weeklyOverview.bestPlayer.goals || 0} goals, {weeklyOverview.bestPlayer.assists || 0} assists</span></p>
                  </div>
                )}
                {weeklyOverview.lowContributors.length > 0 && (
                  <div>
                    <h4 className="font-heading text-xs text-destructive tracking-wider mb-2">⚠️ LOW CONTRIBUTION & ATTENDANCE</h4>
                    <div className="flex flex-wrap gap-2">
                      {weeklyOverview.lowContributors.map((m) => (
                        <Badge key={m.id} variant="outline" className="border-destructive/30 text-destructive font-body">{m.name}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Player Performance */}
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

        {/* Game History */}
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

        {/* Team Gallery — date icons with modal */}
        {mediaByDate.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader>
                <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                  <Image className="w-5 h-5 text-primary" /> Team Gallery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {mediaByDate.map(([date, items]) => (
                    <button key={date} onClick={() => setSelectedDate(date)}
                      className="flex flex-col items-center gap-1 p-3 rounded-xl border border-border hover:border-primary/40 bg-secondary/50 hover:bg-secondary transition-all card-glow">
                      <span className="text-2xl">📅</span>
                      <span className="text-xs font-body text-primary font-medium">
                        {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <Badge variant="outline" className="text-xs border-primary/30 text-muted-foreground">{items.length} photos</Badge>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Gallery Modal */}
        <GalleryModal date={selectedDate} mediaByDate={Object.fromEntries(mediaByDate)} onClose={() => setSelectedDate(null)} />

        {/* Attendance Ranking */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <Card className="bg-card border-border card-glow">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> Attendance Ranking
              </CardTitle>
              {isOfficial && (
                <Button size="sm" variant="outline" onClick={exportAttendancePdf} className="font-body text-xs border-primary/30 text-primary">
                  <Download className="w-3 h-3 mr-1" /> Export PDF
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
                            return (
                              <td key={day} className="py-2 text-center text-sm">
                                {status === "present" ? "✅" : status === "excused" ? "🔵" : status === "no_activity" ? "➖" : status === "absent" ? "❌" : ""}
                              </td>
                            );
                          })}
                          <td className="py-2 px-2 text-right font-heading text-primary">{m.attendancePct}%</td>
                        </tr>
                      );
                    })}
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
                <Button size="sm" variant="outline" onClick={exportContributionsPdf} className="font-body text-xs border-primary/30 text-primary">
                  <Download className="w-3 h-3 mr-1" /> Export PDF
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" /> Financial Summary
              </CardTitle>
              {isOfficial && (
                <Button size="sm" variant="outline" onClick={exportFinancialPdf} className="font-body text-xs border-primary/30 text-primary">
                  <Download className="w-3 h-3 mr-1" /> Export PDF
                </Button>
              )}
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

// Gallery modal component with embla carousel
const GalleryModal = ({ date, mediaByDate, onClose }: { date: string | null; mediaByDate: Record<string, typeof Stats extends any ? any : never>; onClose: () => void }) => {
  const [emblaRef] = useEmblaCarousel({ loop: true });

  if (!date || !mediaByDate[date]) return null;
  const items = mediaByDate[date] as { id: string; url: string; caption?: string }[];

  return (
    <Dialog open={!!date} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-heading text-primary">
            📅 {new Date(date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-hidden rounded-lg" ref={emblaRef}>
          <div className="flex">
            {items.map((item: any) => (
              <div key={item.id} className="flex-[0_0_100%] min-w-0 px-1">
                <div className="relative">
                  <img src={item.url} alt={item.caption || "Team photo"} className="w-full h-72 sm:h-96 object-cover rounded-lg" />
                  <a href={item.url} download
                    className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90">
                    <Download className="w-5 h-5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground font-body text-center">Swipe or scroll to view all {items.length} photos</p>
      </DialogContent>
    </Dialog>
  );
};

export default Stats;
