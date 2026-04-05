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

  const handleLogout = () => { logout(); navigate("/"); };

  const publicLinks = [
    { path: "/", label: "Home", icon: Home },
    { path: "/results", label: "Results", icon: Trophy },
    { path: "/players", label: "Players", icon: Users },
    { path: "/stats", label: "Stats", icon: BarChart3 },
  ];

  const allLinks = user
    ? [...publicLinks, { path: "/profile", label: "Profile", icon: User }]
    : publicLinks;

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/dashboard") return true;
    if (path === "/" && location.pathname === "/") return true;
    return location.pathname === path;
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl border-b border-border chelsea-bg">
      {/* Desktop */}
      <div className="hidden sm:flex max-w-7xl mx-auto px-4 items-center justify-between h-14">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden">
            <img src={suncityBadge} alt="Suncity FC" className="w-7 h-7 object-contain" />
          </div>
          <span className="font-heading text-sm font-bold text-white">SUNCITY FC</span>
        </div>

        <div className="flex items-center gap-1">
          {allLinks.map((link) => (
            <Button key={link.path} variant="ghost" size="sm" onClick={() => navigate(link.path)}
              className={cn(
                "font-body text-sm text-white/70 hover:text-white hover:bg-white/10 glow-tab relative",
                isActive(link.path) && "text-white bg-white/10 active"
              )}>
              <link.icon className="w-4 h-4 mr-1.5" />
              {link.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-xs text-white/60 font-body">{user.name} • {user.role.toUpperCase()}</span>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white/60 hover:text-red-400 hover:bg-white/10">
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => navigate("/profile")} className="text-white/60 hover:text-white font-body text-xs">
              Login
            </Button>
          )}
        </div>
      </div>

      {/* Mobile — top bar */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between px-3 h-12">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center overflow-hidden">
              <img src={suncityBadge} alt="Suncity FC" className="w-5 h-5 object-contain" />
            </div>
            <span className="font-heading text-xs font-bold text-white">SUNCITY FC</span>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="text-[10px] text-white/50 font-body">{user.name}</span>
                <button onClick={handleLogout} className="text-white/50 hover:text-red-400 transition-colors p-1">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button onClick={() => navigate("/profile")} className="text-white/50 hover:text-white transition-colors p-1 text-[10px] font-body">
                Login
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-around h-11 border-t border-white/10">
          {allLinks.map((link) => (
            <button key={link.path} onClick={() => navigate(link.path)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-all glow-tab relative",
                isActive(link.path) ? "text-white active" : "text-white/50"
              )}>
              <link.icon className="w-4 h-4" />
              <span className="text-[9px] font-body">{link.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
