import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Sun, Trophy, Calendar, Users, BookOpen, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  allMembers, initialGameScores, initialCalendarEvents, teamBackground,
  type TeamMember, type GameScore,
} from "@/data/team-data";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

// Player Card Modal
const PlayerCard = ({ member, onClose }: { member: TeamMember; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-card border border-border rounded-xl p-6 w-full max-w-sm card-glow"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="text-center">
        <Avatar className="w-20 h-20 mx-auto mb-4 border-2 border-primary">
          <AvatarFallback className="bg-secondary text-primary font-heading text-xl">
            {member.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h3 className="font-heading text-lg text-foreground">{member.name}</h3>
        <p className="text-primary font-body text-sm">{member.id}</p>
        <Badge variant="outline" className="mt-2 border-primary/30 text-primary capitalize font-body">
          {member.role}
        </Badge>
        {member.squadNumber && (
          <p className="text-muted-foreground font-body text-sm mt-2">Squad #{member.squadNumber}</p>
        )}
        {member.position && (
          <p className="text-muted-foreground font-body text-sm">{member.position}</p>
        )}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
          <div>
            <p className="text-xl font-heading text-primary">{member.goals || 0}</p>
            <p className="text-xs text-muted-foreground font-body">Goals</p>
          </div>
          <div>
            <p className="text-xl font-heading text-primary">{member.assists || 0}</p>
            <p className="text-xs text-muted-foreground font-body">Assists</p>
          </div>
          <div>
            <p className="text-xl font-heading text-primary">{member.gamesPlayed || 0}</p>
            <p className="text-xs text-muted-foreground font-body">Games</p>
          </div>
        </div>
      </div>
    </motion.div>
  </motion.div>
);

// Score Card
const ScoreCard = ({ game }: { game: GameScore }) => (
  <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
    <div className="font-body">
      <p className="text-foreground font-medium">vs {game.opponent}</p>
      <p className="text-xs text-muted-foreground">{new Date(game.date).toLocaleDateString()}</p>
    </div>
    <div className="flex items-center gap-2">
      <span className="font-heading text-lg text-primary">{game.ourScore}</span>
      <span className="text-muted-foreground">-</span>
      <span className="font-heading text-lg text-muted-foreground">{game.theirScore}</span>
      <Badge
        variant="outline"
        className={`ml-2 text-xs font-body ${
          game.ourScore > game.theirScore
            ? "border-green-500/30 text-green-400"
            : game.ourScore < game.theirScore
            ? "border-destructive/30 text-destructive"
            : "border-primary/30 text-primary"
        }`}
      >
        {game.ourScore > game.theirScore ? "W" : game.ourScore < game.theirScore ? "L" : "D"}
      </Badge>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Hero Header */}
        <motion.section {...fadeUp} className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-primary/40 bg-secondary mb-4">
            <Sun className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold gold-text text-shadow-gold">
            SUNCITY FC
          </h1>
          <p className="text-muted-foreground mt-2 tracking-[0.3em] uppercase text-sm font-body">
            Discipline • Unity • Victory
          </p>
        </motion.section>

        {/* Recent Scores & Calendar */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-foreground font-heading text-lg">
                  <Trophy className="w-5 h-5 text-primary" />
                  Recent Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {initialGameScores.map((game) => (
                  <ScoreCard key={game.id} game={game} />
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-foreground font-heading text-lg">
                  <Calendar className="w-5 h-5 text-primary" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {initialCalendarEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-heading text-xs">
                        {new Date(event.date).getDate()}
                      </span>
                    </div>
                    <div className="font-body">
                      <p className="text-foreground font-medium text-sm">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Media Carousel Placeholder */}
        <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
          <Card className="bg-card border-border card-glow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground font-heading text-lg">
                📸 Today's Media
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-40 rounded-lg border border-dashed border-border text-muted-foreground font-body text-sm">
                No media uploaded today — Officials can upload from their profile
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Team Roster */}
        <motion.div {...fadeUp} transition={{ delay: 0.4 }}>
          <Card className="bg-card border-border card-glow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground font-heading text-lg">
                <Users className="w-5 h-5 text-primary" />
                Team Roster
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {allMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary border border-transparent hover:border-primary/20 transition-all group text-left"
                  >
                    <Avatar className="w-8 h-8 border border-border group-hover:border-primary/30 transition-colors">
                      <AvatarFallback className="bg-muted text-primary font-heading text-xs">
                        {member.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-body font-medium text-foreground truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground font-body capitalize">{member.role}</p>
                    </div>
                    <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Team Background */}
        <motion.div {...fadeUp} transition={{ delay: 0.5 }}>
          <Card className="bg-card border-border card-glow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground font-heading text-lg">
                <BookOpen className="w-5 h-5 text-primary" />
                Our Story
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 font-body text-secondary-foreground leading-relaxed">
              <div>
                <h4 className="font-heading text-sm text-primary mb-2 tracking-wider">THE BEGINNING</h4>
                <p className="text-sm">{teamBackground.origin}</p>
              </div>
              <div>
                <h4 className="font-heading text-sm text-primary mb-2 tracking-wider">THE STRUGGLE</h4>
                <p className="text-sm">{teamBackground.struggle}</p>
              </div>
              <div>
                <h4 className="font-heading text-sm text-primary mb-2 tracking-wider">COACH FABIAN'S IMPACT</h4>
                <p className="text-sm">{teamBackground.coachImpact}</p>
              </div>
              <div>
                <h4 className="font-heading text-sm text-primary mb-2 tracking-wider">ACKNOWLEDGEMENTS</h4>
                <p className="text-sm">{teamBackground.acknowledgements}</p>
              </div>
              <div>
                <h4 className="font-heading text-sm text-primary mb-2 tracking-wider">OUR VALUES</h4>
                <p className="text-sm">{teamBackground.values}</p>
              </div>
              <div>
                <h4 className="font-heading text-sm text-primary mb-2 tracking-wider">COMMITMENT</h4>
                <p className="text-sm">{teamBackground.contributions}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Player Card Modal */}
      {selectedMember && (
        <PlayerCard member={selectedMember} onClose={() => setSelectedMember(null)} />
      )}
    </div>
  );
};

export default Dashboard;
