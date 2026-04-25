import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Award } from "lucide-react";
import { type TeamMember } from "@/data/team-data";

interface LatestAwardsCardProps {
  matchReportsByGame: any[];
  matchAwards: any[];
  members: TeamMember[];
  profilePics: Record<string, string>;
}

export const LatestAwardsCard = ({
  matchReportsByGame,
  matchAwards,
  members,
  profilePics,
}: LatestAwardsCardProps) => {
  if (matchReportsByGame.length === 0) return null;

  const latestGameId = matchReportsByGame[0]?.gameId;
  const latestAwards = latestGameId ? matchAwards.filter((a: any) => a.game_id === latestGameId) : [];
  if (latestAwards.length === 0) return null;

  const latestGame = matchReportsByGame[0].game;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.115 }}>
      <Card className="bg-card border-primary/20 card-glow">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" /> 🏅 Match Awards
          </CardTitle>
          {latestGame && (
            <p className="text-xs text-muted-foreground font-body">
              vs {latestGame.opponent} — {latestGame.date}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {latestAwards.map((award: any) => {
              const player = members.find((m) => m.id === award.player_id);
              const pic = profilePics[award.player_id];
              return (
                <div
                  key={award.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    award.award_type === "potm" ? "border-primary/40 bg-primary/10" : "border-border bg-secondary/30"
                  }`}
                >
                  <Avatar className="w-10 h-10 border border-primary/20 shrink-0">
                    {pic && <AvatarImage src={pic} className="aspect-square object-cover object-center" />}
                    <AvatarFallback className="bg-secondary text-primary font-heading text-xs">
                      {player?.name?.slice(0, 2).toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-sm text-foreground">{award.award_label}</p>
                    <p className="font-body text-xs text-foreground font-medium">{player?.name || "Unknown Player"}</p>
                    <p className="text-[10px] text-muted-foreground font-body truncate">{award.reason}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
