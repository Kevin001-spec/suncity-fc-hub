import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { TeamMember, type Role } from "@/data/team-data";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: TeamMember | null;
  login: (identifier: string, pin?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<void>;
  linkGoogleAccount: (memberId: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isOfficial: boolean;
  isGuest: boolean;
  isLinking: boolean;
  setIsLinking: (v: boolean) => void;
  googleEmail: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TeamMember | null>(() => {
    const saved = localStorage.getItem("suncity_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isLinking, setIsLinking] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [googleUserId, setGoogleUserId] = useState<string | null>(null);

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

  // Listen for Google OAuth callback
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const googleId = session.user.id;
        const email = session.user.email || "";
        setGoogleUserId(googleId);
        setGoogleEmail(email);

        // Check if this google_id is already linked to a member
        const { data: member } = await supabase
          .from("members")
          .select("id, name, role, position, squad_number, profile_pic_url, fan_badge, fan_points, favourite_moment")
          .eq("google_id", googleId)
          .single();

        if (member) {
          // Auto-login with linked member
          const m: TeamMember = {
            id: member.id,
            name: member.name,
            role: member.role,
            position: member.position || undefined,
            squadNumber: member.squad_number || undefined,
            profilePic: member.profile_pic_url || undefined,
            fanBadge: member.fan_badge || undefined,
            fanPoints: member.fan_points || 0,
            favouriteMoment: member.favourite_moment || undefined,
            contributions: {},
          };
          setUser(m);
          localStorage.setItem("suncity_user", JSON.stringify(m));
        } else {
          // Show linking screen
          setIsLinking(true);
        }
      }
    });

    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !user) {
        const googleId = session.user.id;
        setGoogleUserId(googleId);
        setGoogleEmail(session.user.email || "");
        // Check if already linked
        supabase.from("members").select("id, name, role, position, squad_number, profile_pic_url, fan_badge, fan_points, favourite_moment")
          .eq("google_id", googleId).single().then(({ data: member }) => {
            if (member) {
              const m: TeamMember = {
                id: member.id, name: member.name, role: member.role,
                position: member.position || undefined, squadNumber: member.squad_number || undefined,
                profilePic: member.profile_pic_url || undefined,
                fanBadge: member.fan_badge || undefined, fanPoints: member.fan_points || 0,
                favouriteMoment: member.favourite_moment || undefined, contributions: {},
              };
              setUser(m);
              localStorage.setItem("suncity_user", JSON.stringify(m));
            }
          });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
          id: m.id, name: m.name, role: m.role,
          position: m.position || undefined, squadNumber: m.squad_number || undefined,
          profilePic: m.profile_pic_url || undefined,
          fanBadge: m.fan_badge || undefined, fanPoints: m.fan_points || 0,
          favouriteMoment: m.favourite_moment || undefined, contributions: {},
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

  const loginWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" },
    });
  }, []);

  const linkGoogleAccount = useCallback(async (memberId: string): Promise<{ success: boolean; error?: string }> => {
    if (!googleUserId) return { success: false, error: "No Google account detected." };

    // Try to find the member
    const { data: member } = await supabase
      .from("members")
      .select("id, name, role, position, squad_number, profile_pic_url, fan_badge, fan_points, favourite_moment")
      .eq("id", memberId.toUpperCase().trim())
      .single();

    if (!member) return { success: false, error: "Member ID not found." };

    // Link google_id to this member
    await supabase.from("members").update({ google_id: googleUserId } as any).eq("id", member.id);

    const m: TeamMember = {
      id: member.id, name: member.name, role: member.role,
      position: member.position || undefined, squadNumber: member.squad_number || undefined,
      profilePic: member.profile_pic_url || undefined,
      fanBadge: member.fan_badge || undefined, fanPoints: member.fan_points || 0,
      favouriteMoment: member.favourite_moment || undefined, contributions: {},
    };
    setUser(m);
    localStorage.setItem("suncity_user", JSON.stringify(m));
    setIsLinking(false);
    return { success: true };
  }, [googleUserId]);

  const logout = useCallback(() => {
    setUser(null);
    setIsLinking(false);
    setGoogleEmail(null);
    setGoogleUserId(null);
    localStorage.removeItem("suncity_user");
    supabase.auth.signOut();
  }, []);

  const isOfficial = user?.role === "coach" || user?.role === "finance" || user?.role === "manager" || user?.role === "captain" || user?.role === "assistant_coach";
  const isGuest = !user && !isLinking;

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, linkGoogleAccount, logout, isOfficial, isGuest, isLinking, setIsLinking, googleEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
