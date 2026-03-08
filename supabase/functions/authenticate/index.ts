import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { memberId, pin } = await req.json();

    if (!memberId || typeof memberId !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Member ID is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const upperId = memberId.toUpperCase().trim();

    // Players (SCF-P prefix) don't need a PIN
    if (upperId.includes("P")) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceKey);

      const { data: member } = await supabase
        .from("members")
        .select("id, name, role, position, squad_number, profile_pic_url")
        .eq("id", upperId)
        .single();

      if (member && member.role === "player") {
        return new Response(
          JSON.stringify({ success: true, member }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ success: false, error: "Invalid Player ID." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fan login (SCF-F prefix) — no PIN needed
    if (upperId.startsWith("SCF-F")) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceKey);

      const { data: member } = await supabase
        .from("members")
        .select("id, name, role, profile_pic_url, fan_badge, fan_points, favourite_moment")
        .eq("id", upperId)
        .single();

      if (member && member.role === "fan") {
        return new Response(
          JSON.stringify({ success: true, member }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ success: false, error: "Invalid Fan ID." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Official login — requires PIN
    if (!pin || typeof pin !== "string" || pin.length !== 4) {
      return new Response(
        JSON.stringify({ success: false, error: "A 4-digit PIN is required for officials." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Check by ID + PIN
    const { data: official } = await supabase
      .from("members")
      .select("id, name, role, position, squad_number, profile_pic_url, username")
      .eq("id", upperId)
      .eq("pin", pin)
      .single();

    if (official) {
      return new Response(
        JSON.stringify({ success: true, member: official }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Also try matching by username
    const { data: officialByUsername } = await supabase
      .from("members")
      .select("id, name, role, position, squad_number, profile_pic_url, username")
      .eq("username", upperId)
      .eq("pin", pin)
      .single();

    if (officialByUsername) {
      return new Response(
        JSON.stringify({ success: true, member: officialByUsername }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid credentials. Check your ID or PIN." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: "Authentication failed." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
