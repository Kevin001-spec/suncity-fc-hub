import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import PlayerProfile from "./PlayerProfile";
import OfficialProfile from "./OfficialProfile";

const Profile = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;

  // Officials get the admin profile, players get the basic profile
  if (user.role === "player") {
    return <PlayerProfile />;
  }

  return <OfficialProfile />;
};

export default Profile;
