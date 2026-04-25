import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { type TeamMember } from "@/data/team-data";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamData } from "@/contexts/TeamDataContext";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download } from "lucide-react";
import { contributionMonths } from "@/data/team-data";
import { generateBrandedDocx, type DocxTableData } from "@/lib/docx-export";
import { getContribMonthsForMember } from "@/data/team-data";
import { supabase } from "@/integrations/supabase/client";
import LottieCarousel from "@/components/LottieCarousel";
import statsAnimation from "@/assets/animations/statsanimation.json";
import statsnplayerspagec1 from "@/assets/animations/statsnplayerspagec1.json";
import statsnplayerspagec2 from "@/assets/animations/statsnplayerspagec2.json";

// Modular Components
import { StatsOverviewCards } from "@/components/stats/StatsOverviewCards";
import { PerformanceTable } from "@/components/stats/PerformanceTable";
import { AttendanceRanking } from "@/components/stats/AttendanceRanking";
import { ContributionGrid } from "@/components/stats/ContributionGrid";
import { FinancialSummary } from "@/components/stats/FinancialSummary";
import { MatchDayReports } from "@/components/stats/MatchDayReports";
import { ReportArchive } from "@/components/stats/ReportArchive";
import { OfficialsFansCards } from "@/components/stats/OfficialsFansCards";
import { GalleryModal } from "@/components/stats/GalleryModal";
import { MemberCardOverlay } from "@/components/stats/MemberCardOverlay";
import { LatestAwardsCard } from "@/components/stats/LatestAwardsCard";

const statsCarousel = [statsAnimation, statsnplayerspagec1, statsnplayerspagec2];
const maskId = (id: string) => id.includes("SCF-") ? "SCF-***" : id;
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
  const { isOfficial } = useAuth();
  const { members, financialRecords, gameScores, attendance, mediaItems, profilePics, matchPerformances } = useTeamData();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [matchAwards, setMatchAwards] = useState<any[]>([]);
  const [weeklyLogsAll, setWeeklyLogsAll] = useState<any[]>([]);
  const [weeklyOverviews, setWeeklyOverviews] = useState<any[]>([]);
  const [seasonConfig, setSeasonConfig] = useState<any[]>([]);
  const [overviewDialog, setOverviewDialog] = useState<string | null>(null);
  const [selectedArchive, setSelectedArchive] = useState<any | null>(null);
  const [matchReportGameId, setMatchReportGameId] = useState<string | null>(null);
  const [selectedMemberCard, setSelectedMemberCard] = useState<TeamMember | null>(null);

  useEffect(() => {
    supabase.from("weekly_stats_log").select("*").then(({ data }) => { if (data) setWeeklyLogsAll(data); });
    supabase.from("weekly_overviews").select("*").order("created_at", { ascending: false }).then(({ data }) => { if (data) setWeeklyOverviews(data); });
    supabase.from("season_config").select("*").order("created_at", { ascending: false }).then(({ data }) => { if (data) setSeasonConfig(data); });
    supabase.from("match_awards" as any).select("*").order("created_at", { ascending: false }).then(({ data }: any) => { if (data) setMatchAwards(data); });
  }, []);

  const cumulativeStats = useMemo(() => {
    const map: Record<string, any> = {};
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
    for (const m of members) {
      if (!map[m.id]) map[m.id] = { goals: 0, assists: 0, gamesPlayed: 0, saves: 0, cleanSheets: 0, aerialDuels: 0, successfulTackles: 0, interceptions: 0, directShots: 0 };
      map[m.id].goals += m.goals || 0;
      map[m.id].assists += m.assists || 0;
      map[m.id].gamesPlayed += m.gamesPlayed || 0;
      map[m.id].saves += m.saves || 0;
      map[m.id].cleanSheets += m.cleanSheets || 0;
      map[m.id].aerialDuels += m.aerialDuels || 0;
      map[m.id].successfulTackles += m.tackles || 0;
      map[m.id].interceptions += m.interceptions || 0;
    }
    return map;
  }, [weeklyLogsAll, members]);

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
      return { ...m, attendancePct: pct };
    }).sort((a, b) => b.attendancePct - a.attendancePct);
  }, [members, attendance]);

  const mediaByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    mediaItems.forEach((item) => {
      const dateKey = item.date.split("T")[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(item);
    });
    return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));
  }, [mediaItems]);

  const weeklyData = useMemo(() => {
    const playerMembers = members.filter((m) => (m.role === "player" || m.role === "captain" || m.role === "finance") && m.id !== "SCF-P40");
    const mostDisciplined = playerMembers.filter((m) => {
      const playerAtt = attendance.filter((a) => a.playerId === m.id && a.status !== "no_activity");
      return playerAtt.length > 0 && playerAtt.every((a) => a.status === "present");
    });
    const scoredPlayers = playerMembers.map(m => {
      const playerAtt = attendance.filter(a => a.playerId === m.id);
      const attPct = calcAttendancePct(playerAtt);
      const paidContribs = Object.values(m.contributions).filter(s => s === "paid").length;
      const cs = cumulativeStats[m.id] || { goals: 0, assists: 0, gamesPlayed: 0, saves: 0, successfulTackles: 0 };
      const score = (cs.gamesPlayed * 15) + (cs.goals * 30) + (cs.assists * 20) + (cs.successfulTackles * 5) + (cs.saves * 10) + (attPct * 0.5) + (paidContribs * 10);
      return { ...m, score, attPct, paidContribs, cs };
    }).filter(m => m.cs.gamesPlayed > 0 || m.attPct >= 80).sort((a, b) => b.score - a.score);
    
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
      reason: m.cs.gamesPlayed > 0 ? `${m.cs.gamesPlayed} games, ${m.cs.goals} goals, ${m.cs.assists} assists, ${m.attPct}% attendance` : `${m.attPct}% attendance, ${m.paidContribs} months paid`,
    }));
    
    const lowContributors = playerMembers.filter((m) => {
      const paidCount = Object.values(m.contributions).filter((s) => s === "paid").length;
      const pct = calcAttendancePct(attendance.filter((a) => a.playerId === m.id));
      return paidCount <= 1 && pct < 60;
    });
    return { mostDisciplined, top6, lowContributors };
  }, [members, attendance, cumulativeStats]);

  const matchReportsByGame = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    matchPerformances.forEach(p => { if (!grouped[p.gameId]) grouped[p.gameId] = []; grouped[p.gameId].push(p); });
    return Object.entries(grouped).map(([gameId, perfs]) => {
      const game = gameScores.find(g => g.id === gameId);
      return { gameId, game, performances: perfs.sort((a, b) => b.rating - a.rating) };
    }).filter(r => r.game).sort((a, b) => new Date(b.game!.date).getTime() - new Date(a.game!.date).getTime());
  }, [matchPerformances, gameScores]);

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

  const exportWeeklyOverviewPdf = () => {
    const tables: DocxTableData[] = [];
    if (weeklyData.mostDisciplined.length > 0) tables.push({ head: [["Most Disciplined (100% Attendance)"]], body: weeklyData.mostDisciplined.map((m) => [m.name]) });
    if (weeklyData.top6.length > 0) tables.push({ head: [["Top Rated Players", "Achievement", "Reason"]], body: weeklyData.top6.map((m) => [m.name, m.awardTitle, m.reason]) });
    if (weeklyData.lowContributors.length > 0) tables.push({ head: [["Low Contribution & Attendance"]], body: weeklyData.lowContributors.map((m) => [m.name]) });
    generateBrandedDocx("Weekly Overview", tables, "suncity_fc_weekly_overview.docx");
  };

  const exportFinancialPdf = () => {
    const tables: DocxTableData[] = [];
    financialRecords.forEach((f) => {
      const totalExp = f.expenses.reduce((sum, e) => sum + e.amount, 0);
      const head = [[`${f.month} — Financial Details`, ""]];
      const body: string[][] = [["Opening Balance", `KSh ${f.openingBalance.toLocaleString()}`], ["Contributors", `${f.contributors} members`], ["Total Contributions", `KSh ${f.contributions.toLocaleString()}`]];
      f.expenses.forEach(exp => body.push([`Expense: ${exp.description} (${exp.date})`, `-KSh ${exp.amount.toLocaleString()}`]));
      body.push(["Total Expenses", `-KSh ${totalExp.toLocaleString()}`], ["Closing Balance", `KSh ${f.closingBalance.toLocaleString()}`]);
      tables.push({ head, body });
    });
    const cHead = [["Month", "Contributors Who Paid"]];
    const cBody = contributionMonths.map(month => [month.label, members.filter(m => m.contributions[month.key] === "paid").map(m => m.name).join(", ") || "None"]);
    tables.push({ head: cHead, body: cBody });
    generateBrandedDocx("Detailed Financial Summary Report", tables, "suncity_fc_financial_detailed.docx");
  };

  const exportAttendancePdf = () => {
    const head = [["Rank", "Player", ...DAYS.map((d) => d.slice(0, 3)), "%"]];
    const body = attendanceRanking.map((m, i) => {
      const playerAtt = attendance.filter((a) => a.playerId === m.id);
      return [String(i + 1), m.name, ...DAYS.map((day) => {
        const record = playerAtt.find((a) => a.day === day);
        return record?.status === "present" ? "✅" : record?.status === "excused" ? "🔵" : record?.status === "no_activity" ? "➖" : "⬜";
      }), `${m.attendancePct}%`];
    });
    generateBrandedDocx("Weekly Attendance Report", [{ head, body }, { head: [], body: [["Key: ✅ = Present, ⬜ = Absent, 🔵 = Excused, ➖ = No Activity"]] }], "suncity_fc_attendance.docx");
  };

  const exportContributionsPdf = () => {
    const head = [["Member", ...contributionMonths.map((m) => m.label)]];
    const body = sortedContributionMembers.map((m) => {
      const memberMonths = getContribMonthsForMember(m.id);
      return [m.name, ...contributionMonths.map((month) => {
        if (!memberMonths.some(mm => mm.key === month.key)) return "—";
        const status = m.contributions[month.key] || "unpaid";
        return status === "paid" ? "✅" : status === "pending" ? "⏳" : "⬜";
      })];
    });
    generateBrandedDocx("Monthly Contribution Status Report", [{ head, body }], "suncity_fc_contributions.docx");
  };

  return (
    <Layout>
      <Helmet>
        <title>SunCity FC Statistics | Performance & Finance</title>
        <meta name="description" content="SunCity FC team statistics — player performance, contributions, attendance and finance." />
      </Helmet>
      <div className="max-w-6xl mx-auto space-y-8">
        <LottieCarousel animations={statsCarousel} className="h-44 mb-2" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="font-heading text-2xl gold-text">Team Statistics</h1>
          <p className="text-muted-foreground text-sm font-body mt-1">Performance, contributions, attendance & finance</p>
        </motion.div>

        {isOfficial && (
          <StatsOverviewCards
            weeklyArchivesCount={weeklyOverviews.filter(o => o.type === "weekly").length}
            seasonConfig={seasonConfig[0]}
            setOverviewDialog={setOverviewDialog}
          />
        )}

        <AnimatePresence>
          {overviewDialog && (
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
                      <div className="flex flex-wrap gap-2">{weeklyData.mostDisciplined.map((m) => <div key={m.id} className="text-green-600 border border-green-500/30 px-2 py-1 rounded-md text-xs font-body">✅ {m.name}</div>)}</div>
                    </div>
                  )}
                  {weeklyData.top6.length > 0 && (
                    <div>
                      <h4 className="font-heading text-xs text-primary tracking-wider mb-2">🏆 TOP RATED PLAYERS</h4>
                      {weeklyData.top6.map((m) => (
                        <div key={m.id} className="flex items-center gap-2 py-2 border-b border-border last:border-0">
                          <div className="flex-1 min-w-0">
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
                      <div className="flex flex-wrap gap-2">{weeklyData.lowContributors.map((m) => <div key={m.id} className="text-destructive border border-destructive/30 px-2 py-1 rounded-md text-xs font-body">⬜ {m.name}</div>)}</div>
                    </div>
                  )}
                  <Button size="sm" variant="outline" onClick={exportWeeklyOverviewPdf} className="font-body text-xs border-primary/30 text-primary"><Download className="w-3 h-3 mr-1" /> Export</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>

        <ReportArchive
          isOfficial={isOfficial}
          weeklyArchives={weeklyOverviews.filter(o => o.type === "weekly")}
          monthlyArchives={weeklyOverviews.filter(o => o.type === "monthly")}
          seasonArchives={weeklyOverviews.filter(o => o.type === "season")}
          onSelectArchive={setSelectedArchive}
        />

        <Dialog open={!!selectedArchive} onOpenChange={() => setSelectedArchive(null)}>
          <DialogContent className="max-w-lg bg-card border-border">
            <DialogHeader><DialogTitle className="font-heading text-primary">{selectedArchive?.type?.toUpperCase()} Report — {selectedArchive?.week_start}</DialogTitle></DialogHeader>
            <pre className="text-xs font-body text-muted-foreground whitespace-pre-wrap bg-secondary/50 p-3 rounded-lg max-h-60 overflow-y-auto">{selectedArchive ? JSON.stringify(selectedArchive.data, null, 2) : ""}</pre>
          </DialogContent>
        </Dialog>

        <OfficialsFansCards
          officials={members.filter(m => ["coach", "assistant_coach", "manager", "finance"].includes(m.role))}
          members={members}
          profilePics={profilePics}
          setSelectedMemberCard={setSelectedMemberCard}
          maskId={maskId}
        />

        <PerformanceTable
          performanceMembers={performanceMembers}
          cumulativeStats={cumulativeStats}
          maskId={maskId}
          setSelectedMemberCard={setSelectedMemberCard}
        />

        <LatestAwardsCard
          matchReportsByGame={matchReportsByGame}
          matchAwards={matchAwards}
          members={members}
          profilePics={profilePics}
        />

        <MatchDayReports
          isOfficial={isOfficial}
          matchReportsByGame={matchReportsByGame}
          matchReportGameId={matchReportGameId}
          setMatchReportGameId={setMatchReportGameId}
          exportMatchReport={exportMatchReport}
          members={members}
        />

        <AttendanceRanking
          attendanceRanking={attendanceRanking}
          attendance={attendance}
          isOfficial={isOfficial}
          exportAttendancePdf={exportAttendancePdf}
          DAYS={DAYS}
        />

        <ContributionGrid
          sortedContributionMembers={sortedContributionMembers}
          contributionMonths={contributionMonths}
          isOfficial={isOfficial}
          exportContributionsPdf={exportContributionsPdf}
        />

        <FinancialSummary
          financialRecords={financialRecords}
          isOfficial={isOfficial}
          exportFinancialPdf={exportFinancialPdf}
        />

        <AnimatePresence>
          {selectedMemberCard && (
            <MemberCardOverlay
              member={selectedMemberCard}
              profilePic={profilePics[selectedMemberCard.id]}
              onClose={() => setSelectedMemberCard(null)}
            />
          )}
        </AnimatePresence>

        <GalleryModal date={selectedDate} mediaByDate={Object.fromEntries(mediaByDate)} onClose={() => setSelectedDate(null)} />
      </div>
    </Layout>
  );
};

export default Stats;
