import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamData } from "@/contexts/TeamDataContext";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, CheckCircle, Clock, Minus, DollarSign } from "lucide-react";
import { contributionMonths, financialRemarks } from "@/data/team-data";

const Stats = () => {
  const { user, isOfficial } = useAuth();
  const { members, financialRecords } = useTeamData();

  if (!user) return <Navigate to="/" replace />;

  const playerMembers = members.filter((m) => m.role === "player" || m.role === "captain");

  const exportContributions = () => {
    let txt = "SUNCITY FC — Monthly Contribution Status\n";
    txt += "=========================================\n\n";
    const nameWidth = 16;
    const monthWidth = 12;

    // Header
    txt += "Player Name".padEnd(nameWidth) + " | ";
    contributionMonths.forEach((m) => {
      txt += m.label.padEnd(monthWidth) + " | ";
    });
    txt += "\n" + "-".repeat(nameWidth + (monthWidth + 3) * contributionMonths.length) + "\n";

    // Data rows
    members.forEach((m) => {
      txt += m.name.padEnd(nameWidth) + " | ";
      contributionMonths.forEach((month) => {
        const status = m.contributions[month.key] || "unpaid";
        const icon = status === "paid" ? "✅" : status === "pending" ? "⏳" : "—";
        txt += icon.padEnd(monthWidth) + " | ";
      });
      txt += "\n";
    });

    txt += "\n\nGenerated: " + new Date().toLocaleDateString() + "\n";
    txt += "Suncity FC © 2026\n";

    const blob = new Blob([txt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "suncity_fc_contributions.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="font-heading text-2xl gold-text">Team Statistics</h1>
          <p className="text-muted-foreground text-sm font-body mt-1">Overview of player performance and contributions</p>
        </motion.div>

        {/* Player Stats */}
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
                    {members.map((m) => (
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

        {/* Monthly Contribution Grid */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-card border-border card-glow">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" /> Contribution Status
              </CardTitle>
              {isOfficial && (
                <Button size="sm" variant="outline" onClick={exportContributions} className="font-body text-xs border-primary/30 text-primary">
                  <Download className="w-3 h-3 mr-1" /> Export .txt
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
                        <th key={m.key} className="text-center py-2 px-3 whitespace-nowrap">{m.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
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
                      <Badge variant="outline" className="font-body text-xs border-primary/30 text-primary">
                        {f.contributors} contributors
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-body text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Opening</p>
                        <p className="text-foreground">KSh {f.openingBalance.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Contributions</p>
                        <p className="text-green-400">+KSh {f.contributions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Expenses</p>
                        <p className="text-destructive">-KSh {totalExpenses.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Closing</p>
                        <p className={f.closingBalance >= 0 ? "text-primary font-medium" : "text-destructive font-medium"}>
                          KSh {f.closingBalance.toLocaleString()}
                        </p>
                      </div>
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

              <div className="border-t border-border pt-4">
                <h4 className="font-heading text-xs text-primary tracking-wider mb-2">REMARKS</h4>
                <ul className="space-y-1 font-body text-xs text-secondary-foreground">
                  {financialRemarks.map((r, i) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Stats;
