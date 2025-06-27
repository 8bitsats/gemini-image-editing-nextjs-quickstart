import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

const ADMIN_WALLET = 'BSg4ZyMunJKr585bUQTwQpigX4Em8iiCqVSHMxnZVz1u';

function isAdminWallet(walletAddress: string): boolean {
  return walletAddress === ADMIN_WALLET;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminWallet = searchParams.get('admin_wallet');

    if (!adminWallet || !isAdminWallet(adminWallet)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Fetch all requests with files and responses
    const { data: requests, error } = await supabaseAdmin
      .from('dev_requests')
      .select(`
        *,
        dev_request_files (*),
        dev_responses (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({ requests });

  } catch (error) {
    console.error('Error in admin GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminWallet, requestId, responseText, updateStatus } = body;

    if (!adminWallet || !isAdminWallet(adminWallet)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!requestId || !responseText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Create admin response
    const { data: response, error: responseError } = await supabaseAdmin
      .from('dev_responses')
      .insert({
        request_id: requestId,
        admin_wallet_address: adminWallet,
        response_text: responseText,
        is_admin: true,
      })
      .select()
      .single();

    if (responseError) {
      console.error('Error creating admin response:', responseError);
      return NextResponse.json(
        { error: 'Failed to create response' },
        { status: 500 }
      );
    }

    // Update request status if provided
    if (updateStatus) {
      const { error: updateError } = await supabaseAdmin
        .from('dev_requests')
        .update({ status: updateStatus })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating request status:', updateError);
        // Don't fail the entire request if status update fails
      }
    }

    return NextResponse.json({
      success: true,
      responseId: response.id,
    });

  } catch (error) {
    console.error('Error in admin POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminWallet, requestId, status } = body;

    if (!adminWallet || !isAdminWallet(adminWallet)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!requestId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Update request status
    const { error } = await supabaseAdmin
      .from('dev_requests')
      .update({ status })
      .eq('id', requestId);

    if (error) {
      console.error('Error updating request status:', error);
      return NextResponse.json(
        { error: 'Failed to update status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in admin PATCH API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}