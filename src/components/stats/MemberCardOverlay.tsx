import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Award } from "lucide-react";
import { type TeamMember, getFullPositionName, getPositionGroup } from "@/data/team-data";

interface MemberCardOverlayProps {
  member: TeamMember;
  profilePic?: string;
  onClose: () => void;
}

export const MemberCardOverlay = ({ member, profilePic, onClose }: MemberCardOverlayProps) => {
  const posGroup = getPositionGroup(member.position);
  const isGK = posGroup === "GK";
  const isDEF = posGroup === "DEF";
  const isFan = member.role === "fan";
  const isPlayerLike = member.role === "player" || member.role === "captain" || member.role === "finance";
  const hasStats = isPlayerLike && (member.goals || member.assists || member.gamesPlayed || member.saves || member.tackles);

  const roleLabel =
    member.role === "coach"
      ? "Head Coach"
      : member.role === "assistant_coach"
      ? "Assistant Coach"
      : member.role === "finance"
      ? "Finance Manager"
      : member.role === "captain"
      ? "Field Captain"
      : member.role === "manager"
      ? "Team Manager"
      : member.role === "fan"
      ? "Fan"
      : "Player";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
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
            {profilePic && <AvatarImage src={profilePic} className="aspect-square object-cover object-center" />}
            <AvatarFallback className="bg-secondary text-primary font-heading text-xl">
              {member.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h3 className="font-heading text-lg text-foreground">{member.name}</h3>
          <Badge className="bg-primary text-primary-foreground font-body mt-1">{roleLabel}</Badge>
          {member.position && (
            <p className="text-muted-foreground font-body text-sm mt-1">{getFullPositionName(member.position)}</p>
          )}
          {member.squadNumber && (
            <p className="text-muted-foreground font-body text-sm mt-1">Squad #{member.squadNumber}</p>
          )}

          {/* Fan-specific: badge, points, favourite moment */}
          {isFan && (
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              {member.fanBadge && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
                  <Award className="w-4 h-4 text-primary" />
                  <span className="text-sm font-heading text-primary">{member.fanBadge}</span>
                </div>
              )}
              <div className="flex justify-center gap-6">
                <div>
                  <p className="text-xl font-heading text-primary">{member.fanPoints || 0}</p>
                  <p className="text-xs text-muted-foreground font-body">Points</p>
                </div>
              </div>
              {member.favouriteMoment && (
                <div className="bg-secondary/50 rounded-lg p-3 mt-2">
                  <p className="text-xs text-muted-foreground font-body mb-1">Favourite Moment</p>
                  <p className="text-sm text-foreground font-body italic">"{member.favouriteMoment}"</p>
                </div>
              )}
            </div>
          )}

          {/* Player/Captain/Finance stats */}
          {hasStats && !isFan && (
            <div className={`grid gap-3 mt-4 pt-4 border-t border-border ${isDEF ? "grid-cols-4" : "grid-cols-3"}`}>
              {isGK ? (
                <>
                  <div>
                    <p className="text-xl font-heading text-primary">{member.saves || 0}</p>
                    <p className="text-xs text-muted-foreground font-body">Saves</p>
                  </div>
                  <div>
                    <p className="text-xl font-heading text-primary">{member.cleanSheets || 0}</p>
                    <p className="text-xs text-muted-foreground font-body">Clean Sheets</p>
                  </div>
                  <div>
                    <p className="text-xl font-heading text-primary">{member.aerialDuels || 0}</p>
                    <p className="text-xs text-muted-foreground font-body">Aerial Duels</p>
                  </div>
                </>
              ) : isDEF ? (
                <>
                  <div>
                    <p className="text-xl font-heading text-primary">{member.tackles || 0}</p>
                    <p className="text-xs text-muted-foreground font-body">Tackles</p>
                  </div>
                  <div>
                    <p className="text-xl font-heading text-primary">{member.interceptions || 0}</p>
                    <p className="text-xs text-muted-foreground font-body">Int.</p>
                  </div>
                  <div>
                    <p className="text-xl font-heading text-primary">{member.blocks || 0}</p>
                    <p className="text-xs text-muted-foreground font-body">Blocks</p>
                  </div>
                  <div>
                    <p className="text-xl font-heading text-primary">{member.clearances || 0}</p>
                    <p className="text-xs text-muted-foreground font-body">Clear.</p>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          )}

          {/* Non-player officials with no stats */}
          {!hasStats && !isFan && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground font-body">{roleLabel}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
