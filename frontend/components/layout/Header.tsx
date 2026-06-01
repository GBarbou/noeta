// components/layout/Header.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Button from '../ui/Button';

interface HeaderProps {
  variant?: 'landing' | 'app';
  documentCount?: number;
}

export default function Header({ variant = 'app', documentCount = 0 }: HeaderProps) {
  // Landing page header - minimal, mix-blend-mode
  if (variant === 'landing') {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-10 py-5 flex justify-between items-center mix-blend-difference">
        <Link href="/" className="font-display text-2xl text-[#F5F0E1] tracking-[0.1em]">
          PROOFREAD AI
        </Link>
        <Link
          href="/login"
          className="text-[11px] uppercase tracking-[0.2em] text-[#F5F0E1] border border-[#F5F0E1] px-5 py-2 hover:bg-[#F5F0E1] hover:text-[#1A1A1A] transition-colors"
        >
          Είσοδος
        </Link>
      </nav>
    );
  }

  // App header
  return (
    <header className="bg-[#D64933] border-b-4 border-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1A1A1A] border-2 border-[#F5F0E1] flex items-center justify-center">
            <span className="text-[#F5F0E1] text-xl">✓</span>
          </div>
          <Link href="/" className="font-display text-2xl text-[#F5F0E1] tracking-[0.05em]" style={{ textShadow: '2px 2px 0 #1A1A1A' }}>
            PROOFREAD AI
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-6">
          {documentCount > 0 && (
            <span className="text-sm text-[#F5F0E1]/90 uppercase tracking-wider">
              Έγγραφα: {documentCount}
            </span>
          )}
          <Button variant="dark" size="sm" href="/app">
            Νέο Έγγραφο
          </Button>
          <button className="text-[11px] uppercase tracking-[0.15em] text-[#F5F0E1] hover:opacity-80 transition-opacity">
            Αποσύνδεση
          </button>
        </nav>
      </div>
    </header>
  );
}

// Subheader for document info
interface SubheaderProps {
  filename?: string;
  correctionsCount?: number;
  acceptedCount?: number;
}

export function Subheader({ filename, correctionsCount = 0, acceptedCount = 0 }: SubheaderProps) {
  return (
    <div className="bg-[#1A1A1A] border-b-2 border-[#4A4A48]">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#F5F0E1]/60">
            Έγγραφο:
          </span>
          <span className="text-sm text-[#F5F0E1] font-semibold font-mono">
            {filename || 'Χωρίς τίτλο'}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#D64933]" />
            <span className="text-[10px] uppercase tracking-wider text-[#F5F0E1]">
              {correctionsCount} Διορθώσεις
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#4A8F4A]" />
            <span className="text-[10px] uppercase tracking-wider text-[#F5F0E1]">
              {acceptedCount} Αποδεκτές
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
