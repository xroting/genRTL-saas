import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

// CORS headers for VS Code extension
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// In-memory store for temporary login sessions
// In production, use Redis or a database
const loginSessions = new Map<string, { token: string; user: any; timestamp: number }>();

// Clean up old sessions (older than 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of loginSessions.entries()) {
    if (now - session.timestamp > 10 * 60 * 1000) {
      loginSessions.delete(sessionId);
    }
  }
}, 60000); // Clean every minute

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, token, user } = await req.json();

    if (!sessionId || !token || !user) {
      return NextResponse.json(
        { error: "Missing required fields" }, 
        { status: 400, headers: corsHeaders }
      );
    }

    // Store the session
    loginSessions.set(sessionId, {
      token,
      user,
      timestamp: Date.now()
    });

    console.log("[LoginSession] Stored session:", sessionId);

    return NextResponse.json(
      { success: true },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[LoginSession] Store error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId" }, 
        { status: 400, headers: corsHeaders }
      );
    }

    const session = loginSessions.get(sessionId);

    if (!session) {
      return NextResponse.json(
        { authenticated: false },
        { headers: corsHeaders }
      );
    }

    // Delete the session after retrieving (one-time use)
    loginSessions.delete(sessionId);
    console.log("[LoginSession] Retrieved and deleted session:", sessionId);

    // Get user's team plan from Supabase
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser(session.token);

    if (authError || !user) {
      console.error("[LoginSession] Failed to get user:", authError);
      return NextResponse.json(
        {
          authenticated: true,
          token: session.token,
          user: session.user  // Fallback to session user
        },
        { headers: corsHeaders }
      );
    }

    // Query user's team plan (using correct field names: plan_name and subscription_status)
    const { data: teamData, error: teamError } = await supabase
      .from('team_members')
      .select(`
        teams (
          plan_name,
          subscription_status
        )
      `)
      .eq('user_id', user.id)
      .single();

    let plan = 'Free';  // Default plan
    if (!teamError && teamData && teamData.teams) {
      const team = teamData.teams as { plan_name?: string; subscription_status?: string };
      
      if (team.subscription_status === 'active' && team.plan_name) {
        // Convert database plan name to display name
        const planMap: Record<string, string> = {
          'free': 'Free',
          'hobby': 'Free',
          'basic': 'Basic',
          'plus': 'Plus',
          'ultra_plus': 'Ultra Plus',
        };
        const dbPlan = team.plan_name.toLowerCase();
        plan = planMap[dbPlan] || 'Free';
      }
    }

    // Return user with plan
    const userWithPlan = {
      ...session.user,
      plan,
    };

    return NextResponse.json(
      {
        authenticated: true,
        token: session.token,
        user: userWithPlan
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[LoginSession] Retrieve error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500, headers: corsHeaders }
    );
  }
}

