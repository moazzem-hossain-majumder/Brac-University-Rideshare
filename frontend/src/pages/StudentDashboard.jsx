import { useState } from 'react';
import Layout from '../components/Layout';
import PassengerView from '../components/student/PassengerView';
import RiderView from '../components/student/RiderView';
import FeedbackForm from '../components/student/FeedbackForm';
import Notifications from '../components/student/Notifications';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('main');
  const { user, sessionRole } = useAuth();

  const navItems = [
    { key: 'main', label: sessionRole === 'Rider' ? 'Ride Requests' : 'Request a Ride', icon: sessionRole === 'Rider' ? '🚗' : '🗺️' },
    { key: 'feedback', label: 'Feedback', icon: '⭐' },
    { key: 'notifications', label: 'Notifications', icon: '🔔' },
  ];

  const content = {
    main: sessionRole === 'Rider' ? <RiderView /> : <PassengerView />,
    feedback: <FeedbackForm />,
    notifications: <Notifications />,
  };

  return (
    <Layout navItems={navItems} activeTab={activeTab} setActiveTab={setActiveTab}>
      {content[activeTab]}
    </Layout>
  );
}
