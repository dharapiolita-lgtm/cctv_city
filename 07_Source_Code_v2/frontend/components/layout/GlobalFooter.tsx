'use client';

import React from 'react';
import Image from 'next/image';

export default function GlobalFooter() {
  return (
    <footer className="w-full bg-white border-t border-slate-200 py-4 px-6 text-slate-600 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs md:text-sm">
        {/* Logos Container */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-teal-800 flex items-center justify-center text-white font-bold text-[10px] shadow-sm">
              PEMDA
            </div>
            <span className="font-semibold text-slate-700 hidden sm:inline">Pemerintah Daerah</span>
          </div>

          <div className="h-4 w-px bg-slate-300" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-red-800 flex items-center justify-center text-white font-bold text-[10px] shadow-sm">
              UTI
            </div>
            <span className="font-semibold text-slate-700 hidden sm:inline">Universitas Teknokrat Indonesia</span>
          </div>
        </div>

        {/* Copyright Text (Mandatory) */}
        <div className="text-center md:text-right font-medium text-slate-500">
          Copyright©2026 by Dhara Piolita dan Dr. Erliyan Redy Susanto, M.Kom.
        </div>
      </div>
    </footer>
  );
}

