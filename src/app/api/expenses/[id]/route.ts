import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Expense from '@/models/Expense';
import { getUserFromSession } from '@/lib/auth';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const deleted = await Expense.deleteOne({ _id: id, userId: session.userId });
    if (!deleted.deletedCount) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
