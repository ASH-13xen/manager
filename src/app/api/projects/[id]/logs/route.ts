import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const formData = await request.formData();
    
    const versionId = formData.get('versionId') as string;
    const text = formData.get('text') as string;
    const file = formData.get('file') as File | null;
    
    if (!versionId || !text) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
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

    const project = await Project.findById(id);
    if (!project) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });

    const version = project.versions.find((v: any) => v._id.toString() === versionId);
    if (!version) return NextResponse.json({ success: false, error: 'Version not found' }, { status: 404 });

    // Ensure backwards compatibility with older versions that might not have a logs array
    if (!version.logs) version.logs = [];

    version.logs.push({
      text,
      fileUrl,
      fileName,
      createdAt: new Date()
    });

    await project.save();

    return NextResponse.json({ success: true, data: project });
  } catch (error: any) {
    console.error('Error adding log:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
