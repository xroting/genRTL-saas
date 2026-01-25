// Dashboard Sessions API - 管理用户活跃会话
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer, createSupabaseServiceRole } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 获取用户的活跃会话
    // 注意：Supabase 没有直接暴露会话管理 API，这里我们使用自定义的 sessions 表
    // 如果没有 sessions 表，我们返回模拟数据
    const serviceSupabase = createSupabaseServiceRole();
    
    let sessions = [];
    
    try {
      const { data: sessionsData, error: sessionsError } = await serviceSupabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!sessionsError && sessionsData) {
        sessions = sessionsData;
      }
    } catch (e) {
      // 如果表不存在，返回当前会话的模拟数据
      console.log('Sessions table not found, returning mock data');
    }

    // 如果没有会话数据，返回当前会话作为示例
    if (sessions.length === 0) {
      const now = new Date();
      sessions = [
        {
          id: 'current-web',
          type: 'web',
          created_at: now.toISOString(),
          last_active: now.toISOString()
        }
      ];
    }

    return NextResponse.json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error('[Sessions API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

