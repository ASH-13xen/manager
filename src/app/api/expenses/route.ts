import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Expense from '@/models/Expense';
import { getUserFromSession } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const expenses = await Expense.find({ userId: session.userId }).sort({ date: -1, createdAt: -1 });
    return NextResponse.json({ success: true, data: expenses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    
    if (!body.amount || !body.date || !body.type) {
        return NextResponse.json({ success: false, error: 'Amount, date, and type are required' }, { status: 400 });
    }

    const expense = await Expense.create({
      userId: session.userId,
      amount: Number(body.amount),
      date: new Date(body.date),
      type: body.type,
      description: body.description || ''
    });

    return NextResponse.json({ success: true, data: expense }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
