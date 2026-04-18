import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Preparation from '@/models/Preparation';
import { getUserFromSession } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const preparations = await Preparation.find({ userId: session.userId }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: preparations });
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
    
    // Expect body: { title, type, roadmap: string[] }
    const roadmapData = (body.roadmap || []).map((topicTitle: string) => ({
      title: topicTitle,
      isCompleted: false,
      createdAt: new Date(),
      logs: []
    }));

    const preparation = await Preparation.create({
      userId: session.userId,
      title: body.title,
      type: body.type,
      roadmap: roadmapData
    });

    return NextResponse.json({ success: true, data: preparation }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating preparation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
