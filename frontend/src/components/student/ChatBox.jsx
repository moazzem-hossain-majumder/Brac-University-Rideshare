import { useEffect, useRef, useState } from 'react';
import socket from '../../api/socket';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function ChatBox({ rideId, otherName }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    // Load history
    api.get(`/chat/${rideId}`).then(r => setMessages(r.data)).catch(() => {});

    socket.emit('join_ride', rideId);

    const handleMsg = (msg) => setMessages(prev => [...prev, msg]);
    socket.on('receive_message', handleMsg);

    return () => socket.off('receive_message', handleMsg);
  }, [rideId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const msgData = { rideId, sender: user.id, senderName: user.name, message: text.trim(), createdAt: new Date().toISOString() };
    await api.post('/chat', { bookingId: rideId, message: text.trim() });
    socket.emit('send_message', msgData);
    setText('');
  };

  return (
    <div className="flex flex-col h-80">
      <div className="text-sm font-medium text-gray-700 mb-2">💬 Chat with {otherName}</div>
      <div className="flex-1 overflow-y-auto space-y-2 border rounded-xl p-3 bg-gray-50 mb-2">
        {messages.length === 0 && <p className="text-gray-400 text-xs text-center pt-4">No messages yet</p>}
        {messages.map((msg, i) => {
          const isMine = msg.sender === user.id || msg.senderName === user.name;
          return (
            <div key={i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-3 py-2 rounded-2xl text-sm ${isMine ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border rounded-bl-sm'}`}>
                {!isMine && <div className="text-xs font-medium text-indigo-500 mb-0.5">{msg.senderName}</div>}
                <div>{msg.message}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..."
          className="flex-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-indigo-700">Send</button>
      </form>
    </div>
  );
}
