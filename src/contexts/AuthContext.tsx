import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { TeamMember, authenticateMember } from "@/data/team-data";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: TeamMember | null;
  login: (identifier: string, pin?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isOfficial: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TeamMember | null>(() => {
    const saved = localStorage.getItem("suncity_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Check for unread messages on login
  useEffect(() => {
    if (user) {
      supabase.from("messages").select("id", { count: "exact", head: true })
        .eq("to_id", user.id).eq("read", false)
        .then(({ count }) => {
          if (count && count > 0) {
            window.dispatchEvent(new CustomEvent("suncity-unread", { detail: count }));
          }
        });
    }
  }, [user?.id]);

  const login = useCallback(async (identifier: string, pin?: string): Promise<{ success: boolean; error?: string }> => {
    const upperId = identifier.toUpperCase();

    // Try fan login (SCF-F prefix — no PIN)
    if (upperId.startsWith("SCF-F")) {
      const { data } = await supabase.from("members").select("*").eq("id", upperId).single();
      if (data && (data as any).role === "fan") {
        const fanMember: TeamMember = {
          id: data.id, name: data.name, role: "fan",
          profilePic: (data as any).profile_pic_url,
          fanBadge: (data as any).fan_badge,
          fanPoints: (data as any).fan_points || 0,
          favouriteMoment: (data as any).favourite_moment,
          contributions: {},
        };
        setUser(fanMember);
        localStorage.setItem("suncity_user", JSON.stringify(fanMember));
        return { success: true };
      }
      return { success: false, error: "Invalid Fan ID." };
    }

    // Standard auth
    const member = authenticateMember(identifier, pin);
    if (member) {
      // Refresh from DB to get latest name/data
      supabase.from("members").select("*").eq("id", member.id).single().then(({ data }) => {
        if (data) {
          const refreshed = { ...member, name: data.name, position: data.position, profilePic: data.profile_pic_url };
          setUser(refreshed);
          localStorage.setItem("suncity_user", JSON.stringify(refreshed));
        }
      });
      setUser(member);
      localStorage.setItem("suncity_user", JSON.stringify(member));
      return { success: true };
    }
    return { success: false, error: "Invalid credentials. Check your ID or PIN." };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("suncity_user");
  }, []);

  const isOfficial = user?.role === "coach" || user?.role === "finance" || user?.role === "manager" || user?.role === "captain" || user?.role === "assistant_coach";

  return (
    <AuthContext.Provider value={{ user, login, logout, isOfficial }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
