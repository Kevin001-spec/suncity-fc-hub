import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamData } from "@/contexts/TeamDataContext";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Trophy, Calendar, Image, DollarSign, Users, CheckCircle, XCircle, Plus,
  TrendingUp, TrendingDown, Upload, Target, Save, Clock, Trash2, Download, UserMinus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { contributionMonths } from "@/data/team-data";
import { generateBrandedPdf } from "@/lib/pdf-export";
import LineupBuilder from "@/components/LineupBuilder";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const OfficialProfile = () => {
  const { user } = useAuth();
  const {
    members, gameScores, calendarEvents, financialRecords, pendingApprovals,
    profilePics, attendance, currentWeekStart, mediaItems, homepageImages,
    addGameScore, addCalendarEvent,
    approveContribution, rejectContribution, addFinancialTransaction,
    updatePlayerStats, uploadProfilePicToStorage, uploadMediaToStorage,
    updateContributionDirect, updateAttendance, markDayNoActivity,
    requestContribution, deleteMediaItem, removePlayer,
    uploadHomepageImages, deleteHomepageImage,
  } = useTeamData();
  const { toast } = useToast();

  const [newOpponent, setNewOpponent] = useState("");
  const [newOurScore, setNewOurScore] = useState("");
  const [newTheirScore, setNewTheirScore] = useState("");
  const [scorers, setScorers] = useState<string[]>([]);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [finType, setFinType] = useState<"in" | "out">("in");
  const [finAmount, setFinAmount] = useState("");
  const [finDesc, setFinDesc] = useState("");
  const [finDate, setFinDate] = useState("");
  const [finMonth, setFinMonth] = useState("Mar 2026");
  const [statsEdits, setStatsEdits] = useState<Record<string, { goals: string; assists: string; games: string }>>({});
  const [removePlayerId, setRemovePlayerId] = useState("");
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const homepageInputRef = useRef<HTMLInputElement>(null);

  if (!user) return <Navigate to="/" replace />;

  const canManageScores = ["coach", "manager", "captain"].includes(user.role);
  const canManageEvents = ["coach", "manager", "captain"].includes(user.role);
  const canUploadMedia = ["coach", "manager", "captain"].includes(user.role);
  const canManageFinance = user.role === "finance" || user.role === "coach";
  const canApproveContributions = user.role === "finance" || user.role === "coach";
  const canManageStats = user.role === "manager" || user.role === "coach";
  const isCoach = user.role === "coach";
  const isFadhir = user.id === "SCF-002";
  const isManager = user.role === "manager";
  const isFabian = user.id === "SCF-001";
  const showContributions = !isFabian;
  const canManageHomepagePhotos = isCoach || isManager;
  const canDeletePhotos = isManager;

  const playerMembers = members.filter((m) => m.role === "player" || m.role === "captain");
  const ourScoreNum = parseInt(newOurScore) || 0;

  const addScore = () => {
    if (!newOpponent || !newOurScore || !newTheirScore) return;
    addGameScore({
      date: new Date().toISOString().split("T")[0],
      opponent: newOpponent, ourScore: parseInt(newOurScore), theirScore: parseInt(newTheirScore),
      scorers: scorers.filter(Boolean),
    });
    toast({ title: "Score Added", description: `vs ${newOpponent} recorded.` });
    setNewOpponent(""); setNewOurScore(""); setNewTheirScore(""); setScorers([]);
  };

  const addEvent = () => {
    if (!newEventTitle || !newEventDate) return;
    addCalendarEvent({ date: newEventDate, title: newEventTitle, description: newEventDesc });
    toast({ title: "Event Added", description: newEventTitle });
    setNewEventTitle(""); setNewEventDate(""); setNewEventDesc("");
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    toast({ title: "Compressing & uploading...", description: `Processing ${files.length} photo(s)...` });
    await uploadMediaToStorage(Array.from(files), user.name);
    toast({ title: "Media Uploaded", description: `${files.length} photo(s) uploaded to gallery.` });
    e.target.value = "";
  };

  const handleHomepageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    if (files.length > 4) { toast({ title: "Max 4 images", variant: "destructive" }); return; }
    toast({ title: "Compressing & uploading...", description: "Processing homepage photos..." });
    await uploadHomepageImages(Array.from(files));
    toast({ title: "Homepage Updated", description: "Photos uploaded to homepage carousel." });
    e.target.value = "";
  };

  const handleRecordTransaction = () => {
    if (!finAmount || !finDesc || !finDate) return;
    addFinancialTransaction(finMonth, finDesc, parseInt(finAmount), finDate, finType);
    toast({ title: "Transaction Recorded", description: `${finType === "in" ? "Income" : "Expense"}: KSh ${finAmount}` });
    setFinAmount(""); setFinDesc(""); setFinDate("");
  };

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast({ title: "Compressing & uploading...", description: "Processing your photo..." });
    const url = await uploadProfilePicToStorage(user.id, file);
    if (url) toast({ title: "Profile Updated", description: "Profile picture saved permanently." });
    e.target.value = "";
  };

  const handleSaveStats = (playerId: string) => {
    const edit = statsEdits[playerId];
    if (!edit) return;
    updatePlayerStats(playerId, parseInt(edit.goals) || 0, parseInt(edit.assists) || 0, parseInt(edit.games) || 0);
    toast({ title: "Stats Updated", description: `Stats saved for ${members.find(m => m.id === playerId)?.name}.` });
  };

  const handlePayRequest = (monthKey: string, monthLabel: string) => {
    requestContribution(user.id, user.name, monthKey, monthLabel);
    toast({ title: "Request Sent", description: `Payment request for ${monthLabel} sent to Finance Officer.` });
  };

  const handleRemovePlayer = async () => {
    if (!removePlayerId) return;
    const playerName = members.find((m) => m.id === removePlayerId)?.name;
    await removePlayer(removePlayerId);
    toast({ title: "Player Removed", description: `${playerName} has been removed from the system.` });
    setRemovePlayerId(""); setShowRemoveConfirm(false);
  };

  const exportFinancialPdf = () => {
    const head = [["Month", "Contributors", "Opening", "Contributions", "Expenses", "Closing"]];
    const body = financialRecords.map((f) => {
      const totalExp = f.expenses.reduce((sum, e) => sum + e.amount, 0);
      return [f.month, String(f.contributors), `KSh ${f.openingBalance.toLocaleString()}`, `KSh ${f.contributions.toLocaleString()}`, `KSh ${totalExp.toLocaleString()}`, `KSh ${f.closingBalance.toLocaleString()}`];
    });
    generateBrandedPdf("Financial Summary Report", [{ head, body }], "suncity_fc_financial.pdf");
  };

  const liveMember = members.find((m) => m.id === user.id) || user;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="relative inline-block">
            <Avatar className="w-24 h-24 border-2 border-primary mx-auto">
              {profilePics[user.id] && <AvatarImage src={profilePics[user.id]} />}
              <AvatarFallback className="bg-secondary text-primary font-heading text-2xl">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <button onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors">
              <Upload className="w-4 h-4" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePicUpload} />
          </div>
          <h2 className="font-heading text-2xl text-foreground mt-4">{user.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Badge className="bg-primary text-primary-foreground font-body capitalize">{user.role}</Badge>
            <Badge variant="outline" className="border-primary/30 text-primary font-body">{user.id}</Badge>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Game Scores */}
          {canManageScores && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-card border-border card-glow">
                <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Trophy className="w-5 h-5 text-primary" /> Update Scores</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Input placeholder="Opponent name" value={newOpponent} onChange={(e) => setNewOpponent(e.target.value)} className="bg-secondary border-border font-body" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Our score" type="number" value={newOurScore} onChange={(e) => { setNewOurScore(e.target.value); setScorers([]); }} className="bg-secondary border-border font-body" />
                    <Input placeholder="Their score" type="number" value={newTheirScore} onChange={(e) => setNewTheirScore(e.target.value)} className="bg-secondary border-border font-body" />
                  </div>
                  {ourScoreNum > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-body">Who scored? ({ourScoreNum} goal{ourScoreNum > 1 ? "s" : ""})</p>
                      {Array.from({ length: ourScoreNum }).map((_, i) => (
                        <select key={i} value={scorers[i] || ""}
                          onChange={(e) => { const ns = [...scorers]; ns[i] = e.target.value; setScorers(ns); }}
                          className="w-full h-9 rounded-md border border-input bg-secondary px-3 text-foreground font-body text-sm">
                          <option value="">Select scorer {i + 1}</option>
                          {playerMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                      ))}
                    </div>
                  )}
                  <Button onClick={addScore} className="w-full font-body"><Plus className="w-4 h-4 mr-1" /> Add Score</Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Calendar Events */}
          {canManageEvents && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="bg-card border-border card-glow">
                <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> Add Event</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Input placeholder="Event title" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} className="bg-secondary border-border font-body" />
                  <Input type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} className="bg-secondary border-border font-body" />
                  <Textarea placeholder="Description" value={newEventDesc} onChange={(e) => setNewEventDesc(e.target.value)} className="bg-secondary border-border font-body" />
                  <Button onClick={addEvent} className="w-full font-body"><Plus className="w-4 h-4 mr-1" /> Add Event</Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Media Upload */}
          {canUploadMedia && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-card border-border card-glow">
                <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Image className="w-5 h-5 text-primary" /> Upload Media</CardTitle></CardHeader>
                <CardContent>
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground font-body">Click to select multiple photos</span>
                    <input ref={mediaInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleMediaUpload} />
                  </label>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Finance Management */}
          {canManageFinance && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card className="bg-card border-border card-glow">
                <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" /> Record Transaction</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant={finType === "in" ? "default" : "outline"} onClick={() => setFinType("in")} className="font-body"><TrendingUp className="w-4 h-4 mr-1" /> Money In</Button>
                    <Button variant={finType === "out" ? "default" : "outline"} onClick={() => setFinType("out")} className="font-body"><TrendingDown className="w-4 h-4 mr-1" /> Money Out</Button>
                  </div>
                  <select value={finMonth} onChange={(e) => setFinMonth(e.target.value)} className="w-full h-10 rounded-md border border-input bg-secondary px-3 text-foreground font-body">
                    {contributionMonths.map((m) => <option key={m.key} value={m.label}>{m.label}</option>)}
                  </select>
                  <Input placeholder="Amount (KSh)" type="number" value={finAmount} onChange={(e) => setFinAmount(e.target.value)} className="bg-secondary border-border font-body" />
                  <Input placeholder="Description" value={finDesc} onChange={(e) => setFinDesc(e.target.value)} className="bg-secondary border-border font-body" />
                  <Input placeholder="Date (e.g. Mar 5)" value={finDate} onChange={(e) => setFinDate(e.target.value)} className="bg-secondary border-border font-body" />
                  <Button onClick={handleRecordTransaction} className="w-full font-body"><Plus className="w-4 h-4 mr-1" /> Record</Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Official's contribution section (except Fabian) */}
        {showContributions && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground">My Monthly Contributions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {contributionMonths.map(({ key, label }) => {
                  const status = liveMember.contributions[key] || "unpaid";
                  return (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="font-body text-foreground">{label}</span>
                      <div className="flex items-center gap-2">
                        {status === "paid" && <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-body"><CheckCircle className="w-3 h-3 mr-1" /> Paid</Badge>}
                        {status === "pending" && <Badge className="bg-primary/20 text-primary border-primary/30 font-body"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>}
                        {status === "unpaid" && (
                          <Button size="sm" variant="outline" onClick={() => handlePayRequest(key, label)} className="font-body text-xs border-primary/30 text-primary hover:bg-primary/10">Mark as Paid</Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Contribution Approvals */}
        {canApproveContributions && pendingApprovals.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Pending Contribution Approvals</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {pendingApprovals.map((req) => (
                  <div key={req.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="font-body">
                      <p className="text-foreground">{req.playerName}</p>
                      <p className="text-xs text-muted-foreground">{req.monthLabel} • {req.playerId}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => { approveContribution(req.id); toast({ title: "Approved", description: `${req.playerName}'s payment for ${req.monthLabel} approved.` }); }}
                        className="font-body text-xs bg-green-600 hover:bg-green-700"><CheckCircle className="w-3 h-3 mr-1" /> Accept</Button>
                      <Button size="sm" variant="outline" onClick={() => { rejectContribution(req.id); toast({ title: "Rejected", description: `${req.playerName}'s payment for ${req.monthLabel} rejected.`, variant: "destructive" }); }}
                        className="font-body text-xs border-destructive/30 text-destructive hover:bg-destructive/10"><XCircle className="w-3 h-3 mr-1" /> Reject</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Fadhir's Contribution Checkbox Grid */}
        {isFadhir && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader>
                <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><CheckCircle className="w-5 h-5 text-primary" /> Contribution Management</CardTitle>
                <p className="text-xs text-muted-foreground font-body">Check/uncheck to directly update player contribution status</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full font-body text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2 sticky left-0 bg-card">Player</th>
                        {contributionMonths.map((m) => <th key={m.key} className="text-center py-2 px-2 whitespace-nowrap">{m.label}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {members.filter((m) => m.id !== "SCF-001").map((m) => (
                        <tr key={m.id} className="border-b border-border">
                          <td className="py-2 text-foreground sticky left-0 bg-card font-medium whitespace-nowrap text-xs">{m.name}</td>
                          {contributionMonths.map((month) => {
                            const status = m.contributions[month.key] || "unpaid";
                            return (
                              <td key={month.key} className="py-2 text-center">
                                <Checkbox checked={status === "paid"}
                                  onCheckedChange={(checked) => updateContributionDirect(m.id, month.key, checked ? "paid" : "unpaid")} />
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
        )}

        {/* Financial Overview with Export */}
        {canManageFinance && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading text-lg text-foreground">📊 Financial Overview</CardTitle>
                <Button size="sm" variant="outline" onClick={exportFinancialPdf} className="font-body text-xs border-primary/30 text-primary">
                  <Download className="w-3 h-3 mr-1" /> Export PDF
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {financialRecords.map((f) => {
                  const totalExpenses = f.expenses.reduce((sum, e) => sum + e.amount, 0);
                  return (
                    <div key={f.month} className="border border-border rounded-lg p-4 navy-accent">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-heading text-sm text-primary tracking-wider">{f.month}</h4>
                        <Badge variant="outline" className="font-body text-xs border-primary/30 text-primary">{f.contributors} contributors</Badge>
                      </div>
                      {f.contributorNote && <p className="text-xs text-muted-foreground font-body mb-3 italic">{f.contributorNote}</p>}
                      <div className="space-y-2 font-body text-sm">
                        <div className="flex justify-between text-muted-foreground"><span>Opening Balance</span><span>KSh {f.openingBalance.toLocaleString()}</span></div>
                        <div className="flex justify-between text-green-400"><span>Contributions</span><span>+KSh {f.contributions.toLocaleString()}</span></div>
                        <div className="flex justify-between text-foreground font-medium border-t border-border pt-2"><span>Total Available</span><span>KSh {(f.openingBalance + f.contributions).toLocaleString()}</span></div>
                        {f.expenses.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-xs text-muted-foreground mb-2 font-heading tracking-wider">EXPENSES</p>
                            {f.expenses.map((exp, i) => (
                              <div key={i} className="flex justify-between text-destructive/80 py-1">
                                <span className="text-sm">{exp.date} — {exp.description}</span>
                                <span>-KSh {exp.amount.toLocaleString()}</span>
                              </div>
                            ))}
                            <div className="flex justify-between font-medium text-destructive pt-2 border-t border-border mt-2">
                              <span>Total Expenses</span><span>-KSh {totalExpenses.toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                        <div className={`flex justify-between font-heading text-sm pt-3 border-t border-border mt-2 ${f.closingBalance >= 0 ? "text-primary" : "text-destructive"}`}>
                          <span>Closing Balance</span><span>KSh {f.closingBalance.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Weekly Attendance */}
        {(isManager || isCoach) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader>
                <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">📋 Weekly Attendance — {currentWeekStart}</CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  {DAYS.map((day) => (
                    <Button key={day} size="sm" variant="outline" onClick={() => { markDayNoActivity(day); toast({ title: "No Activity", description: `${day} marked as no activity.` }); }}
                      className="font-body text-xs">{day.slice(0, 3)} — No Activity</Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full font-body text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2 sticky left-0 bg-card">Player</th>
                        {DAYS.map((d) => <th key={d} className="text-center py-2 px-2">{d.slice(0, 3)}</th>)}
                        <th className="text-center py-2 px-2">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playerMembers.map((m) => {
                        const playerAtt = attendance.filter((a) => a.playerId === m.id);
                        const presentDays = playerAtt.filter((a) => a.status === "present" || a.status === "excused").length;
                        const totalDays = playerAtt.filter((a) => a.status !== "no_activity").length;
                        const isFriday = new Date().getDay() >= 5;
                        const pct = isFriday && totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : null;

                        return (
                          <tr key={m.id} className="border-b border-border">
                            <td className="py-2 text-foreground sticky left-0 bg-card whitespace-nowrap text-xs">{m.name}</td>
                            {DAYS.map((day) => {
                              const record = playerAtt.find((a) => a.day === day);
                              const status = record?.status || "";
                              return (
                                <td key={day} className="py-2 text-center">
                                  <Checkbox checked={status === "present"}
                                    disabled={status === "excused" || status === "no_activity"}
                                    onCheckedChange={(checked) => updateAttendance(m.id, day, checked ? "present" : "absent")} />
                                  {status === "excused" && <span className="text-xs block">🔵</span>}
                                  {status === "no_activity" && <span className="text-xs block">➖</span>}
                                </td>
                              );
                            })}
                            <td className="py-2 text-center font-heading text-primary">{pct !== null ? `${pct}%` : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Manager: Delete Gallery Photos */}
        {canDeletePhotos && mediaItems.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.39 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Trash2 className="w-5 h-5 text-destructive" /> Manage Gallery Photos</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {mediaItems.map((item) => (
                    <div key={item.id} className="relative group">
                      <img src={item.url} alt={item.caption || "Photo"} className="w-full h-24 object-cover rounded-lg border border-border" />
                      <button onClick={() => { deleteMediaItem(item.id, item.url); toast({ title: "Deleted", description: "Photo removed from gallery." }); }}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Homepage Photo Management */}
        {canManageHomepagePhotos && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.39 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Image className="w-5 h-5 text-primary" /> Homepage Photos</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {homepageImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {homepageImages.map((img) => (
                      <div key={img.id} className="relative group">
                        <img src={img.url} alt="Homepage photo" className="w-full h-24 object-cover rounded-lg border border-border" />
                        <button onClick={() => { deleteHomepageImage(img.id, img.url); toast({ title: "Removed", description: "Homepage photo deleted." }); }}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground font-body">Upload up to 4 homepage photos</span>
                  <input ref={homepageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleHomepageUpload} />
                </label>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Coach: Remove Player */}
        {isCoach && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><UserMinus className="w-5 h-5 text-destructive" /> Remove Player</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <select value={removePlayerId} onChange={(e) => setRemovePlayerId(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-secondary px-3 text-foreground font-body">
                  <option value="">Select player to remove</option>
                  {playerMembers.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.id})</option>)}
                </select>
                <Button variant="destructive" onClick={() => setShowRemoveConfirm(true)} disabled={!removePlayerId} className="w-full font-body">
                  <UserMinus className="w-4 h-4 mr-1" /> Remove Player
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Remove Confirmation Dialog */}
        <Dialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="font-heading text-foreground">Confirm Player Removal</DialogTitle></DialogHeader>
            <p className="font-body text-muted-foreground">Are you sure you want to permanently remove <span className="text-foreground font-medium">{members.find((m) => m.id === removePlayerId)?.name}</span> from the system? This cannot be undone.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRemoveConfirm(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleRemovePlayer}>Remove Permanently</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Stats Management */}
        {canManageStats && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Player Stats Editor</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full font-body text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2">Player</th>
                        <th className="text-center py-2">Goals</th>
                        <th className="text-center py-2">Assists</th>
                        <th className="text-center py-2">Games</th>
                        <th className="text-center py-2">Save</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playerMembers.map((m) => {
                        const edit = statsEdits[m.id] || { goals: String(m.goals || 0), assists: String(m.assists || 0), games: String(m.gamesPlayed || 0) };
                        return (
                          <tr key={m.id} className="border-b border-border">
                            <td className="py-2 text-foreground">{m.name}</td>
                            <td className="py-2 text-center"><Input type="number" value={edit.goals} onChange={(e) => setStatsEdits((prev) => ({ ...prev, [m.id]: { ...edit, goals: e.target.value } }))} className="w-16 h-8 text-center bg-secondary border-border font-body mx-auto" /></td>
                            <td className="py-2 text-center"><Input type="number" value={edit.assists} onChange={(e) => setStatsEdits((prev) => ({ ...prev, [m.id]: { ...edit, assists: e.target.value } }))} className="w-16 h-8 text-center bg-secondary border-border font-body mx-auto" /></td>
                            <td className="py-2 text-center"><Input type="number" value={edit.games} onChange={(e) => setStatsEdits((prev) => ({ ...prev, [m.id]: { ...edit, games: e.target.value } }))} className="w-16 h-8 text-center bg-secondary border-border font-body mx-auto" /></td>
                            <td className="py-2 text-center"><Button size="sm" variant="ghost" onClick={() => handleSaveStats(m.id)} className="text-primary"><Save className="w-4 h-4" /></Button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Lineup Builder */}
        {isCoach && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <LineupBuilder />
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default OfficialProfile;
