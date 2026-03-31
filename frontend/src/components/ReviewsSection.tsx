'use client';

import { useEffect, useState } from 'react';
import { getPropertyReviews } from '@/lib/api';
import { Review } from '@/lib/types';

interface ReviewsSectionProps {
  slug: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsSection({ slug }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPropertyReviews(slug)
      .then((res) => setReviews(res.data || []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900">Guest Reviews</h2>
        <div className="mt-4 animate-pulse space-y-4">
          <div className="h-24 rounded-xl bg-gray-100" />
          <div className="h-24 rounded-xl bg-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-gray-900">
        Guest Reviews
        {reviews.length > 0 && (
          <span className="ml-2 text-base font-normal text-gray-500">
            ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
          </span>
        )}
      </h2>

      {reviews.length === 0 ? (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-500">
          <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
          <p className="mt-2 text-sm">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-gray-200 bg-white p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {review.user_avatar ? (
                    <img
                      src={review.user_avatar}
                      alt={review.user_name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-semibold">
                      {review.user_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{review.user_name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <StarRating rating={review.overall_rating} />
              </div>

              {review.title && (
                <p className="mt-3 font-medium text-gray-900">{review.title}</p>
              )}
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                {review.comment}
              </p>

              {review.owner_response && (
                <div className="mt-3 rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-semibold text-gray-500">Owner Response</p>
                  <p className="mt-1 text-sm text-gray-600">{review.owner_response}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
