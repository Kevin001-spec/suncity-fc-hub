// Award animation mapping — centralized for PlayerProfile, OfficialProfile, Profile
import manofthematch from "@/assets/animations/manofthematch.json";
import otherMatchRewards from "@/assets/animations/other_match_rewards.json";
import mostimproveda from "@/assets/animations/mostimproveda.json";
import sharpshootera from "@/assets/animations/sharpshootera.json";
import defensivewalla from "@/assets/animations/defensivewalla.json";
import ironwalla from "@/assets/animations/ironwalla.json";
import defenderoftheweeka from "@/assets/animations/defenderoftheweeka.json";
import midfielddrivera from "@/assets/animations/midfielddrivera.json";
import consistentperfomaa from "@/assets/animations/consistentperfomaa.json";
import positiveinfluencea from "@/assets/animations/positiveinfluencea.json";
import mostdisciplineda from "@/assets/animations/mostdisciplineda.json";

const AWARD_ANIMATION_MAP: Record<string, any> = {
  potm: manofthematch,
  "man of the match": manofthematch,
  "player of the match": manofthematch,
  sharpshooter: sharpshootera,
  defensive_wall: defensivewalla,
  iron_wall: ironwalla,
  rising_star: mostimproveda,
  most_improved: mostimproveda,
  consistent_performer: consistentperfomaa,
  midfield_driver: midfielddrivera,
  defender_of_week: defenderoftheweeka,
  positive_influence: positiveinfluencea,
  most_disciplined: mostdisciplineda,
  top_week_performer: otherMatchRewards,
  hat_trick: sharpshootera,
  lockdown: defensivewalla,
  engine_room: midfielddrivera,
  playmaker: consistentperfomaa,
};

export function getAwardAnimation(awardType: string): any {
  if (!awardType) return otherMatchRewards;
  const lower = awardType.toLowerCase().trim();
  
  // Direct match
  if (AWARD_ANIMATION_MAP[lower]) return AWARD_ANIMATION_MAP[lower];
  
  // Partial match
  for (const [key, anim] of Object.entries(AWARD_ANIMATION_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return anim;
  }
  
  return otherMatchRewards;
}

export { manofthematch, otherMatchRewards, mostdisciplineda };
