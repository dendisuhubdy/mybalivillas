'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { classNames } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-admin-border">
      <div className="text-sm text-slate-500">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={classNames(
            'p-2 rounded-lg text-sm transition-colors',
            currentPage <= 1
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-100'
          )}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        {pages.map((page, idx) =>
          typeof page === 'string' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={classNames(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                page === currentPage
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={classNames(
            'p-2 rounded-lg text-sm transition-colors',
            currentPage >= totalPages
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-100'
          )}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
