import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import PlayerProfile from "./PlayerProfile";
import OfficialProfile from "./OfficialProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const badgeChecked = useRef(false);

  // Listen for unread messages notification
  useEffect(() => {
    const handler = (e: Event) => {
      const count = (e as CustomEvent).detail;
      if (count > 0) {
        toast({ title: `📬 You have ${count} unread message${count > 1 ? "s" : ""}`, description: "Check your inbox." });
      }
    };
    window.addEventListener("suncity-unread", handler);
    return () => window.removeEventListener("suncity-unread", handler);
  }, [toast]);

  // POTM / Most Improved / Match Awards login badge notification
  useEffect(() => {
    if (!user || badgeChecked.current) return;
    badgeChecked.current = true;

    (async () => {
      // Check latest POTM
      const { data: potmData } = await supabase
        .from("match_performances")
        .select("player_id, game_id")
        .eq("is_potm", true)
        .order("created_at", { ascending: false })
        .limit(1);

      if (potmData && potmData.length > 0 && potmData[0].player_id === user.id) {
        const { data: game } = await supabase
          .from("game_scores")
          .select("opponent")
          .eq("id", potmData[0].game_id)
          .limit(1);
        const opponent = game?.[0]?.opponent || "last match";
        toast({
          title: "🏆 Player of the Match!",
          description: `You were named POTM vs ${opponent}! Keep up the great work!`,
        });
      }

      // Check match awards for this player
      const { data: awards } = await supabase
        .from("match_awards" as any)
        .select("*")
        .eq("player_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      
      if (awards && awards.length > 0) {
        // Show the latest award (if not POTM which was already shown)
        const nonPotmAward = (awards as any[]).find((a: any) => a.award_type !== "potm");
        if (nonPotmAward) {
          toast({
            title: `${nonPotmAward.award_label}`,
            description: `${nonPotmAward.reason}`,
          });
        }
      }

      // Check Most Improved — compare last 2 weekly stat logs
      if (user.role === "player" || user.role === "captain" || user.role === "finance") {
        const { data: logs } = await supabase
          .from("weekly_stats_log")
          .select("*")
          .eq("player_id", user.id)
          .order("week_start", { ascending: false })
          .limit(2);

        if (logs && logs.length === 2) {
          const recent = logs[0];
          const prev = logs[1];
          const recentTotal = (recent.goals || 0) + (recent.assists || 0) + (recent.successful_tackles || 0) + (recent.saves || 0);
          const prevTotal = (prev.goals || 0) + (prev.assists || 0) + (prev.successful_tackles || 0) + (prev.saves || 0);
          if (recentTotal > prevTotal && prevTotal > 0) {
            const pct = Math.round(((recentTotal - prevTotal) / prevTotal) * 100);
            if (pct >= 20) {
              toast({
                title: "📈 Most Improved Player!",
                description: `Your stats improved by ${pct}% this week! Amazing progress!`,
              });
            }
          }
        }
      }
    })();
  }, [user, toast]);

  if (!user) return <Navigate to="/" replace />;

  // Officials (including assistant_coach) get the admin profile, players get the basic profile
  // Fans get a limited player profile
  if (user.role === "player" || user.role === "fan") {
    return <PlayerProfile />;
  }

  return <OfficialProfile />;
};

export default Profile;
