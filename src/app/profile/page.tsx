'use client';

import UserAvatarMenu from '@/components/user-avatar-menu';

export default function ProfilePage() {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      <h1
        className="text-2xl font-normal text-text-primary mb-6"
        style={{ fontFamily: 'var(--font-instrument-serif)' }}
      >
        Profile
      </h1>
      <div className="bg-bg-card border border-border rounded-xl p-5">
        <UserAvatarMenu />
      </div>
    </div>
  );
}
