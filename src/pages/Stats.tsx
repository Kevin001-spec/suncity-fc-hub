import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type TeamMember, getFullPositionName, getPositionGroup } from "@/data/team-data";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamData } from "@/contexts/TeamDataContext";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart3, Download, CheckCircle, Clock, DollarSign, Trophy, Calendar, Image, Star, Award, Users } from "lucide-react";
import { contributionMonths, officials } from "@/data/team-data";
import { generateBrandedDocx, type DocxTableData } from "@/lib/docx-export";
import { getContribMonthsForMember, NEW_PLAYER_IDS } from "@/data/team-data";
import useEmblaCarousel from "embla-carousel-react";
import { supabase } from "@/integrations/supabase/client";
import LottieCarousel from "@/components/LottieCarousel";
import statsAnimation from "@/assets/animations/statsanimation.json";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function calcAttendancePct(playerAtt: { status: string }[]) {
  const activeDays = playerAtt.filter(a => a.status !== "no_activity");
  const presentDays = activeDays.filter(a => a.status === "present").length;
  const excusedDays = activeDays.filter(a => a.status === "excused").length;
  if (activeDays.length === 0) return 0;
  const dayValue = 100 / activeDays.length;
  return Math.round((presentDays * dayValue) + (excusedDays * dayValue * 0.5));
}

const Stats = () => {
  const { user, isOfficial } = useAuth();
  const { members, financialRecords, gameScores, attendance, mediaItems, profilePics, matchPerformances } = useTeamData();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [matchAwards, setMatchAwards] = useState<any[]>([]);

  // Cumulative stats from weekly_stats_log + current members
  const [weeklyLogsAll, setWeeklyLogsAll] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("weekly_stats_log").select("*").then(({ data }) => {
      if (data) setWeeklyLogsAll(data);
    });
  }, []);

  // Build cumulative stats map: player_id -> cumulative totals
  const cumulativeStats = useMemo(() => {
    const map: Record<string, { goals: number; assists: number; gamesPlayed: number; saves: number; cleanSheets: number; aerialDuels: number; successfulTackles: number; interceptions: number; directShots: number }> = {};
    // Sum all weekly_stats_log entries per player
    for (const log of weeklyLogsAll) {
      const pid = log.player_id;
      if (!map[pid]) map[pid] = { goals: 0, assists: 0, gamesPlayed: 0, saves: 0, cleanSheets: 0, aerialDuels: 0, successfulTackles: 0, interceptions: 0, directShots: 0 };
      map[pid].goals += log.goals || 0;
      map[pid].assists += log.assists || 0;
      map[pid].gamesPlayed += log.games_played || 0;
      map[pid].saves += log.saves || 0;
      map[pid].cleanSheets += log.clean_sheets || 0;
      map[pid].aerialDuels += log.aerial_duels || 0;
      map[pid].successfulTackles += log.successful_tackles || 0;
      map[pid].interceptions += log.interceptions || 0;
      map[pid].directShots += log.direct_shots || 0;
    }
    // Add current members values (which may have been reset to 0, or have new data)
    for (const m of members) {
      if (!map[m.id]) map[m.id] = { goals: 0, assists: 0, gamesPlayed: 0, saves: 0, cleanSheets: 0, aerialDuels: 0, successfulTackles: 0, interceptions: 0, directShots: 0 };
      map[m.id].goals += m.goals || 0;
      map[m.id].assists += m.assists || 0;
      map[m.id].gamesPlayed += m.gamesPlayed || 0;
      map[m.id].saves += m.saves || 0;
      map[m.id].cleanSheets += m.cleanSheets || 0;
      map[m.id].aerialDuels += m.aerialDuels || 0;
      map[m.id].successfulTackles += m.successfulTackles || 0;
      map[m.id].interceptions += m.interceptions || 0;
      map[m.id].directShots += m.directShots || 0;
    }
    return map;
  }, [weeklyLogsAll, members]);

  // Overview system state
  const [weeklyOverviews, setWeeklyOverviews] = useState<any[]>([]);
  const [seasonConfig, setSeasonConfig] = useState<any[]>([]);
  const [overviewDialog, setOverviewDialog] = useState<string | null>(null);
  const [selectedArchive, setSelectedArchive] = useState<any | null>(null);
  const [matchReportGameId, setMatchReportGameId] = useState<string | null>(null);
  const [selectedMemberCard, setSelectedMemberCard] = useState<TeamMember | null>(null);

  // Load overviews, season config, and match awards
  useEffect(() => {
    supabase.from("weekly_overviews").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setWeeklyOverviews(data);
    });
    supabase.from("season_config").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setSeasonConfig(data);
    });
    supabase.from("match_awards" as any).select("*").order("created_at", { ascending: false }).then(({ data }: any) => {
      if (data) setMatchAwards(data);
    });
  }, []);

  const performanceMembers = useMemo(() => members.filter((m) => m.id !== "SCF-001" && m.id !== "SCF-003" && m.role !== "fan" && m.id !== "SCF-P40"), [members]);
  const contributionMembers = useMemo(() => members.filter((m) => m.id !== "SCF-001" && m.role !== "fan" && m.id !== "SCF-P40"), [members]);

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

  const attendanceRanking = useMemo(() => {
    const playerMembers = members.filter((m) => (m.role === "player" || m.role === "captain" || m.role === "finance" || m.role === "manager") && m.id !== "SCF-P40");
    return playerMembers.map((m) => {
      const playerAtt = attendance.filter((a) => a.playerId === m.id);
      const pct = calcAttendancePct(playerAtt);
      const presentDays = playerAtt.filter(a => a.status === "present").length;
      const excusedDays = playerAtt.filter(a => a.status === "excused").length;
      return { ...m, attendancePct: pct, presentDays, excusedDays, hasExcuse: excusedDays > 0 };
    }).sort((a, b) => {
      if (b.attendancePct !== a.attendancePct) return b.attendancePct - a.attendancePct;
      if (b.presentDays !== a.presentDays) return b.presentDays - a.presentDays;
      return 0;
    });
  }, [members, attendance]);

  const mediaByDate = useMemo(() => {
    const grouped: Record<string, typeof mediaItems> = {};
    mediaItems.forEach((item) => {
      const dateKey = item.date.split("T")[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(item);
    });
    return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));
  }, [mediaItems]);

  // Overview logic
  const dayOfWeek = new Date().getDay();
  const isWeekendWindow = dayOfWeek >= 5 || dayOfWeek === 0;

  const weeklyData = useMemo(() => {
    const playerMembers = members.filter((m) => (m.role === "player" || m.role === "captain" || m.role === "finance") && m.id !== "SCF-P40");
    const mostDisciplined = playerMembers.filter((m) => {
      const playerAtt = attendance.filter((a) => a.playerId === m.id && a.status !== "no_activity");
      return playerAtt.length > 0 && playerAtt.every((a) => a.status === "present");
    });
    
    // Fair scoring: weighted formula using multiple data points
    const scoredPlayers = playerMembers.map(m => {
      const playerAtt = attendance.filter(a => a.playerId === m.id);
      const attPct = calcAttendancePct(playerAtt);
      const paidContribs = Object.values(m.contributions).filter(s => s === "paid").length;
      const cs = cumulativeStats[m.id] || { goals: 0, assists: 0, gamesPlayed: 0, saves: 0, successfulTackles: 0 };
      const score = (cs.gamesPlayed * 15) + (cs.goals * 30) + (cs.assists * 20) + (cs.successfulTackles * 5) + (cs.saves * 10) + (attPct * 0.5) + (paidContribs * 10);
      return { ...m, score, attPct, paidContribs, cs };
    }).filter(m => m.cs.gamesPlayed > 0 || m.attPct >= 80)
      .sort((a, b) => b.score - a.score);
    
     const AWARD_NAMES = [
        { title: "⭐⭐⭐⭐⭐ Top Week Performer", stars: 5 },
        { title: "⭐⭐⭐⭐ Consistent Performer", stars: 4 },
        { title: "⭐⭐⭐ Midfield Driver", stars: 3 },
        { title: "⭐⭐ Defender of the Week", stars: 2 },
        { title: "⭐ Positive Influence", stars: 1 },
        { title: "📈 Most Weekly Improved", stars: 0 },
      ];
    
    const top6 = scoredPlayers.slice(0, 6).map((m, i) => ({
      ...m,
      awardTitle: AWARD_NAMES[i]?.title || "",
      stars: AWARD_NAMES[i]?.stars || 0,
      reason: m.cs.gamesPlayed > 0
        ? `${m.cs.gamesPlayed} games, ${m.cs.goals} goals, ${m.cs.assists} assists, ${m.attPct}% attendance`
        : `${m.attPct}% attendance, ${m.paidContribs} months paid`,
    }));
    
    const lowContributors = playerMembers.filter((m) => {
      const paidCount = Object.values(m.contributions).filter((s) => s === "paid").length;
      const playerAtt = attendance.filter((a) => a.playerId === m.id);
      const pct = calcAttendancePct(playerAtt);
      return paidCount <= 1 && pct < 60;
    });
    return { mostDisciplined, top6, lowContributors };
  }, [members, attendance, cumulativeStats]);

  // Monthly: available when 3+ weekly archives exist
  const weeklyArchives = weeklyOverviews.filter(o => o.type === "weekly");
  const monthlyArchives = weeklyOverviews.filter(o => o.type === "monthly");
  const seasonArchives = weeklyOverviews.filter(o => o.type === "season");
  const canOpenMonthly = weeklyArchives.length >= 3;

  // Season: available when coach's end date has passed
  const latestSeasonConfig = seasonConfig[0];
  const canOpenSeason = latestSeasonConfig && new Date(latestSeasonConfig.end_date) <= new Date();

  // Match reports grouped by game
  const matchReportsByGame = useMemo(() => {
    const grouped: Record<string, typeof matchPerformances> = {};
    matchPerformances.forEach(p => {
      if (!grouped[p.gameId]) grouped[p.gameId] = [];
      grouped[p.gameId].push(p);
    });
    return Object.entries(grouped)
      .map(([gameId, perfs]) => {
        const game = gameScores.find(g => g.id === gameId);
        return { gameId, game, performances: perfs.sort((a, b) => b.rating - a.rating) };
      })
      .filter(r => r.game)
      .sort((a, b) => new Date(b.game!.date).getTime() - new Date(a.game!.date).getTime());
  }, [matchPerformances, gameScores]);

  const exportContributionsPdf = () => {
    const head = [["Member", ...contributionMonths.map((m) => m.label)]];
    const body = sortedContributionMembers.map((m) => {
      const memberMonths = getContribMonthsForMember(m.id);
      return [
        m.name,
        ...contributionMonths.map((month) => {
          if (!memberMonths.some(mm => mm.key === month.key)) return "—";
          const status = m.contributions[month.key] || "unpaid";
          return status === "paid" ? "✅" : status === "pending" ? "⏳" : "⬜";
        }),
      ];
    });
    generateBrandedDocx("Monthly Contribution Status Report", [{ head, body }], "suncity_fc_contributions.docx");
  };

  const exportAttendancePdf = () => {
    const head = [["Rank", "Player", ...DAYS.map((d) => d.slice(0, 3)), "%"]];
    const body = attendanceRanking.map((m, i) => {
      const playerAtt = attendance.filter((a) => a.playerId === m.id);
      return [
        String(i + 1),
        m.name,
        ...DAYS.map((day) => {
          const record = playerAtt.find((a) => a.day === day);
          return record?.status === "present" ? "✅" : record?.status === "excused" ? "🔵" : record?.status === "no_activity" ? "➖" : "⬜";
        }),
        `${m.attendancePct}%`,
      ];
    });
    const keyTable: DocxTableData = { head: [], body: [["Key: ✅ = Present, ⬜ = Absent, 🔵 = Excused, ➖ = No Activity"]] };
    generateBrandedDocx("Weekly Attendance Report", [{ head, body }, keyTable], "suncity_fc_attendance.docx");
  };

  const exportFinancialPdf = () => {
    const tables: DocxTableData[] = [];
    financialRecords.forEach((f) => {
      const totalExp = f.expenses.reduce((sum, e) => sum + e.amount, 0);
      const head = [[`${f.month} — Financial Details`, ""]];
      const body: string[][] = [
        ["Opening Balance", `KSh ${f.openingBalance.toLocaleString()}`],
        ["Contributors", `${f.contributors} members`],
        ["Total Contributions", `KSh ${f.contributions.toLocaleString()}`],
      ];
      if (f.contributorNote) body.push(["Note", f.contributorNote]);
      f.expenses.forEach(exp => body.push([`Expense: ${exp.description} (${exp.date})`, `-KSh ${exp.amount.toLocaleString()}`]));
      body.push(["Total Expenses", `-KSh ${totalExp.toLocaleString()}`]);
      body.push(["Closing Balance", `KSh ${f.closingBalance.toLocaleString()}`]);
      tables.push({ head, body });
    });
    const cHead = [["Month", "Contributors Who Paid"]];
    const cBody = contributionMonths.map(month => {
      const paid = members.filter(m => m.contributions[month.key] === "paid").map(m => m.name).join(", ");
      return [month.label, paid || "None"];
    });
    tables.push({ head: cHead, body: cBody });
    generateBrandedDocx("Detailed Financial Summary Report", tables, "suncity_fc_financial_detailed.docx");
  };

  const exportWeeklyOverviewPdf = () => {
    const tables: DocxTableData[] = [];
    if (weeklyData.mostDisciplined.length > 0) {
      tables.push({ head: [["Most Disciplined (100% Attendance)"]], body: weeklyData.mostDisciplined.map((m) => [m.name]) });
    }
    if (weeklyData.top6.length > 0) {
      tables.push({ head: [["Top Rated Players", "Achievement", "Reason"]], body: weeklyData.top6.map((m) => [
        m.name, m.awardTitle, m.reason,
      ])});
    }
    if (weeklyData.lowContributors.length > 0) {
      tables.push({ head: [["Low Contribution & Attendance"]], body: weeklyData.lowContributors.map((m) => [m.name]) });
    }
    generateBrandedDocx("Weekly Overview", tables, "suncity_fc_weekly_overview.docx");
  };

  const exportMatchReport = (gameId: string) => {
    const report = matchReportsByGame.find(r => r.gameId === gameId);
    if (!report || !report.game) return;
    const head = [["Player", "Goals", "Assists", "Tackles", "Saves", "POTM"]];
    const body = report.performances.map(p => {
      const player = members.find(m => m.id === p.playerId);
      return [player?.name || p.playerId, String(p.goals), String(p.assists), String(p.tackles), String(p.saves), p.isPotm ? "⭐" : ""];
    });
    generateBrandedDocx(`Match Report — vs ${report.game.opponent} (${report.game.date})`, [{ head, body }], `suncity_fc_match_${report.game.date}.docx`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <LottieAnimation animationData={statsAnimation} className="h-36 mb-2" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="font-heading text-2xl gold-text">Team Statistics</h1>
          <p className="text-muted-foreground text-sm font-body mt-1">Performance, contributions, attendance & finance</p>
        </motion.div>

        {/* ===== 3-ICON OVERVIEW SYSTEM ===== */}
        {isOfficial && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Award className="w-5 h-5 text-primary" /> Overview Reports</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 justify-center">
                  {/* Weekly */}
                  <button onClick={() => isWeekendWindow ? setOverviewDialog("weekly") : null}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${isWeekendWindow ? "border-primary/40 bg-primary/10 cursor-pointer hover:bg-primary/20 player-card-glow" : "border-border bg-muted/30 opacity-60 cursor-not-allowed"}`}>
                    <Calendar className="w-8 h-8 text-primary" />
                    <span className="text-xs font-heading text-primary">WEEKLY</span>
                    <span className="text-[10px] text-muted-foreground font-body">{isWeekendWindow ? "Available now" : "Opens Fri-Sun"}</span>
                  </button>
                  {/* Monthly */}
                  <button onClick={() => canOpenMonthly ? setOverviewDialog("monthly") : null}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${canOpenMonthly ? "border-primary/40 bg-primary/10 cursor-pointer hover:bg-primary/20 player-card-glow" : "border-border bg-muted/30 opacity-60 cursor-not-allowed"}`}>
                    <BarChart3 className="w-8 h-8 text-primary" />
                    <span className="text-xs font-heading text-primary">MONTHLY</span>
                    <span className="text-[10px] text-muted-foreground font-body">{canOpenMonthly ? "Available" : `${weeklyArchives.length}/3 weeks`}</span>
                  </button>
                  {/* Season */}
                  <button onClick={() => canOpenSeason ? setOverviewDialog("season") : null}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${canOpenSeason ? "border-primary/40 bg-primary/10 cursor-pointer hover:bg-primary/20 player-card-glow" : "border-border bg-muted/30 opacity-60 cursor-not-allowed"}`}>
                    <Trophy className="w-8 h-8 text-primary" />
                    <span className="text-xs font-heading text-primary">SEASON</span>
                    <span className="text-[10px] text-muted-foreground font-body">{canOpenSeason ? "Available" : latestSeasonConfig ? `Ends ${latestSeasonConfig.end_date}` : "Not set"}</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Overview Dialog */}
        <Dialog open={!!overviewDialog} onOpenChange={() => setOverviewDialog(null)}>
          <DialogContent className="max-w-2xl bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-heading text-primary">
                {overviewDialog === "weekly" ? "📅 Weekly Overview" : overviewDialog === "monthly" ? "📊 Monthly Overview" : "🏆 Season Overview"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {weeklyData.mostDisciplined.length > 0 && (
                <div>
                  <h4 className="font-heading text-xs text-primary tracking-wider mb-2">MOST DISCIPLINED</h4>
                  <div className="flex flex-wrap gap-2">
                    {weeklyData.mostDisciplined.map((m) => (
                      <Badge key={m.id} variant="outline" className="border-green-500/30 text-green-600 font-body">✅ {m.name}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {weeklyData.top6.length > 0 && (
                <div>
                  <h4 className="font-heading text-xs text-primary tracking-wider mb-2">🏆 TOP RATED PLAYERS</h4>
                  {weeklyData.top6.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 py-2 border-b border-border last:border-0">
                      <div className="flex">{Array.from({ length: m.stars }).map((_, j) => <Star key={j} className="w-3 h-3 text-primary fill-primary" />)}</div>
                      <div className="flex-1">
                        <span className="text-sm font-body text-foreground font-medium">{m.name}</span>
                        <span className="ml-2 text-xs text-primary font-heading">{m.awardTitle.split(" ").slice(1).join(" ")}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-body">{m.reason}</span>
                    </div>
                  ))}
                </div>
              )}
              {weeklyData.lowContributors.length > 0 && (
                <div>
                  <h4 className="font-heading text-xs text-destructive tracking-wider mb-2">LOW CONTRIBUTION & ATTENDANCE</h4>
                  <div className="flex flex-wrap gap-2">
                    {weeklyData.lowContributors.map((m) => (
                      <Badge key={m.id} variant="outline" className="border-destructive/30 text-destructive font-body">⬜ {m.name}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {isOfficial && (
                <Button size="sm" variant="outline" onClick={exportWeeklyOverviewPdf} className="font-body text-xs border-primary/30 text-primary">
                  <Download className="w-3 h-3 mr-1" /> Export
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ===== OVERVIEW ARCHIVE (Gallery-like icons) ===== */}
        {isOfficial && (weeklyArchives.length > 0 || monthlyArchives.length > 0 || seasonArchives.length > 0) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Report Archive</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {weeklyArchives.length > 0 && (
                  <div>
                    <h4 className="font-heading text-xs text-primary tracking-wider mb-2">WEEKLY REPORTS</h4>
                    <div className="flex flex-wrap gap-3">
                      {weeklyArchives.map(a => (
                        <button key={a.id} onClick={() => setSelectedArchive(a)}
                          className="flex flex-col items-center gap-1 p-3 rounded-xl border border-border hover:border-primary/40 bg-secondary/50 hover:bg-secondary transition-all player-card-glow">
                          <Calendar className="w-5 h-5 text-primary" />
                          <span className="text-[10px] font-body text-primary">{a.week_start}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {monthlyArchives.length > 0 && (
                  <div>
                    <h4 className="font-heading text-xs text-primary tracking-wider mb-2">MONTHLY REPORTS</h4>
                    <div className="flex flex-wrap gap-3">
                      {monthlyArchives.map(a => (
                        <button key={a.id} onClick={() => setSelectedArchive(a)}
                          className="flex flex-col items-center gap-1 p-3 rounded-xl border border-border hover:border-primary/40 bg-secondary/50 hover:bg-secondary transition-all player-card-glow">
                          <BarChart3 className="w-5 h-5 text-primary" />
                          <span className="text-[10px] font-body text-primary">{a.week_start}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {seasonArchives.length > 0 && (
                  <div>
                    <h4 className="font-heading text-xs text-primary tracking-wider mb-2">SEASON REPORTS</h4>
                    <div className="flex flex-wrap gap-3">
                      {seasonArchives.map(a => (
                        <button key={a.id} onClick={() => setSelectedArchive(a)}
                          className="flex flex-col items-center gap-1 p-3 rounded-xl border border-border hover:border-primary/40 bg-secondary/50 hover:bg-secondary transition-all player-card-glow">
                          <Trophy className="w-5 h-5 text-primary" />
                          <span className="text-[10px] font-body text-primary">{a.week_start}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Archive Detail Dialog */}
        <Dialog open={!!selectedArchive} onOpenChange={() => setSelectedArchive(null)}>
          <DialogContent className="max-w-lg bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-heading text-primary">
                {selectedArchive?.type === "weekly" ? "📅" : selectedArchive?.type === "monthly" ? "📊" : "🏆"} {selectedArchive?.type?.charAt(0).toUpperCase() + selectedArchive?.type?.slice(1)} Report — {selectedArchive?.week_start}
              </DialogTitle>
            </DialogHeader>
            <pre className="text-xs font-body text-muted-foreground whitespace-pre-wrap bg-secondary/50 p-3 rounded-lg max-h-60 overflow-y-auto">
              {selectedArchive ? JSON.stringify(selectedArchive.data, null, 2) : ""}
            </pre>
          </DialogContent>
        </Dialog>

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
                {officials.map(o => {
                  const pic = profilePics[o.id];
                  const memberData = members.find(m => m.id === o.id) || o;
                  return (
                    <button key={o.id} onClick={() => setSelectedMemberCard(memberData)}
                      className="p-3 rounded-lg border border-border bg-secondary/30 flex items-center gap-3 hover:bg-secondary/50 transition-all text-left cursor-pointer">
                      <Avatar className="w-10 h-10 border border-primary/20 shrink-0">
                        {pic && <AvatarImage src={pic} className="aspect-square object-cover object-center" />}
                        <AvatarFallback className="bg-secondary text-primary font-heading text-xs">{o.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-body font-medium text-foreground text-sm">{o.name}</p>
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
        {members.filter(m => m.role === "fan").length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader>
                <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" /> Team Fans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {members.filter(m => m.role === "fan").map(f => {
                    const pic = profilePics[f.id];
                    return (
                      <button key={f.id} onClick={() => setSelectedMemberCard(f)}
                        className="p-3 rounded-lg border border-border bg-secondary/30 flex items-center gap-3 hover:bg-secondary/50 transition-all text-left cursor-pointer">
                        <Avatar className="w-10 h-10 border border-primary/20 shrink-0">
                          {pic && <AvatarImage src={pic} className="aspect-square object-cover object-center" />}
                          <AvatarFallback className="bg-secondary text-primary font-heading text-xs">{f.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-body font-medium text-foreground text-sm">{f.name}</p>
                          <p className="text-xs text-primary font-body">Fan</p>
                          {f.fanBadge && <Badge variant="outline" className="text-[10px] border-primary/30 text-primary mt-0.5">{f.fanBadge}</Badge>}
                        </div>
                      </button>
                    );
                  })}
                </div>
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
                      <tr key={m.id} className="border-b border-border hover:bg-secondary/30">
                        <td className="py-2 px-2 text-primary text-xs">{m.squadNumber || "—"}</td>
                        <td className="py-2 text-foreground font-medium">{m.name}</td>
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

        {/* ===== MAN OF THE MATCH — Latest Game ===== */}
        {matchReportsByGame.length > 0 && (() => {
          const latestReport = matchReportsByGame[0];
          const potm = latestReport.performances.find(p => p.isPotm);
          if (!potm) return null;
          const potmPlayer = members.find(m => m.id === potm.playerId);
          const potmPic = profilePics[potm.playerId];
          const nonZeroStats = [
            potm.goals > 0 && `${potm.goals} Goals`,
            potm.assists > 0 && `${potm.assists} Assists`,
            potm.saves > 0 && `${potm.saves} Saves`,
            potm.tackles > 0 && `${potm.tackles} Tackles`,
            potm.interceptions > 0 && `${potm.interceptions} Interceptions`,
            potm.cleanSheet && "Clean Sheet",
            potm.aerialDuels > 0 && `${potm.aerialDuels} Aerial Duels`,
          ].filter(Boolean);
          return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}>
              <Card className="bg-card border-primary/30 card-glow overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                <CardHeader className="relative">
                  <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                    <Award className="w-6 h-6 text-primary" /> ⭐ Man of the Match
                  </CardTitle>
                  <p className="text-xs text-muted-foreground font-body">vs {latestReport.game!.opponent} — {latestReport.game!.date}</p>
                </CardHeader>
                <CardContent className="relative">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 border-2 border-primary">
                      {potmPic && <AvatarImage src={potmPic} className="aspect-square object-cover object-center" />}
                      <AvatarFallback className="bg-secondary text-primary font-heading text-xl">{potmPlayer?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-heading text-xl text-foreground">{potmPlayer?.name}</h3>
                      <p className="text-sm text-primary font-body">{getFullPositionName(potmPlayer?.position)}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {nonZeroStats.map((stat, i) => (
                          <Badge key={i} variant="outline" className="border-primary/30 text-primary font-body text-xs">{stat}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })()}

        {/* ===== POST-MATCH AWARDS ===== */}
        {matchAwards.length > 0 && (() => {
          // Get latest game's awards
          const latestGameId = matchReportsByGame[0]?.gameId;
          const latestAwards = latestGameId ? matchAwards.filter((a: any) => a.game_id === latestGameId) : [];
          if (latestAwards.length === 0) return null;
          const latestGame = gameScores.find(g => g.id === latestGameId);
          return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.115 }}>
              <Card className="bg-card border-primary/20 card-glow">
                <CardHeader>
                  <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" /> 🏅 Match Awards
                  </CardTitle>
                  {latestGame && <p className="text-xs text-muted-foreground font-body">vs {latestGame.opponent} — {latestGame.date}</p>}
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {latestAwards.map((award: any) => {
                      const player = members.find(m => m.id === award.player_id);
                      const pic = profilePics[award.player_id];
                      return (
                        <div key={award.id} className={`flex items-center gap-3 p-3 rounded-xl border ${award.award_type === "potm" ? "border-primary/40 bg-primary/10" : "border-border bg-secondary/30"}`}>
                          <Avatar className="w-10 h-10 border border-primary/20 shrink-0">
                            {pic && <AvatarImage src={pic} className="aspect-square object-cover object-center" />}
                            <AvatarFallback className="bg-secondary text-primary font-heading text-xs">{player?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-heading text-sm text-foreground">{award.award_label}</p>
                            <p className="font-body text-xs text-foreground font-medium">{player?.name}</p>
                            <p className="text-[10px] text-muted-foreground font-body truncate">{award.reason}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })()}

        {isOfficial && matchReportsByGame.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Star className="w-5 h-5 text-primary" /> Match Day Reports</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {matchReportsByGame.map(report => (
                  <div key={report.gameId} className="border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-body text-sm text-foreground font-medium">vs {report.game!.opponent}</span>
                        <span className="ml-2 font-heading text-primary text-sm">{report.game!.ourScore}-{report.game!.theirScore}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{report.game!.date}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-xs font-body" onClick={() => setMatchReportGameId(matchReportGameId === report.gameId ? null : report.gameId)}>
                          {matchReportGameId === report.gameId ? "Hide" : "View"}
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs font-body border-primary/30 text-primary" onClick={() => exportMatchReport(report.gameId)}>
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
                            {report.performances.map((p, i) => {
                              const player = members.find(m => m.id === p.playerId);
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
        )}

        {/* Team Gallery — date icons */}
        {mediaByDate.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
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
                      className="flex flex-col items-center gap-1 p-3 rounded-xl border border-border hover:border-primary/40 bg-secondary/50 hover:bg-secondary transition-all player-card-glow">
                      <Calendar className="w-6 h-6 text-primary" />
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

        {/* Contribution Grid — Fixed for new players */}
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
                      {contributionMonths.map((m) => <th key={m.key} className="text-center py-2 px-3 whitespace-nowrap">{m.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedContributionMembers.map((m) => {
                      const memberMonths = getContribMonthsForMember(m.id);
                      return (
                        <tr key={m.id} className="border-b border-border">
                          <td className="py-2 text-foreground sticky left-0 bg-card font-medium whitespace-nowrap">{m.name}</td>
                          {contributionMonths.map((month) => {
                            // If this month doesn't apply to this member (new player), show dash
                            if (!memberMonths.some(mm => mm.key === month.key)) {
                              return <td key={month.key} className="py-2 text-center text-muted-foreground">—</td>;
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

        {/* Financial Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-card border-border card-glow">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" /> Financial Summary
              </CardTitle>
              {isOfficial && (
                <Button size="sm" variant="outline" onClick={exportFinancialPdf} className="font-body text-xs border-primary/30 text-primary">
                  <Download className="w-3 h-3 mr-1" /> Export
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
                    {f.contributorNote && <p className="text-xs text-muted-foreground font-body mb-2 italic">{f.contributorNote}</p>}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-body text-sm">
                      <div><p className="text-xs text-muted-foreground">Opening</p><p className="text-foreground">KSh {f.openingBalance.toLocaleString()}</p></div>
                      <div><p className="text-xs text-muted-foreground">Contributions</p><p className="text-green-600">+KSh {f.contributions.toLocaleString()}</p></div>
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
        {/* Member Card Overlay */}
        <AnimatePresence>
          {selectedMemberCard && (
            <MemberCardOverlay
              member={selectedMemberCard}
              profilePic={profilePics[selectedMemberCard.id]}
              onClose={() => setSelectedMemberCard(null)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

// Member Card Overlay (same style as PlayerCard in Players.tsx)
const MemberCardOverlay = ({ member, profilePic, onClose }: { member: TeamMember; profilePic?: string; onClose: () => void }) => {
  const posGroup = getPositionGroup(member.position);
  const isGK = posGroup === "GK";
  const isDEF = posGroup === "DEF";
  const isFan = member.role === "fan";
  const isPlayerLike = member.role === "player" || member.role === "captain" || member.role === "finance";
  const hasStats = isPlayerLike && (member.goals || member.assists || member.gamesPlayed || member.saves || member.tackles);

  const roleLabel = member.role === "coach" ? "Head Coach" : member.role === "assistant_coach" ? "Assistant Coach"
    : member.role === "finance" ? "Finance Manager" : member.role === "captain" ? "Field Captain"
    : member.role === "manager" ? "Team Manager" : member.role === "fan" ? "Fan" : "Player";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-card border border-border rounded-xl p-6 w-full max-w-sm card-glow" onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <Avatar className="w-20 h-20 mx-auto mb-4 border-2 border-primary">
            {profilePic && <AvatarImage src={profilePic} className="aspect-square object-cover object-center" />}
            <AvatarFallback className="bg-secondary text-primary font-heading text-xl">{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <h3 className="font-heading text-lg text-foreground">{member.name}</h3>
          <p className="text-primary font-body text-sm">{member.id}</p>
          <Badge className="bg-primary text-primary-foreground font-body mt-1">{roleLabel}</Badge>
          {member.position && <p className="text-muted-foreground font-body text-sm mt-1">{getFullPositionName(member.position)}</p>}
          {member.squadNumber && <p className="text-muted-foreground font-body text-sm mt-1">Squad #{member.squadNumber}</p>}

          {/* Fan-specific: badge, points, favourite moment */}
          {isFan && (
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              {member.fanBadge && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
                  <Award className="w-4 h-4 text-primary" />
                  <span className="text-sm font-heading text-primary">{member.fanBadge}</span>
                </div>
              )}
              <div className="flex justify-center gap-6">
                <div><p className="text-xl font-heading text-primary">{member.fanPoints || 0}</p><p className="text-xs text-muted-foreground font-body">Points</p></div>
              </div>
              {member.favouriteMoment && (
                <div className="bg-secondary/50 rounded-lg p-3 mt-2">
                  <p className="text-xs text-muted-foreground font-body mb-1">Favourite Moment</p>
                  <p className="text-sm text-foreground font-body italic">"{member.favouriteMoment}"</p>
                </div>
              )}
            </div>
          )}

          {/* Player/Captain/Finance stats */}
          {hasStats && !isFan && (
            <div className={`grid gap-3 mt-4 pt-4 border-t border-border ${isDEF ? "grid-cols-4" : "grid-cols-3"}`}>
              {isGK ? (
                <>
                  <div><p className="text-xl font-heading text-primary">{member.saves || 0}</p><p className="text-xs text-muted-foreground font-body">Saves</p></div>
                  <div><p className="text-xl font-heading text-primary">{member.cleanSheets || 0}</p><p className="text-xs text-muted-foreground font-body">Clean Sheets</p></div>
                  <div><p className="text-xl font-heading text-primary">{member.aerialDuels || 0}</p><p className="text-xs text-muted-foreground font-body">Aerial Duels</p></div>
                </>
              ) : isDEF ? (
                <>
                  <div><p className="text-xl font-heading text-primary">{member.tackles || 0}</p><p className="text-xs text-muted-foreground font-body">Tackles</p></div>
                  <div><p className="text-xl font-heading text-primary">{member.interceptions || 0}</p><p className="text-xs text-muted-foreground font-body">Int.</p></div>
                  <div><p className="text-xl font-heading text-primary">{member.blocks || 0}</p><p className="text-xs text-muted-foreground font-body">Blocks</p></div>
                  <div><p className="text-xl font-heading text-primary">{member.clearances || 0}</p><p className="text-xs text-muted-foreground font-body">Clear.</p></div>
                </>
              ) : (
                <>
                  <div><p className="text-xl font-heading text-primary">{member.goals || 0}</p><p className="text-xs text-muted-foreground font-body">Goals</p></div>
                  <div><p className="text-xl font-heading text-primary">{member.assists || 0}</p><p className="text-xs text-muted-foreground font-body">Assists</p></div>
                  <div><p className="text-xl font-heading text-primary">{member.gamesPlayed || 0}</p><p className="text-xs text-muted-foreground font-body">Games</p></div>
                </>
              )}
            </div>
          )}

          {/* Non-player officials with no stats */}
          {!hasStats && !isFan && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground font-body">{roleLabel}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Gallery modal
const GalleryModal = ({ date, mediaByDate, onClose }: { date: string | null; mediaByDate: Record<string, any>; onClose: () => void }) => {
  const [emblaRef] = useEmblaCarousel({ loop: true });
  if (!date || !mediaByDate[date]) return null;
  const items = mediaByDate[date] as { id: string; url: string; caption?: string }[];

  return (
    <Dialog open={!!date} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-heading text-primary">
            {new Date(date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-hidden rounded-lg" ref={emblaRef}>
          <div className="flex">
            {items.map((item) => (
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
        <p className="text-xs text-muted-foreground font-body text-center">Swipe to view all {items.length} photos</p>
      </DialogContent>
    </Dialog>
  );
};

export default Stats;
