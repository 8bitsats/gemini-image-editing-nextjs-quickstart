import { NextRequest, NextResponse } from 'next/server';
import { supabase, getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const priority = formData.get('priority') as string;
    const url = formData.get('url') as string;
    const userWalletAddress = formData.get('userWalletAddress') as string;

    if (!title || !description || !category || !userWalletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Create or get user
    let { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('wallet_address', userWalletAddress)
      .single();

    if (userError && userError.code === 'PGRST116') {
      // User doesn't exist, create one
      const { data: newUser, error: createUserError } = await supabaseAdmin
        .from('users')
        .insert({
          wallet_address: userWalletAddress,
          username: `user_${userWalletAddress.slice(0, 8)}`,
        })
        .select('id')
        .single();

      if (createUserError) {
        console.error('Error creating user:', createUserError);
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }
      
      user = newUser;
    } else if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user' },
        { status: 500 }
      );
    }

    // Insert dev request
    const { data: devRequest, error: requestError } = await supabaseAdmin
      .from('dev_requests')
      .insert({
        user_id: user.id,
        user_wallet_address: userWalletAddress,
        title,
        description,
        category,
        priority,
        url: url || null,
        metadata: {},
      })
      .select()
      .single();

    if (requestError) {
      console.error('Error creating dev request:', requestError);
      return NextResponse.json(
        { error: 'Failed to create request' },
        { status: 500 }
      );
    }

    // Handle file uploads
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file_') && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length > 0) {
      // In a real implementation, you would upload files to a storage service
      // For now, we'll just save file metadata
      const filePromises = files.map(async (file) => {
        // Simulate file upload - in production, upload to Supabase Storage or similar
        const fileUrl = `placeholder_url_for_${file.name}`;
        
        return supabaseAdmin
          .from('dev_request_files')
          .insert({
            request_id: devRequest.id,
            file_name: file.name,
            file_url: fileUrl,
            file_type: file.type,
            file_size: file.size,
          });
      });

      await Promise.all(filePromises);
    }

    // TODO: Implement notification to admin wallet
    // This could be done via email, Discord webhook, or push notification

    return NextResponse.json({
      success: true,
      requestId: devRequest.id,
    });

  } catch (error) {
    console.error('Error in ask-the-dev API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Fetch user's requests
    const { data: requests, error } = await supabaseAdmin
      .from('dev_requests')
      .select(`
        *,
        dev_request_files (*),
        dev_responses (*)
      `)
      .eq('user_wallet_address', walletAddress)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({ requests });

  } catch (error) {
    console.error('Error in ask-the-dev GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}