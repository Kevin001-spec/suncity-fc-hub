import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, Home, User, BarChart3, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import suncityBadge from "@/assets/suncity-badge.png";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const handleLogout = () => { logout(); navigate("/"); };

  const links = [
    { path: "/dashboard", label: "Home", icon: Home },
    { path: "/results", label: "Results", icon: Trophy },
    { path: "/players", label: "Players", icon: Users },
    { path: "/stats", label: "Stats", icon: BarChart3 },
    { path: "/profile", label: "Profile", icon: User },
  ];

  return (
    <>
      {/* Desktop top nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b border-border hidden sm:block chelsea-bg">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden">
              <img src={suncityBadge} alt="Suncity FC" className="w-7 h-7 object-contain" />
            </div>
            <span className="font-heading text-sm font-bold text-white">SUNCITY FC</span>
          </div>

          <div className="flex items-center gap-1">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Button key={link.path} variant="ghost" size="sm" onClick={() => navigate(link.path)}
                  className={cn(
                    "font-body text-sm text-white/70 hover:text-white hover:bg-white/10 glow-tab relative",
                    isActive && "text-white bg-white/10 active"
                  )}>
                  <link.icon className="w-4 h-4 mr-1.5" />
                  {link.label}
                </Button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-white/60 font-body">{user.name} • {user.role.toUpperCase()}</span>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white/60 hover:text-red-400 hover:bg-white/10">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden chelsea-bg border-t border-white/10">
        <div className="flex items-center justify-around h-16 px-2">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <button key={link.path} onClick={() => navigate(link.path)}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all glow-tab relative",
                  isActive ? "text-white active" : "text-white/50"
                )}>
                <link.icon className="w-5 h-5" />
                <span className="text-[10px] font-body">{link.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile: add bottom padding spacer */}
      <div className="h-16 sm:hidden" />
    </>
  );
};

export default Navbar;
