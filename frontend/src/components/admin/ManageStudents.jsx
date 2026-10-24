import { useEffect, useState } from 'react';
import api from '../../api/axios';

const statusColor = { Pending: 'bg-yellow-100 text-yellow-700', Approved: 'bg-green-100 text-green-700' };

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/users').then(r => setStudents(r.data)).finally(() => setLoading(false));
  }, []);

  const approve = async (id) => {
    const updated = await api.patch(`/users/${id}/approve`);
    setStudents(prev => prev.map(s => s._id === id ? updated.data : s));
  };

  const remove = async (id) => {
    if (!confirm('Delete this student?')) return;
    await api.delete(`/users/${id}`);
    setStudents(prev => prev.filter(s => s._id !== id));
  };

  const filtered = filter === 'all' ? students : students.filter(s => s.status === filter);

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Manage Students</h2>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="all">All</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500">No students found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Role</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(s => (
                <tr key={s._id}>
                  <td className="py-3 pr-4 font-medium text-gray-800">{s.name}</td>
                  <td className="py-3 pr-4 text-gray-500">{s.email}</td>
                  <td className="py-3 pr-4 text-gray-500">{s.role || '—'}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[s.status]}`}>{s.status}</span>
                  </td>
                  <td className="py-3 flex gap-2">
                    {s.status === 'Pending' && (
                      <button onClick={() => approve(s._id)}
                        className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700">Approve</button>
                    )}
                    <button onClick={() => remove(s._id)}
                      className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-lg hover:bg-red-200">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
