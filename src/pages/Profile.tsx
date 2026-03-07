import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import PlayerProfile from "./PlayerProfile";
import OfficialProfile from "./OfficialProfile";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();

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

  if (!user) return <Navigate to="/" replace />;

  // Officials (including assistant_coach) get the admin profile, players get the basic profile
  // Fans get a limited player profile
  if (user.role === "player" || user.role === "fan") {
    return <PlayerProfile />;
  }

  return <OfficialProfile />;
};

export default Profile;
