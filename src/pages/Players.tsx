import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamData } from "@/contexts/TeamDataContext";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { type TeamMember, getFullPositionName, getPositionGroup } from "@/data/team-data";
import { getStatsForPosition } from "@/lib/position-stats";
import LottieAnimation from "@/components/LottieAnimation";
import playersAnimation from "@/assets/animations/playersanimation.json";

const positionGroupOrder: Record<string, number> = { "GK": 1, "DEF": 2, "MID": 3, "ATT": 4 };
const positionGroupLabels: Record<string, string> = { "GK": "Goalkeepers", "DEF": "Defenders", "MID": "Midfielders", "ATT": "Attackers" };

const PlayerCard = ({ member, profilePic, onClose }: { member: TeamMember; profilePic?: string; onClose: () => void }) => {
  const statFields = getStatsForPosition(member.position);

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
          {member.role === "captain" && <Badge className="bg-primary text-primary-foreground font-body mt-1">Field Captain</Badge>}
           {member.position && <p className="text-muted-foreground font-body text-sm mt-1">{getFullPositionName(member.position)}</p>}
          <div className={`grid gap-3 mt-4 pt-4 border-t border-border`} style={{ gridTemplateColumns: `repeat(${Math.min(statFields.length, 5)}, 1fr)` }}>
            {statFields.map(sf => (
              <div key={sf.key}>
                <p className="text-xl font-heading text-primary">{(member as any)[sf.key] || 0}</p>
                <p className="text-xs text-muted-foreground font-body">{sf.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Players = () => {
  const { user } = useAuth();
  const { members, profilePics } = useTeamData();
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const playerMembers = members.filter((m) => m.role === "player" || m.role === "captain");

  const sortedPlayers = useMemo(() => {
    return [...playerMembers].sort((a, b) => {
      if (a.role === "captain" && b.role !== "captain") return -1;
      if (a.role !== "captain" && b.role === "captain") return 1;
      const aGroup = positionGroupOrder[getPositionGroup(a.position)] || 5;
      const bGroup = positionGroupOrder[getPositionGroup(b.position)] || 5;
      return aGroup - bGroup;
    });
  }, [playerMembers]);

  const sections = useMemo(() => {
    const groups: { label: string; players: typeof sortedPlayers }[] = [];
    const captains = sortedPlayers.filter(m => m.role === "captain");
    if (captains.length > 0) groups.push({ label: "Field Captains", players: captains });
    const nonCaptains = sortedPlayers.filter(m => m.role !== "captain");
    for (const pg of ["GK", "DEF", "MID", "ATT"]) {
      const inGroup = nonCaptains.filter(m => getPositionGroup(m.position) === pg);
      if (inGroup.length > 0) groups.push({ label: positionGroupLabels[pg], players: inGroup });
    }
    return groups;
  }, [sortedPlayers]);

  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="font-heading text-2xl gold-text">Players</h1>
          <p className="text-muted-foreground text-sm font-body mt-1">{playerMembers.length} squad members</p>
        </motion.div>

        {sections.map((section, si) => (
          <div key={section.label}>
            <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: si * 0.05 }}
              className="font-heading text-xs text-primary tracking-wider uppercase mb-3 mt-4">{section.label}</motion.h3>
            <div className="space-y-3">
              {section.players.map((member, i) => (
                <motion.button
                  key={member.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (si * 0.05) + (i * 0.02) }}
                  onClick={() => setSelectedMember(member)}
                  className="w-full flex items-center justify-between p-4 rounded-xl player-card-glow bg-card hover:bg-secondary/50 transition-all text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-sm text-foreground font-bold">{member.name}</p>
                    <p className="text-xs text-muted-foreground font-body">
                      {member.role === "captain" ? "Field Captain • " : ""}
                      {getFullPositionName(member.position)}
                    </p>
                  </div>
                  <Avatar className="w-12 h-12 border border-primary/20 ml-3">
                    {profilePics[member.id] && <AvatarImage src={profilePics[member.id]} className="aspect-square object-cover object-center" />}
                    <AvatarFallback className="bg-secondary text-primary font-heading text-sm">{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </main>

      <AnimatePresence>
        {selectedMember && <PlayerCard member={selectedMember} profilePic={profilePics[selectedMember.id]} onClose={() => setSelectedMember(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default Players;
