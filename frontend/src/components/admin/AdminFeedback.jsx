import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/feedback').then(r => setFeedback(r.data)).finally(() => setLoading(false));
  }, []);

  const toggleVisibility = async (id) => {
    const updated = await api.patch(`/feedback/${id}/visibility`);
    setFeedback(prev => prev.map(f => f._id === id ? { ...f, status: updated.data.status } : f));
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">All Feedback</h2>
      {feedback.length === 0 ? (
        <p className="text-gray-500">No feedback yet.</p>
      ) : (
        <div className="space-y-3">
          {feedback.map(f => (
            <div key={f._id} className={`border rounded-xl p-4 ${f.status === 'Hidden' ? 'opacity-50' : ''}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{f.passenger?.name}</span>
                    <span className="text-yellow-500">{'⭐'.repeat(f.rating)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{f.comment || '(no comment)'}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Ride: {f.ride?.startLocation} → {f.ride?.endLocation}
                  </p>
                </div>
                <button onClick={() => toggleVisibility(f._id)}
                  className={`text-xs px-3 py-1 rounded-lg transition-colors ${f.status === 'Visible' ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}>
                  {f.status === 'Visible' ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
