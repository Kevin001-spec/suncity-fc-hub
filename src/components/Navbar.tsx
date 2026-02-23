import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Sun, LogOut, Home, User, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const links = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/profile", label: "My Profile", icon: User },
  ];

  // Officials get stats access
  if (user.role !== "player") {
    links.push({ path: "/stats", label: "Stats", icon: BarChart3 });
  }

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-3">
          <Sun className="w-6 h-6 text-primary" />
          <span className="font-heading text-sm font-bold gold-text hidden sm:block">SUNCITY FC</span>
        </div>

        <div className="flex items-center gap-1">
          {links.map((link) => (
            <Button
              key={link.path}
              variant="ghost"
              size="sm"
              onClick={() => navigate(link.path)}
              className={cn(
                "font-body text-sm",
                location.pathname === link.path && "bg-primary/10 text-primary"
              )}
            >
              <link.icon className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">{link.label}</span>
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-body hidden sm:block">
            {user.name} • {user.role.toUpperCase()}
          </span>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
