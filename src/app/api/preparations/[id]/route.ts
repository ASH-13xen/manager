import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Preparation from '@/models/Preparation';
import { ITopic } from '@/models/Preparation';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const preparation = await Preparation.findById(id);
    if (!preparation) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: preparation });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const preparation = await Preparation.findById(id);
    if (!preparation) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    if (body.action === 'mark_completed') {
      const topic = preparation.roadmap.find((t: any) => t._id.toString() === body.topicId);
      if (topic) {
        topic.isCompleted = true;
        topic.completedAt = new Date();
      }
    } else if (body.action === 'update_roadmap') {
      // Body.roadmap is assumed to be the new ordered array of topics
      // We map over it to ensure we don't accidentally lose existing logs/ids if they exist
      const newRoadmap = body.roadmap.map((clientTopic: any) => {
        if (clientTopic._id) {
          // Existing topic
          const existing = preparation.roadmap.find((t: any) => t._id.toString() === clientTopic._id);
          if (existing) {
            existing.title = clientTopic.title;
            return existing;
          }
        }
        // New topic
        return {
          title: clientTopic.title,
          isCompleted: false,
          createdAt: new Date(),
          logs: []
        };
      });
      preparation.roadmap = newRoadmap;
    }

    await preparation.save();
    return NextResponse.json({ success: true, data: preparation });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const del = await Preparation.deleteOne({ _id: id });
    if (!del.deletedCount) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
