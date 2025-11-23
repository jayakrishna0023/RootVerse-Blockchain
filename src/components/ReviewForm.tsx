import { useState } from 'react';
import toast from 'react-hot-toast';

interface ReviewFormProps {
  fisherId: string;
  onNewReview?: (rev: StoredReview[]) => void;
}

interface StoredReview {
  rating: number;
  text: string;
  title?: string;
  created_at: string;
}

export default function ReviewForm({ fisherId, onNewReview }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const storageKey = `fisher_reviews:${fisherId}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) { toast.error('Enter a review message'); return; }
    setSubmitting(true);
    try {
      const entry: StoredReview = { rating, text: text.trim(), title: title.trim() || undefined, created_at: new Date().toISOString() };
      const prevRaw = localStorage.getItem(storageKey);
      const list: StoredReview[] = prevRaw ? JSON.parse(prevRaw) : [];
      list.unshift(entry);
      localStorage.setItem(storageKey, JSON.stringify(list));
      setText(''); setTitle(''); setRating(5);
      toast.success('Review added');
      onNewReview?.(list);
    } catch {
      toast.error('Failed to save review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Submit review for fisher">
      <div>
        <label className="block text-sm font-bold text-blue-900 mb-1">Rating</label>
        <select value={rating} onChange={e => setRating(parseInt(e.target.value))} className="w-full px-4 py-2 rounded-lg border-2 border-blue-200 focus:border-blue-900 focus:ring-0 outline-none font-bold text-blue-900 bg-white" aria-label="Rating 1 to 5">
          {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-bold text-blue-900 mb-1">Title (optional)</label>
        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2 rounded-lg border-2 border-blue-200 focus:border-blue-900 focus:ring-0 outline-none font-medium text-blue-900 placeholder-blue-300" placeholder="e.g., Excellent quality catch" />
      </div>
      <div>
        <label className="block text-sm font-bold text-blue-900 mb-1">Review *</label>
        <textarea value={text} onChange={e => setText(e.target.value)} className="w-full h-28 px-4 py-3 rounded-lg border-2 border-blue-200 focus:border-blue-900 focus:ring-0 outline-none font-medium text-blue-900 placeholder-blue-300" placeholder="Share your experience with this fisher's products" required />
      </div>
      <button disabled={submitting} type="submit" className="px-6 py-2 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800 transition-colors disabled:opacity-50 shadow-sm">
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
