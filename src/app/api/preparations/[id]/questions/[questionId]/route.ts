import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Preparation from '@/models/Preparation';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string, questionId: string }> }) {
  try {
    await dbConnect();
    const { id, questionId } = await params;
    const formData = await request.formData();
    
    const questionText = formData.get('questionText') as string;
    const tagsStr = formData.get('tags') as string;
    const answerText = formData.get('answerText') as string;
    const file = formData.get('file') as File | null;
    
    const preparation = await Preparation.findById(id);
    if (!preparation) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const question = preparation.questions.id(questionId);
    if (!question) return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 });

    if (questionText) question.questionText = questionText;
    if (tagsStr) {
      try { question.tags = JSON.parse(tagsStr); } catch (e) {}
    }
    if (answerText !== null) question.answerText = answerText;

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadDir = join(process.cwd(), 'public/uploads');
      try { await mkdir(uploadDir, { recursive: true }); } catch (e) {}
      
      const safeFileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      const filePath = join(uploadDir, safeFileName);
      await writeFile(filePath, buffer);
      
      question.answerFileName = file.name;
      question.answerFileUrl = `/uploads/${safeFileName}`;
    }

    await preparation.save();
    return NextResponse.json({ success: true, data: preparation });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string, questionId: string }> }) {
  try {
    await dbConnect();
    const { id, questionId } = await params;
    const preparation = await Preparation.findById(id);
    if (!preparation) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    preparation.questions.pull({ _id: questionId });
    await preparation.save();

    return NextResponse.json({ success: true, data: preparation });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
