import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Preparation from '@/models/Preparation';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getUserFromSession } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string, topicId: string }> }) {
  try {
    await dbConnect();
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id, topicId } = await params;
    const formData = await request.formData();
    
    const text = formData.get('text') as string;
    const file = formData.get('file') as File | null;
    
    if (!text) {
      return NextResponse.json({ success: false, error: 'Missing required text' }, { status: 400 });
    }

    let fileUrl = '';
    let fileName = '';

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const uploadDir = join(process.cwd(), 'public/uploads');
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (e) {
        // ignore if exists
      }
      
      fileName = file.name;
      const safeFileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      const filePath = join(uploadDir, safeFileName);
      await writeFile(filePath, buffer);
      
      fileUrl = `/uploads/${safeFileName}`;
    }

    const preparation = await Preparation.findOne({ _id: id, userId: session.userId });
    if (!preparation) return NextResponse.json({ success: false, error: 'Subject not found' }, { status: 404 });

    const topic = preparation.roadmap.find((t: any) => t._id.toString() === topicId);
    if (!topic) return NextResponse.json({ success: false, error: 'Topic not found' }, { status: 404 });

    if (!topic.logs) topic.logs = [];

    topic.logs.push({
      text,
      fileUrl,
      fileName,
      createdAt: new Date()
    });

    await preparation.save();

    return NextResponse.json({ success: true, data: preparation });
  } catch (error: any) {
    console.error('Error adding log:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
