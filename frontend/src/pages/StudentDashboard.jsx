import { useState } from 'react';
import Layout from '../components/Layout';
import PassengerView from '../components/student/PassengerView';
import RiderView from '../components/student/RiderView';
import FeedbackForm from '../components/student/FeedbackForm';
import Notifications from '../components/student/Notifications';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('main');
  const { sessionRole } = useAuth();

  const navItems = [
    { key: 'main', label: sessionRole === 'Rider' ? 'Drive Mode' : 'Ride Mode', icon: sessionRole === 'Rider' ? '🏍️' : '🗺️' },
    { key: 'notifications', label: 'Notifications', icon: '🔔' },
    { key: 'feedback', label: 'Feedback', icon: '⭐' },
  ];

  return (
    <Layout navItems={navItems} activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'main' ? (
        sessionRole === 'Rider' ? <RiderView /> : <PassengerView />
      ) : (
        <div className="h-full overflow-y-auto p-6 sm:p-10 flex justify-center bg-slate-50 dark:bg-slate-950">
          <div className="w-full max-w-xl">
            <button
              onClick={() => setActiveTab('main')}
              className="inline-flex items-center gap-2 mb-6 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              ← Back to {sessionRole === 'Rider' ? 'Drive Map' : 'Ride Booking'}
            </button>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
              {activeTab === 'feedback' && <FeedbackForm />}
              {activeTab === 'notifications' && <Notifications />}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
