import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTeamData } from "@/contexts/TeamDataContext";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Shield, Users, Target, Footprints, ChevronRight, MessageCircle } from "lucide-react";
import { getFullPositionName, getPositionGroup } from "@/data/team-data";
import LottieAnimation from "@/components/LottieAnimation";
import players_profile from "@/assets/animations/players_profile.json";
import players_carousel_1 from "@/assets/animations/players_carousel_1.json";
import players_carousel_2 from "@/assets/animations/players_carousel_2.json";
import players_carousel_3 from "@/assets/animations/players_carousel_3.json";
import players_carousel_4 from "@/assets/animations/players_carousel_4.json";
import LottieCarousel from "@/components/LottieCarousel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Paragraph, TextRun } from "docx";

const playersCarousel = [players_carousel_1, players_carousel_2, players_carousel_3, players_carousel_4];

const Players = () => {
  const { members, profilePics, matchPerformances } = useTeamData();
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const playerMembers = members.filter(m => m.role === "player" || m.role === "captain" || m.role === "finance" || m.role === "manager");
  
  const sections = useMemo(() => {
    return [
      { label: "Captains", players: playerMembers.filter(m => m.role === "captain") },
      { label: "Goalkeepers", players: playerMembers.filter(m => getPositionGroup(m.position) === "GK") },
      { label: "Defenders", players: playerMembers.filter(m => getPositionGroup(m.position) === "DEF") },
      { label: "Midfielders", players: playerMembers.filter(m => getPositionGroup(m.position) === "MID") },
      { label: "Attackers", players: playerMembers.filter(m => getPositionGroup(m.position) === "ATT") },
    ].filter(s => s.players.length > 0);
  }, [playerMembers]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto p-4 pt-24 pb-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center gap-6 mb-12">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-primary/20 shadow-2xl overflow-hidden bg-card card-glow">
            <LottieAnimation animationData={players_profile} className="w-full h-full scale-110" />
          </div>
          <div className="text-center md:text-left">
            <Badge className="bg-primary/10 text-primary border-primary/30 font-heading mb-2">ACTIVE REGISTRY</Badge>
            <h1 className="text-4xl md:text-5xl font-heading text-foreground mb-2">Squad Members</h1>
            <p className="text-muted-foreground font-body max-w-md">
              The elite squad representing SunCity FC. View player profiles and seasonal roles.
            </p>
          </div>
        </div>

        {/* Squad Sections */}
        {sections.map((section, si) => (
          <div key={section.label} className="mb-10 last:mb-0">
            <motion.h3
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: si * 0.1 }}
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
            {/* Category divider animation — between sections */}
            {si < sections.length - 1 && (
              <LottieCarousel animations={playersCarousel} className="h-16 w-[150px] md:w-[250px] mx-auto my-3" />
            )}
          </div>
        ))}

        {/* Join Team WhatsApp — logged-in only */}
        <motion.a
          href="https://chat.whatsapp.com/FF9oZ8H8oXPA1jny5Kacs2"
          target="_blank" rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="block mt-6 p-4 rounded-xl border-2 text-center transition-all hover:brightness-110"
          style={{ borderColor: "#25D366", backgroundColor: "rgba(37,211,102,0.08)" }}
        >
          <p className="font-heading text-sm" style={{ color: "#25D366" }}>💬 Join Team WhatsApp Group</p>
        </motion.a>

      </main>

      {/* Profile Modal */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="bg-card border-border sm:max-w-[400px] p-0 overflow-hidden card-glow">
          <DialogHeader className="p-0">
            <div className="h-24 bg-primary/10 relative">
               <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                  <Avatar className="w-20 h-20 border-4 border-card">
                    {selectedMember && profilePics[selectedMember.id] && <AvatarImage src={profilePics[selectedMember.id]} className="aspect-square object-cover" />}
                    <AvatarFallback className="bg-secondary text-primary font-heading text-xl">{selectedMember?.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
               </div>
            </div>
          </DialogHeader>
          <div className="pt-12 pb-6 px-6 text-center">
            <h2 className="font-heading text-xl text-foreground">{selectedMember?.name}</h2>
            <p className="text-xs text-muted-foreground font-body mb-4">{getFullPositionName(selectedMember?.position)} • {selectedMember?.role.toUpperCase()}</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                <p className="text-[10px] text-muted-foreground font-body uppercase">Goals</p>
                <p className="text-2xl font-heading text-primary">{selectedMember?.goals || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                <p className="text-[10px] text-muted-foreground font-body uppercase">Assists</p>
                <p className="text-2xl font-heading text-foreground">{selectedMember?.assists || 0}</p>
              </div>
            </div>

            <Button className="w-full mt-6 font-heading" onClick={() => setSelectedMember(null)}>Close Profile</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Players;
