import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase Admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Verify Squarespace token
 * In production, this would verify the token with Squarespace's API
 */
async function verifySquarespaceToken(email: string, token: string): Promise<boolean> {
  // For development/demo: accept any token that matches a pattern
  // In production: Call Squarespace API to verify the token
  
  if (process.env.NODE_ENV === 'development') {
    // Accept any non-empty token in development
    return token.length > 0;
  }
  
  // Production verification would look like:
  // const response = await fetch('https://api.squarespace.com/verify-token', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.SQUARESPACE_API_KEY}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({ email, token })
  // });
  // return response.ok;
  
  // For now, validate token format (should be replaced with actual Squarespace verification)
  return token.length >= 32;
}

export async function POST(req: NextRequest) {
  try {
    const { email, token } = await req.json();
    
    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email and token are required' },
        { status: 400 }
      );
    }
    
    // Verify the Squarespace token
    const isValid = await verifySquarespaceToken(email, token);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid Squarespace credentials' },
        { status: 401 }
      );
    }
    
    // Check if user exists in Supabase
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();
    
    let userId: string;
    
    if (existingUser) {
      // User exists
      userId = existingUser.id;
    } else {
      // Create new user via Supabase Admin API
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          source: 'squarespace',
          synced_at: new Date().toISOString()
        }
      });
      
      if (createError || !newUser.user) {
        console.error('Error creating user:', createError);
        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        );
      }
      
      userId = newUser.user.id;
      
      // Create profile entry
      await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email,
          created_at: new Date().toISOString()
        });
    }
    
    // Generate a session for the user
    const { data: session, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/legendary/welcome`
      }
    });
    
    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }
    
    // Create a custom session token
    const { data: { session: userSession }, error: signInError } = await supabaseAdmin.auth.admin.createSession({
      userId
    });
    
    if (signInError || !userSession) {
      console.error('Sign in error:', signInError);
      return NextResponse.json(
        { error: 'Failed to sign in user' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      session: userSession,
      user: {
        id: userId,
        email
      }
    });
    
  } catch (error) {
    console.error('Squarespace auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
