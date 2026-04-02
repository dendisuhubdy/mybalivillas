'use client';

import { useEffect, useState } from 'react';
import { getReviews, approveReview, flagReview, deleteReview } from '@/lib/api';
import { AdminReview } from '@/lib/types';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'flagged'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const params: { page: number; per_page: number; is_approved?: boolean } = {
        page,
        per_page: 20,
      };
      if (filter === 'pending') params.is_approved = false;
      if (filter === 'approved') params.is_approved = true;

      const res = await getReviews(params);
      let data = res.items || [];
      if (filter === 'flagged') {
        data = data.filter((r) => r.is_flagged);
      }
      setReviews(data);
      setTotalPages(res.total_pages || 0);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReviews(); }, [page, filter]);

  const handleApprove = async (id: string) => {
    try {
      const updated = await approveReview(id);
      setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch {
      alert('Failed to approve review');
    }
  };

  const handleFlag = async (id: string) => {
    try {
      const updated = await flagReview(id);
      setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch {
      alert('Failed to flag review');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return;
    try {
      await deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert('Failed to delete review');
    }
  };

  const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="mt-1 text-sm text-gray-500">Moderate guest reviews</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'flagged'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-lg bg-white border border-gray-200 p-8 text-center text-gray-500">
          No reviews found
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-500 text-sm">{stars(review.overall_rating)}</span>
                    {review.is_approved ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Approved</span>
                    ) : (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">Pending</span>
                    )}
                    {review.is_flagged && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Flagged</span>
                    )}
                  </div>
                  {review.title && (
                    <p className="mt-2 font-medium text-gray-900">{review.title}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-600">{review.comment}</p>
                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(review.created_at).toLocaleDateString()} | User: {review.user_id.slice(0, 8)}... | Property: {review.property_id.slice(0, 8)}...
                  </p>
                </div>
                <div className="flex gap-1 ml-4">
                  {!review.is_approved && (
                    <button
                      onClick={() => handleApprove(review.id)}
                      className="rounded px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100"
                    >
                      Approve
                    </button>
                  )}
                  {!review.is_flagged && (
                    <button
                      onClick={() => handleFlag(review.id)}
                      className="rounded px-2.5 py-1 text-xs font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
                    >
                      Flag
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="rounded px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded px-3 py-1 text-sm border disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-sm">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="rounded px-3 py-1 text-sm border disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
