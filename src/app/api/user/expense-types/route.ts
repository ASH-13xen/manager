import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getUserFromSession } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const user = await User.findById(session.userId);
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: user.expenseTypes || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    if (!Array.isArray(body.expenseTypes)) {
       return NextResponse.json({ success: false, error: 'expenseTypes array required' }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(
      session.userId, 
      { expenseTypes: body.expenseTypes },
      { new: true }
    );
    
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: user.expenseTypes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
