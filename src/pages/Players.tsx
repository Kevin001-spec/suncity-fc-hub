import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamData } from "@/contexts/TeamDataContext";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { type TeamMember } from "@/data/team-data";

const positionLabels: Record<string, string> = {
  GK: "Goalkeeper",
  DEF: "Defender",
  MID: "Midfielder",
  ATT: "Attacker",
};

const PlayerCard = ({ member, profilePic, onClose }: { member: TeamMember; profilePic?: string; onClose: () => void }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      className="bg-card border border-border rounded-xl p-6 w-full max-w-sm card-glow" onClick={(e) => e.stopPropagation()}>
      <div className="text-center">
        <Avatar className="w-20 h-20 mx-auto mb-4 border-2 border-primary">
          {profilePic && <AvatarImage src={profilePic} />}
          <AvatarFallback className="bg-secondary text-primary font-heading text-xl">{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <h3 className="font-heading text-lg text-foreground">{member.name}</h3>
        <p className="text-primary font-body text-sm">{member.id}</p>
        <Badge variant="outline" className="mt-2 border-primary/30 text-primary capitalize font-body">{member.role}</Badge>
        {member.position && <p className="text-muted-foreground font-body text-sm mt-1">{positionLabels[member.position] || member.position}</p>}
        {member.squadNumber && <p className="text-muted-foreground font-body text-sm mt-1">Squad #{member.squadNumber}</p>}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
          <div><p className="text-xl font-heading text-primary">{member.goals || 0}</p><p className="text-xs text-muted-foreground font-body">Goals</p></div>
          <div><p className="text-xl font-heading text-primary">{member.assists || 0}</p><p className="text-xs text-muted-foreground font-body">Assists</p></div>
          <div><p className="text-xl font-heading text-primary">{member.gamesPlayed || 0}</p><p className="text-xs text-muted-foreground font-body">Games</p></div>
        </div>
      </div>
    </motion.div>
  </motion.div>
);

const Players = () => {
  const { user } = useAuth();
  const { members, profilePics } = useTeamData();
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  if (!user) return <Navigate to="/" replace />;

  const playerMembers = members.filter((m) => m.role === "player" || m.role === "captain");

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="font-heading text-2xl gold-text">Players</h1>
          <p className="text-muted-foreground text-sm font-body mt-1">{playerMembers.length} squad members</p>
        </motion.div>

        <div className="space-y-3">
          {playerMembers.map((member, i) => (
            <motion.button
              key={member.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedMember(member)}
              className="w-full flex items-center justify-between p-4 rounded-xl player-card-glow bg-card hover:bg-secondary/50 transition-all text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="font-heading text-sm text-foreground font-bold">{member.name}</p>
                <p className="text-xs text-muted-foreground font-body">
                  {member.position ? positionLabels[member.position] || member.position : "Player"}
                  {member.squadNumber ? ` • #${member.squadNumber}` : ""}
                </p>
              </div>
              <Avatar className="w-12 h-12 border border-primary/20 ml-3">
                {profilePics[member.id] && <AvatarImage src={profilePics[member.id]} />}
                <AvatarFallback className="bg-secondary text-primary font-heading text-sm">{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </motion.button>
          ))}
        </div>
      </main>

      <AnimatePresence>
        {selectedMember && <PlayerCard member={selectedMember} profilePic={profilePics[selectedMember.id]} onClose={() => setSelectedMember(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default Players;
