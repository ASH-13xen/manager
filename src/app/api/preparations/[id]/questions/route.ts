import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Preparation from '@/models/Preparation';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const formData = await request.formData();
    
    const questionText = formData.get('questionText') as string;
    const tagsStr = formData.get('tags') as string; // JSON string of array
    const answerText = formData.get('answerText') as string;
    const file = formData.get('file') as File | null;
    
    if (!questionText) {
      return NextResponse.json({ success: false, error: 'Question text is required' }, { status: 400 });
    }

    let tags: string[] = [];
    try { tags = JSON.parse(tagsStr || "[]"); } catch (e) {}

    let answerFileUrl = '';
    let answerFileName = '';

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadDir = join(process.cwd(), 'public/uploads');
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (e) {}
      
      answerFileName = file.name;
      const safeFileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      const filePath = join(uploadDir, safeFileName);
      await writeFile(filePath, buffer);
      answerFileUrl = `/uploads/${safeFileName}`;
    }

    const preparation = await Preparation.findById(id);
    if (!preparation) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    if (!preparation.questions) preparation.questions = [];

    preparation.questions.push({
      questionText,
      tags,
      answerText: answerText || "",
      answerFileUrl,
      answerFileName,
      createdAt: new Date()
    });

    await preparation.save();
    return NextResponse.json({ success: true, data: preparation });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
