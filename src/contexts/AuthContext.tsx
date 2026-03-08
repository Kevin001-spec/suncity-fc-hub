import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { TeamMember } from "@/data/team-data";
import { supabase } from "@/integrations/supabase/client";

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
    try {
      const { data, error } = await supabase.functions.invoke("authenticate", {
        body: { memberId: identifier, pin: pin || undefined },
      });

      if (error) {
        return { success: false, error: "Authentication failed. Please try again." };
      }

      if (data?.success && data.member) {
        const m = data.member;
        const member: TeamMember = {
          id: m.id,
          name: m.name,
          role: m.role,
          position: m.position || undefined,
          squadNumber: m.squad_number || undefined,
          profilePic: m.profile_pic_url || undefined,
          fanBadge: m.fan_badge || undefined,
          fanPoints: m.fan_points || 0,
          favouriteMoment: m.favourite_moment || undefined,
          contributions: {},
        };
        setUser(member);
        localStorage.setItem("suncity_user", JSON.stringify(member));
        return { success: true };
      }

      return { success: false, error: data?.error || "Invalid credentials." };
    } catch {
      return { success: false, error: "Authentication failed. Please try again." };
    }
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
