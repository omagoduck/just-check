import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdminClient } from '@/lib/supabase-client';
import { UserSettings, DEFAULT_USER_SETTINGS } from '@/types/settings';
import { userSettingsPostRatelimit, userSettingsGetRatelimit } from '@/lib/ratelimit';

function mergeUserSettings(
  existingSettings?: Partial<UserSettings>,
  incomingSettings?: Partial<UserSettings>
): UserSettings {
  return {
    ...DEFAULT_USER_SETTINGS,
    ...existingSettings,
    ...incomingSettings,
    privacySettings: {
      ...DEFAULT_USER_SETTINGS.privacySettings,
      ...existingSettings?.privacySettings,
      ...incomingSettings?.privacySettings,
    },
    aiCustomizationSettings: {
      ...DEFAULT_USER_SETTINGS.aiCustomizationSettings,
      ...existingSettings?.aiCustomizationSettings,
      ...incomingSettings?.aiCustomizationSettings,
    },
  };
}

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit check
    const { success } = await userSettingsGetRatelimit.limit(clerkUserId);
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Too many requests.' },
        { status: 429 }
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data: existingSettings, error: fetchError } = await supabase
      .from('user_settings')
      .select('settings_data')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (!existingSettings) {
      const { data: newSettings, error: insertError } = await supabase
        .from('user_settings')
        .insert({ clerk_user_id: clerkUserId, settings_data: DEFAULT_USER_SETTINGS })
        .select('settings_data')
        .single();

      if (insertError) throw insertError;

      return NextResponse.json({
        settings: DEFAULT_USER_SETTINGS
      });
    }

    const mergedSettings = mergeUserSettings(existingSettings.settings_data);

    return NextResponse.json({ settings: mergedSettings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit check
    const { success } = await userSettingsPostRatelimit.limit(clerkUserId);
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Too many requests.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Invalid settings data' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('settings_data')
      .eq('clerk_user_id', clerkUserId)
      .single();

    const mergedSettings = mergeUserSettings(existingSettings?.settings_data, settings);

    const { data, error } = await supabase
      .from('user_settings')
      .upsert(
        { clerk_user_id: clerkUserId, settings_data: mergedSettings },
        { onConflict: 'clerk_user_id' }
      )
      .select('settings_data')
      .single();

    if (error) throw error;

    return NextResponse.json({ settings: data.settings_data });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
