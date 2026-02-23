import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Footprints, Gamepad2, Upload, CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";

const months = [
  { key: "dec-2025", label: "Dec 2025" },
  { key: "jan-2026", label: "Jan 2026" },
  { key: "feb-2026", label: "Feb 2026" },
];

const PlayerProfile = () => {
  const { user } = useAuth();
  const [excuseRequested, setExcuseRequested] = useState(false);
  const [contributions, setContributions] = useState<Record<string, string>>(
    user?.contributions || {}
  );

  if (!user) return <Navigate to="/" replace />;

  const handlePayRequest = (monthKey: string) => {
    setContributions((prev) => ({ ...prev, [monthKey]: "pending" }));
  };

  const statCards = [
    { icon: Target, label: "Goals", value: user.goals || 0 },
    { icon: Footprints, label: "Assists", value: user.assists || 0 },
    { icon: Gamepad2, label: "Games", value: user.gamesPlayed || 0 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="relative inline-block">
            <Avatar className="w-24 h-24 border-2 border-primary mx-auto">
              <AvatarFallback className="bg-secondary text-primary font-heading text-2xl">
                {user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors">
              <Upload className="w-4 h-4" />
            </button>
          </div>
          <h2 className="font-heading text-2xl text-foreground mt-4">{user.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Badge variant="outline" className="border-primary/30 text-primary font-body">{user.id}</Badge>
            {user.role === "captain" && (
              <Badge className="bg-primary text-primary-foreground font-body">Captain</Badge>
            )}
          </div>
          {user.squadNumber && (
            <p className="text-muted-foreground font-body text-sm mt-1">Squad #{user.squadNumber}</p>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4"
        >
          {statCards.map(({ icon: Icon, label, value }) => (
            <Card key={label} className="bg-card border-border card-glow text-center">
              <CardContent className="pt-6 pb-4">
                <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-heading text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground font-body">{label}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Monthly Contributions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card border-border card-glow">
            <CardHeader>
              <CardTitle className="font-heading text-lg text-foreground">Monthly Contributions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {months.map(({ key, label }) => {
                const status = contributions[key] || "unpaid";
                return (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="font-body text-foreground">{label}</span>
                    <div className="flex items-center gap-2">
                      {status === "paid" && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-body">
                          <CheckCircle className="w-3 h-3 mr-1" /> Paid
                        </Badge>
                      )}
                      {status === "pending" && (
                        <Badge className="bg-primary/20 text-primary border-primary/30 font-body">
                          <Clock className="w-3 h-3 mr-1" /> Pending Approval
                        </Badge>
                      )}
                      {status === "unpaid" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePayRequest(key)}
                          className="font-body text-xs border-primary/30 text-primary hover:bg-primary/10"
                        >
                          Mark as Paid
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Excuse Request */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card border-border card-glow">
            <CardHeader>
              <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-primary" />
                Game Excuse
              </CardTitle>
            </CardHeader>
            <CardContent>
              {excuseRequested ? (
                <div className="flex items-center gap-2 text-primary font-body">
                  <CheckCircle className="w-4 h-4" />
                  You are excused from the next game
                </div>
              ) : (
                <Button
                  onClick={() => setExcuseRequested(true)}
                  variant="outline"
                  className="font-body border-primary/30 text-primary hover:bg-primary/10"
                >
                  Request Excuse for Next Game
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default PlayerProfile;
