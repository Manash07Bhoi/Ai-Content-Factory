import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Star, MessageSquare } from 'lucide-react';

export default function ProductReviews({ productId }: { productId: string }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const res = await api.get(`/reviews/${productId}`);
      return res.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: { rating: number; comment: string }) => {
      await api.post(`/reviews/${productId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      setRating(5);
      setComment('');
      setErrorMsg('');
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to submit review. Have you purchased this product?');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reviewMutation.mutate({ rating, comment });
  };

  if (isLoading) return <div className="p-4">Loading reviews...</div>;

  const items = reviews?.data || [];

  return (
    <div className="mt-12 bg-gray-50 p-6 rounded-lg border border-gray-200">
      <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <MessageSquare className="w-6 h-6" /> Customer Reviews ({items.length})
      </h3>

      <div className="mb-8">
        <h4 className="font-semibold text-lg mb-2">Write a Review</h4>
        {errorMsg && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{errorMsg}</div>}
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className={`p-1 focus:outline-none ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  <Star className="w-6 h-6 fill-current" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comment (Optional)</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you think of this product?"
            />
          </div>
          <button
            type="submit"
            disabled={reviewMutation.isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>

      <div className="space-y-6">
        {items.length === 0 ? (
          <p className="text-gray-500 italic">No reviews yet. Be the first to review this product!</p>
        ) : (
          items.map((review: any) => (
            <div key={review.id} className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold">{review.user.email.split('@')[0]}</div>
                  <div className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                  ))}
                </div>
              </div>
              {review.comment && <p className="text-gray-700 mt-2">{review.comment}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
