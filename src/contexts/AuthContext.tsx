import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { TeamMember, authenticateMember } from "@/data/team-data";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: TeamMember | null;
  login: (identifier: string, pin?: string) => { success: boolean; error?: string };
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
            // Use a custom event to show toast after mount
            window.dispatchEvent(new CustomEvent("suncity-unread", { detail: count }));
          }
        });
    }
  }, [user?.id]);

  const login = useCallback((identifier: string, pin?: string) => {
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
