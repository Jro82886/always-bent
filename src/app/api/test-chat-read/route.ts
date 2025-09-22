import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inlet_id = searchParams.get('inlet_id');
    
    if (!inlet_id) {
      return NextResponse.json(
        { error: 'inlet_id is required' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('inlet_id', inlet_id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Read error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
