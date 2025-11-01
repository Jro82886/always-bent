/**
 * Memberstack to Supabase Auth Sync Endpoint
 *
 * Creates or updates a Supabase auth session for a Memberstack user.
 * This allows Memberstack-authenticated users to access Supabase-protected resources.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

// Generate a deterministic password for Supabase user based on Memberstack ID
function generatePassword(userId: string): string {
  // Use environment secret + userId to create a deterministic password
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createHash('sha256').update(`${secret}:${userId}`).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing userId or email' },
        { status: 400 }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Generate deterministic password based on email (not Memberstack ID)
    // This ensures consistency across sessions
    const password = generatePassword(email);

    // Check if user exists by email (not by ID, since Memberstack IDs aren't UUIDs)
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return NextResponse.json(
        { error: 'Failed to check existing users' },
        { status: 500 }
      );
    }

    const existingUser = existingUsers.users.find(u => u.email === email);

    if (!existingUser) {
      // Create new Supabase auth user with auto-generated UUID
      // Store Memberstack ID in metadata for reference
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          source: 'memberstack',
          memberstack_id: userId,
          synced_at: new Date().toISOString()
        }
      });

      if (createError) {
        console.error('Error creating Supabase user:', createError);
        return NextResponse.json(
          { error: 'Failed to create Supabase user', details: createError.message },
          { status: 500 }
        );
      }

      console.log(`Created new Supabase user for ${email} (Memberstack ID: ${userId})`);
    } else {
      // User exists, update metadata with latest Memberstack ID if needed
      if (existingUser.user_metadata?.memberstack_id !== userId) {
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          user_metadata: {
            ...existingUser.user_metadata,
            memberstack_id: userId,
            synced_at: new Date().toISOString()
          }
        });
        console.log(`Updated Memberstack ID for existing user ${email}`);
      }
    }

    // Return success - client will use password to sign in
    return NextResponse.json({
      success: true,
      credentials: {
        email: email,
        password: password
      }
    });

  } catch (error: any) {
    console.error('Memberstack sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
