import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import { getUserFromSession } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const project = await Project.findOne({ _id: id, userId: session.userId });
    if (!project) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: project });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    
    const project = await Project.findOne({ _id: id, userId: session.userId });
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
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const deletedProject = await Project.deleteOne({ _id: id, userId: session.userId });
    if (!deletedProject.deletedCount) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
