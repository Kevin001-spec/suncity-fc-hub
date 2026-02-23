import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Trophy, Calendar, Image, DollarSign, Users, CheckCircle, XCircle, Plus,
  TrendingUp, TrendingDown, Upload,
} from "lucide-react";
import {
  initialGameScores, initialCalendarEvents, initialFinancialRecords,
  allMembers, players, type GameScore, type CalendarEvent, type FinancialRecord,
} from "@/data/team-data";

const OfficialProfile = () => {
  const { user } = useAuth();
  const [gameScores, setGameScores] = useState<GameScore[]>(initialGameScores);
  const [events, setEvents] = useState<CalendarEvent[]>(initialCalendarEvents);
  const [finances] = useState<FinancialRecord[]>(initialFinancialRecords);

  // New game score form
  const [newOpponent, setNewOpponent] = useState("");
  const [newOurScore, setNewOurScore] = useState("");
  const [newTheirScore, setNewTheirScore] = useState("");

  // New event form
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");

  // Finance form (Fadhir only)
  const [finType, setFinType] = useState<"in" | "out">("in");
  const [finAmount, setFinAmount] = useState("");
  const [finDesc, setFinDesc] = useState("");

  // Pending approvals
  const [pendingApprovals] = useState([
    { player: "Blaise", month: "Feb 2026", id: "SCF-P01" },
    { player: "Olise", month: "Feb 2026", id: "SCF-P10" },
  ]);

  if (!user) return <Navigate to="/" replace />;

  const canManageScores = ["coach", "manager", "captain"].includes(user.role);
  const canManageEvents = ["coach", "manager", "captain"].includes(user.role);
  const canUploadMedia = ["coach", "manager", "captain"].includes(user.role);
  const canManageFinance = user.role === "finance" || user.role === "coach";
  const canApproveContributions = user.role === "finance" || user.role === "coach";

  const addGameScore = () => {
    if (!newOpponent || !newOurScore || !newTheirScore) return;
    const newGame: GameScore = {
      id: `g${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      opponent: newOpponent,
      ourScore: parseInt(newOurScore),
      theirScore: parseInt(newTheirScore),
    };
    setGameScores([newGame, ...gameScores]);
    setNewOpponent(""); setNewOurScore(""); setNewTheirScore("");
  };

  const addEvent = () => {
    if (!newEventTitle || !newEventDate) return;
    const newEvent: CalendarEvent = {
      id: `e${Date.now()}`,
      date: newEventDate,
      title: newEventTitle,
      description: newEventDesc,
    };
    setEvents([...events, newEvent]);
    setNewEventTitle(""); setNewEventDate(""); setNewEventDesc("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <Avatar className="w-24 h-24 border-2 border-primary mx-auto">
            <AvatarFallback className="bg-secondary text-primary font-heading text-2xl">
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="font-heading text-2xl text-foreground mt-4">{user.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Badge className="bg-primary text-primary-foreground font-body capitalize">{user.role}</Badge>
            <Badge variant="outline" className="border-primary/30 text-primary font-body">{user.id}</Badge>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Game Scores Management */}
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
                  <Button onClick={addGameScore} className="w-full font-body"><Plus className="w-4 h-4 mr-1" /> Add Score</Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Calendar Events Management */}
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
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground font-body">Click to upload photos</span>
                    <input type="file" accept="image/*" multiple className="hidden" />
                  </label>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Finance Management (Fadhir & Coach) */}
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
                    <Button
                      variant={finType === "in" ? "default" : "outline"}
                      onClick={() => setFinType("in")}
                      className="font-body"
                    >
                      <TrendingUp className="w-4 h-4 mr-1" /> Money In
                    </Button>
                    <Button
                      variant={finType === "out" ? "default" : "outline"}
                      onClick={() => setFinType("out")}
                      className="font-body"
                    >
                      <TrendingDown className="w-4 h-4 mr-1" /> Money Out
                    </Button>
                  </div>
                  <Input placeholder="Amount (KSh)" type="number" value={finAmount} onChange={(e) => setFinAmount(e.target.value)} className="bg-secondary border-border font-body" />
                  <Input placeholder="Description" value={finDesc} onChange={(e) => setFinDesc(e.target.value)} className="bg-secondary border-border font-body" />
                  <Button className="w-full font-body"><Plus className="w-4 h-4 mr-1" /> Record</Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Contribution Approvals (Fadhir & Coach) */}
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
                  <div key={req.id + req.month} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="font-body">
                      <p className="text-foreground">{req.player}</p>
                      <p className="text-xs text-muted-foreground">{req.month} • {req.id}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="font-body text-xs bg-green-600 hover:bg-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" className="font-body text-xs border-destructive/30 text-destructive hover:bg-destructive/10">
                        <XCircle className="w-3 h-3 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Financial Overview */}
        {canManageFinance && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader>
                <CardTitle className="font-heading text-lg text-foreground">Financial Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full font-body text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2">Month</th>
                        <th className="text-right py-2">Opening</th>
                        <th className="text-right py-2">In</th>
                        <th className="text-right py-2">Expenses</th>
                        <th className="text-right py-2">Closing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {finances.map((f) => {
                        const totalExpenses = f.expenses.reduce((sum, e) => sum + e.amount, 0);
                        return (
                          <tr key={f.month} className="border-b border-border">
                            <td className="py-2 text-foreground font-medium">{f.month}</td>
                            <td className="py-2 text-right text-muted-foreground">KSh {f.openingBalance.toLocaleString()}</td>
                            <td className="py-2 text-right text-green-400">+{f.contributions.toLocaleString()}</td>
                            <td className="py-2 text-right text-destructive">-{totalExpenses.toLocaleString()}</td>
                            <td className={`py-2 text-right font-medium ${f.closingBalance >= 0 ? "text-primary" : "text-destructive"}`}>
                              KSh {f.closingBalance.toLocaleString()}
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

        {/* Team Members Overview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
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
                    {allMembers.map((m) => (
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
