import { verifyWebhook, WebhookEvent } from '@clerk/nextjs/webhooks';
import { NextRequest } from 'next/server';
import db from '@/lib/instant-db';

export async function POST(req: NextRequest) {
  let evt: WebhookEvent;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response('Verification failed', { status: 400 });
  }

  try {
    if (evt.type === 'user.created' || evt.type === 'user.updated') {
      const data = evt.data as { id: string; first_name: string | null; last_name: string | null; image_url: string | null; created_at?: number };
      const clerkId = data.id;
      const username = [data.first_name, data.last_name].filter(Boolean).join(' ') || 'Unknown';

      await db.transact(
        db.tx.$users[clerkId].update({
          clerk_id: clerkId,
          username,
          avatar_url: data.image_url ?? '',
          created_at: data.created_at ?? Date.now(),
        })
      );
    } else if (evt.type === 'user.deleted') {
      const data = evt.data as { id: string };
      await db.transact(db.tx.$users[data.id].delete());
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    return new Response('Processing failed', { status: 500 });
  }

  return new Response('OK', { status: 200 });
}