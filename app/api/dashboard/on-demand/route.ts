// Dashboard On-Demand API - 管理 On-Demand 使用设置
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer, createSupabaseServiceRole } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request: enabled must be a boolean' },
        { status: 400 }
      );
    }

    // 获取用户的团队
    const serviceSupabase = createSupabaseServiceRole();
    const { data: teamMember, error: memberError } = await serviceSupabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .single();

    if (memberError || !teamMember) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // 更新团队的 on_demand_enabled 设置
    const { error: updateError } = await serviceSupabase
      .from('teams')
      .update({
        on_demand_enabled: enabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', teamMember.team_id);

    if (updateError) {
      console.error('Failed to update on-demand setting:', updateError);
      return NextResponse.json(
        { error: 'Failed to update setting' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      on_demand_enabled: enabled
    });
  } catch (error) {
    console.error('[On-Demand API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

