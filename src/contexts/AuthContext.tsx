import React, { createContext, useContext, useState, useCallback } from "react";
import { TeamMember, authenticateMember } from "@/data/team-data";

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

  const login = useCallback((identifier: string, pin?: string) => {
    const member = authenticateMember(identifier, pin);
    if (member) {
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

  const isOfficial = user?.role === "coach" || user?.role === "finance" || user?.role === "manager" || user?.role === "captain";

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
