import { verifyWebhook, WebhookEvent } from '@clerk/nextjs/webhooks';
import { NextRequest } from 'next/server';
import { upsertUser, deleteUserByClerkId } from '@/lib/instant-api';

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
      await upsertUser(data.id, data);
    } else if (evt.type === 'user.deleted') {
      const data = evt.data as { id: string };
      await deleteUserByClerkId(data.id);
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    return new Response('Processing failed', { status: 500 });
  }

  return new Response('OK', { status: 200 });
}
