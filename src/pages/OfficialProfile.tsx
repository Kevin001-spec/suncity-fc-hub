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
import {
  Trophy, Calendar, Image, DollarSign, Users, CheckCircle, XCircle, Plus,
  TrendingUp, TrendingDown, Upload, Target, Footprints, Gamepad2, Save,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { financialRemarks, contributionMonths } from "@/data/team-data";
import LineupBuilder from "@/components/LineupBuilder";

const OfficialProfile = () => {
  const { user } = useAuth();
  const {
    members, gameScores, calendarEvents, financialRecords, pendingApprovals,
    profilePics, addGameScore, addCalendarEvent, addMediaItems,
    approveContribution, rejectContribution, addFinancialTransaction,
    updatePlayerStats, setProfilePic,
  } = useTeamData();
  const { toast } = useToast();

  const [newOpponent, setNewOpponent] = useState("");
  const [newOurScore, setNewOurScore] = useState("");
  const [newTheirScore, setNewTheirScore] = useState("");
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [finType, setFinType] = useState<"in" | "out">("in");
  const [finAmount, setFinAmount] = useState("");
  const [finDesc, setFinDesc] = useState("");
  const [finDate, setFinDate] = useState("");
  const [finMonth, setFinMonth] = useState("Mar 2026");

  // Stats editor state
  const [statsEdits, setStatsEdits] = useState<Record<string, { goals: string; assists: string; games: string }>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  if (!user) return <Navigate to="/" replace />;

  const canManageScores = ["coach", "manager", "captain"].includes(user.role);
  const canManageEvents = ["coach", "manager", "captain"].includes(user.role);
  const canUploadMedia = ["coach", "manager", "captain"].includes(user.role);
  const canManageFinance = user.role === "finance" || user.role === "coach";
  const canApproveContributions = user.role === "finance" || user.role === "coach";
  const canManageStats = user.role === "manager" || user.role === "coach";
  const isCoach = user.role === "coach";

  const addScore = () => {
    if (!newOpponent || !newOurScore || !newTheirScore) return;
    addGameScore({
      date: new Date().toISOString().split("T")[0],
      opponent: newOpponent,
      ourScore: parseInt(newOurScore),
      theirScore: parseInt(newTheirScore),
    });
    toast({ title: "Score Added", description: `vs ${newOpponent} recorded.` });
    setNewOpponent(""); setNewOurScore(""); setNewTheirScore("");
  };

  const addEvent = () => {
    if (!newEventTitle || !newEventDate) return;
    addCalendarEvent({ date: newEventDate, title: newEventTitle, description: newEventDesc });
    toast({ title: "Event Added", description: newEventTitle });
    setNewEventTitle(""); setNewEventDate(""); setNewEventDesc("");
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const items: { url: string; caption: string; date: string; uploadedBy: string }[] = [];
    let processed = 0;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        items.push({
          url: reader.result as string,
          caption: file.name,
          date: new Date().toISOString(),
          uploadedBy: user.name,
        });
        processed++;
        if (processed === files.length) {
          addMediaItems(items);
          toast({ title: "Media Uploaded", description: `${files.length} photo(s) uploaded to gallery.` });
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleRecordTransaction = () => {
    if (!finAmount || !finDesc || !finDate) return;
    addFinancialTransaction(finMonth, finDesc, parseInt(finAmount), finDate, finType);
    toast({ title: "Transaction Recorded", description: `${finType === "in" ? "Income" : "Expense"}: KSh ${finAmount}` });
    setFinAmount(""); setFinDesc(""); setFinDate("");
  };

  const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfilePic(user.id, reader.result as string);
      toast({ title: "Profile Updated", description: "Your profile picture has been updated." });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveStats = (playerId: string) => {
    const edit = statsEdits[playerId];
    if (!edit) return;
    updatePlayerStats(playerId, parseInt(edit.goals) || 0, parseInt(edit.assists) || 0, parseInt(edit.games) || 0);
    toast({ title: "Stats Updated", description: `Stats saved for ${members.find(m => m.id === playerId)?.name}.` });
  };

  const playerMembers = members.filter((m) => m.role === "player" || m.role === "captain");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="relative inline-block">
            <Avatar className="w-24 h-24 border-2 border-primary mx-auto">
              {profilePics[user.id] && <AvatarImage src={profilePics[user.id]} />}
              <AvatarFallback className="bg-secondary text-primary font-heading text-2xl">
                {user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors"
            >
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
                <CardHeader>
                  <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" /> Update Scores
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input placeholder="Opponent name" value={newOpponent} onChange={(e) => setNewOpponent(e.target.value)} className="bg-secondary border-border font-body" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Our score" type="number" value={newOurScore} onChange={(e) => setNewOurScore(e.target.value)} className="bg-secondary border-border font-body" />
                    <Input placeholder="Their score" type="number" value={newTheirScore} onChange={(e) => setNewTheirScore(e.target.value)} className="bg-secondary border-border font-body" />
                  </div>
                  <Button onClick={addScore} className="w-full font-body"><Plus className="w-4 h-4 mr-1" /> Add Score</Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Calendar Events */}
          {canManageEvents && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="bg-card border-border card-glow">
                <CardHeader>
                  <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" /> Add Event
                  </CardTitle>
                </CardHeader>
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
                <CardHeader>
                  <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                    <Image className="w-5 h-5 text-primary" /> Upload Media
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <label
                    className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => mediaInputRef.current?.click()}
                  >
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground font-body">Click to upload photos</span>
                  </label>
                  <input ref={mediaInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleMediaUpload} />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Finance Management */}
          {canManageFinance && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card className="bg-card border-border card-glow">
                <CardHeader>
                  <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" /> Record Transaction
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant={finType === "in" ? "default" : "outline"} onClick={() => setFinType("in")} className="font-body">
                      <TrendingUp className="w-4 h-4 mr-1" /> Money In
                    </Button>
                    <Button variant={finType === "out" ? "default" : "outline"} onClick={() => setFinType("out")} className="font-body">
                      <TrendingDown className="w-4 h-4 mr-1" /> Money Out
                    </Button>
                  </div>
                  <select
                    value={finMonth}
                    onChange={(e) => setFinMonth(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-secondary px-3 text-foreground font-body"
                  >
                    {contributionMonths.map((m) => (
                      <option key={m.key} value={m.label}>{m.label}</option>
                    ))}
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

        {/* Contribution Approvals */}
        {canApproveContributions && pendingApprovals.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader>
                <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" /> Pending Contribution Approvals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingApprovals.map((req) => (
                  <div key={req.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="font-body">
                      <p className="text-foreground">{req.playerName}</p>
                      <p className="text-xs text-muted-foreground">{req.monthLabel} • {req.playerId}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          approveContribution(req.id);
                          toast({ title: "Approved", description: `${req.playerName}'s payment for ${req.monthLabel} approved.` });
                        }}
                        className="font-body text-xs bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          rejectContribution(req.id);
                          toast({ title: "Rejected", description: `${req.playerName}'s payment for ${req.monthLabel} rejected.` });
                        }}
                        className="font-body text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                      >
                        <XCircle className="w-3 h-3 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Detailed Financial Overview */}
        {canManageFinance && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader>
                <CardTitle className="font-heading text-lg text-foreground">📊 Financial Overview — Detailed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {financialRecords.map((f) => {
                  const totalExpenses = f.expenses.reduce((sum, e) => sum + e.amount, 0);
                  return (
                    <div key={f.month} className="border border-border rounded-lg p-4 navy-accent">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-heading text-sm text-primary tracking-wider">{f.month}</h4>
                        <Badge variant="outline" className="font-body text-xs border-primary/30 text-primary">
                          {f.contributors} contributors
                        </Badge>
                      </div>
                      {f.contributorNote && (
                        <p className="text-xs text-muted-foreground font-body mb-3 italic">{f.contributorNote}</p>
                      )}
                      <div className="space-y-2 font-body text-sm">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Opening Balance</span>
                          <span>KSh {f.openingBalance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-green-400">
                          <span>Contributions</span>
                          <span>+KSh {f.contributions.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-foreground font-medium border-t border-border pt-2">
                          <span>Total Available</span>
                          <span>KSh {(f.openingBalance + f.contributions).toLocaleString()}</span>
                        </div>

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
                              <span>Total Expenses</span>
                              <span>-KSh {totalExpenses.toLocaleString()}</span>
                            </div>
                          </div>
                        )}

                        <div className={`flex justify-between font-heading text-sm pt-3 border-t border-border mt-2 ${f.closingBalance >= 0 ? "text-primary" : "text-destructive"}`}>
                          <span>Closing Balance</span>
                          <span>KSh {f.closingBalance.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Summary Remarks */}
                <div className="border-t border-border pt-4">
                  <h4 className="font-heading text-xs text-primary tracking-wider mb-3">SUMMARY & REMARKS</h4>
                  <ul className="space-y-2 font-body text-sm text-secondary-foreground">
                    {financialRemarks.map((remark, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary mt-1 text-xs">•</span>
                        <span>{remark}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats Management (Manager & Coach) */}
        {canManageStats && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader>
                <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" /> Player Stats Editor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full font-body text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2">Player</th>
                        <th className="text-center py-2"><Target className="w-3 h-3 inline" /> Goals</th>
                        <th className="text-center py-2"><Footprints className="w-3 h-3 inline" /> Assists</th>
                        <th className="text-center py-2"><Gamepad2 className="w-3 h-3 inline" /> Games</th>
                        <th className="text-center py-2">Save</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playerMembers.map((m) => {
                        const edit = statsEdits[m.id] || {
                          goals: String(m.goals || 0),
                          assists: String(m.assists || 0),
                          games: String(m.gamesPlayed || 0),
                        };
                        return (
                          <tr key={m.id} className="border-b border-border">
                            <td className="py-2 text-foreground">{m.name}</td>
                            <td className="py-2 text-center">
                              <Input
                                type="number"
                                value={edit.goals}
                                onChange={(e) => setStatsEdits((prev) => ({ ...prev, [m.id]: { ...edit, goals: e.target.value } }))}
                                className="w-16 h-8 text-center bg-secondary border-border font-body mx-auto"
                              />
                            </td>
                            <td className="py-2 text-center">
                              <Input
                                type="number"
                                value={edit.assists}
                                onChange={(e) => setStatsEdits((prev) => ({ ...prev, [m.id]: { ...edit, assists: e.target.value } }))}
                                className="w-16 h-8 text-center bg-secondary border-border font-body mx-auto"
                              />
                            </td>
                            <td className="py-2 text-center">
                              <Input
                                type="number"
                                value={edit.games}
                                onChange={(e) => setStatsEdits((prev) => ({ ...prev, [m.id]: { ...edit, games: e.target.value } }))}
                                className="w-16 h-8 text-center bg-secondary border-border font-body mx-auto"
                              />
                            </td>
                            <td className="py-2 text-center">
                              <Button size="sm" variant="ghost" onClick={() => handleSaveStats(m.id)} className="text-primary">
                                <Save className="w-4 h-4" />
                              </Button>
                            </td>
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

        {/* 3D Lineup Builder (Coach only) */}
        {isCoach && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <LineupBuilder />
          </motion.div>
        )}

        {/* All Members */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-card border-border card-glow">
            <CardHeader>
              <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> All Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full font-body text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2">Name</th>
                      <th className="text-left py-2">ID</th>
                      <th className="text-left py-2">Role</th>
                      <th className="text-right py-2">Goals</th>
                      <th className="text-right py-2">Assists</th>
                      <th className="text-right py-2">Games</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id} className="border-b border-border hover:bg-secondary/30">
                        <td className="py-2 text-foreground">{m.name}</td>
                        <td className="py-2 text-primary text-xs">{m.id}</td>
                        <td className="py-2 capitalize text-muted-foreground">{m.role}</td>
                        <td className="py-2 text-right">{m.goals || 0}</td>
                        <td className="py-2 text-right">{m.assists || 0}</td>
                        <td className="py-2 text-right">{m.gamesPlayed || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default OfficialProfile;
