// Dashboard Settings API - 管理用户设置
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

    // 获取用户设置
    const serviceSupabase = createSupabaseServiceRole();
    const { data: settings, error: settingsError } = await serviceSupabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Failed to fetch settings:', settingsError);
    }

    // 返回设置（如果不存在则返回默认值）
    return NextResponse.json({
      success: true,
      share_data: settings?.share_data ?? true,
      email_notifications: settings?.email_notifications ?? true,
      marketing_emails: settings?.marketing_emails ?? false
    });
  } catch (error) {
    console.error('[Settings API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { share_data, email_notifications, marketing_emails } = body;

    // 使用 Service Role 更新设置
    const serviceSupabase = createSupabaseServiceRole();
    
    const updateData: any = {
      user_id: user.id,
      updated_at: new Date().toISOString()
    };

    if (share_data !== undefined) updateData.share_data = share_data;
    if (email_notifications !== undefined) updateData.email_notifications = email_notifications;
    if (marketing_emails !== undefined) updateData.marketing_emails = marketing_emails;

    const { error: updateError } = await serviceSupabase
      .from('user_settings')
      .upsert(updateData, { onConflict: 'user_id' });

    if (updateError) {
      console.error('Failed to update settings:', updateError);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('[Settings API PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

