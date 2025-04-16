import { useState } from 'react';

export default function LeetCoachApp() {
  const [sessionId] = useState('session123');
  const [userMessage, setUserMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!userMessage.trim()) return;
    setLoading(true);

    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setUserMessage('');

    try {
      const res = await fetch('http://127.0.0.1:8000/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, user_message: userMessage })
      });

      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: 'assistant', content: '❌ Error: Could not reach server.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-bold text-center">💬 LeetCoach AI</h1>

      <div className="flex gap-2">
        <input
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          placeholder="Ask a question or type #leetcode..."
          className="flex-grow border rounded p-2"
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>

      <div className="space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-4 rounded shadow ${
              msg.role === 'user' ? 'bg-gray-100 text-right' : 'bg-white text-left'
            }`}
          >
            <strong>{msg.role === 'user' ? 'You' : 'Coach'}:</strong> {msg.content}
          </div>
        ))}
      </div>
    </div>
  );
}
