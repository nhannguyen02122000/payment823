'use client';

import { useState } from 'react';
import SummarizeModal from '@/components/summarize-modal';

export default function SummaryPage() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      <h1
        className="text-2xl font-normal text-text-primary mb-6"
        style={{ fontFamily: 'var(--font-instrument-serif)' }}
      >
        Summary
      </h1>
      <SummarizeModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
