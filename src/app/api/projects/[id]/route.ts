import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const project = await Project.findById(id);
    if (!project) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: project });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    
    const project = await Project.findById(id);
    if (!project) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    if (body.action === 'mark_completed') {
      const version = project.versions.find((v: any) => v._id.toString() === body.versionId);
      if (version) {
        version.isCompleted = true;
        version.completedAt = new Date();
      }
    } else if (body.action === 'new_version') {
      project.versions.push({
        version: body.newVersionName,
        isCompleted: false,
        createdAt: new Date()
      });
    } else {
      if (body.title) project.title = body.title;
      if (body.description !== undefined) project.description = body.description;
      if (body.type) project.type = body.type;
    }

    await project.save();
    return NextResponse.json({ success: true, data: project });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const deletedProject = await Project.deleteOne({ _id: id });
    if (!deletedProject.deletedCount) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
