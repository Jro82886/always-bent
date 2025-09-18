import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { feedback, type, user_id, captain_name, boat_name } = await request.json();
    
    // Log the feedback with user info
    console.log(`[BETA FEEDBACK] ${new Date().toISOString()}:`, {
      feedback,
      type,
      user: { user_id, captain_name, boat_name }
    });
    
    // Later you can:
    // 1. Send email to yourself
    // 2. Store in Supabase
    // 3. Send to Discord/Slack webhook
    
    // For now, just acknowledge receipt
    return NextResponse.json({ 
      success: true, 
      message: 'Feedback received' 
    });
    
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
