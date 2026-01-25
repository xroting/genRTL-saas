// Dashboard Session Revoke API - 撤销特定会话
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer, createSupabaseServiceRole } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 使用 Service Role 删除会话
    const serviceSupabase = createSupabaseServiceRole();
    
    try {
      const { error: deleteError } = await serviceSupabase
        .from('user_sessions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Failed to revoke session:', deleteError);
      }
    } catch (e) {
      // 如果表不存在，忽略错误
      console.log('Sessions table not found');
    }

    return NextResponse.json({
      success: true,
      message: 'Session revoked'
    });
  } catch (error) {
    console.error('[Session Revoke API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

