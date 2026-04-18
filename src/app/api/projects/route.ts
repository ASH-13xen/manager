import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    await dbConnect();
    const projects = await Project.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: projects });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const formData = await request.formData();
    
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as string;
    const initialVersion = formData.get('initialVersion') as string || '1.0';
    const file = formData.get('image') as File | null;
    
    let imageUrl = '';

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const uploadDir = join(process.cwd(), 'public/uploads');
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (e) {
        // ignore if exists
      }
      
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      const filePath = join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      
      imageUrl = `/uploads/${fileName}`;
    }

    const project = await Project.create({
      title,
      description,
      type,
      imageUrl,
      versions: [
        {
          version: initialVersion,
          isCompleted: false,
          createdAt: new Date()
        }
      ]
    });

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
