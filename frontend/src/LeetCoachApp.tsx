import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

interface Message {
  role: 'user' | 'coach';
  content: string;
}

const API_URL = 'http://127.0.0.1:8000';

export default function LeetCoachApp() {
  const [sessionId] = useState('session123');
  const [userCode, setUserCode] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('Array');
  const [difficulty, setDifficulty] = useState('Medium');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewFinished, setInterviewFinished] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1200);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const sendToBackend = async (userMessage: string, asCode: boolean = false) => {
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    try {
      const res = await fetch(`${API_URL}/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, user_message: userMessage }),
      });
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        setMessages((prev) => [...prev, { role: 'coach', content: data.reply || '🤖 (Empty reply from model)' }]);
      } catch (err) {
        console.error('❌ Failed to parse JSON from backend:', text);
        setMessages((prev) => [...prev, { role: 'coach', content: `❌ Failed to parse response: ${text}` }]);
      }
    } catch (err) {
      console.error('Backend response error:', err);
      setMessages((prev) => [...prev, { role: 'coach', content: '❌ Error reaching backend or parsing response.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async () => {
    setInterviewStarted(true);
    setInterviewFinished(false);
    setMessages([]);

    const questionPrompt = `#leetcode ${difficulty.toLowerCase()} ${topic.toLowerCase()}`;
    await sendToBackend(questionPrompt);
    setTimeLeft(1200);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleFinish();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleSubmitCode = async () => {
    if (!userCode.trim()) return;
    await sendToBackend(userCode, true);
  };

  const handleSubmitMessage = async () => {
    if (!userMessage.trim()) return;
    await sendToBackend(userMessage);
    setUserMessage('');
  };

  const handleHint = async () => {
    await sendToBackend('#hint');
  };

  const handleFinish = async () => {
    clearInterval(timerRef.current!);
    await sendToBackend('#feedback');
    setInterviewFinished(true);
  };

  const handleRestart = () => {
    setShowRestartConfirm(false);
    setInterviewStarted(false);
    setInterviewFinished(false);
    setUserCode('');
    setUserMessage('');
    setMessages([]);
    setTimeLeft(1200);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-bold text-center">🎯 LeetCoach AI — Mock Interview</h1>

      {!interviewStarted ? (
        <div className="space-y-4">
          <div className="flex gap-4">
            <select value={topic} onChange={(e) => setTopic(e.target.value)} className="p-2 border rounded">
              <option>Array</option>
              <option>Graph</option>
              <option>DP</option>
              <option>String</option>
              <option>Math</option>
            </select>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="p-2 border rounded">
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
          <button onClick={handleStartInterview} className="bg-green-600 text-white px-6 py-2 rounded">
            Start Interview
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Topic: {topic}</span>
            <span>Difficulty: {difficulty}</span>
            <span>⏱ {formatTime(timeLeft)}</span>
          </div>

          <div className="space-y-2">
            <label className="block font-semibold">Write your solution:</label>
            <div className="border rounded overflow-hidden">
              <Editor
                height="300px"
                defaultLanguage="javascript"
                value={userCode}
                onChange={(value) => setUserCode(value || '')}
                theme="vs-dark"
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={handleSubmitCode} disabled={loading || interviewFinished} className="bg-blue-600 text-white px-4 py-2 rounded">
                {loading ? 'Evaluating...' : 'Submit Code'}
              </button>
              <button onClick={handleHint} disabled={loading || interviewFinished} className="bg-yellow-500 text-white px-4 py-2 rounded">
                Hint
              </button>
              <button onClick={handleFinish} disabled={interviewFinished} className="bg-gray-500 text-white px-4 py-2 rounded">
                Finish Interview
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-semibold">Ask a question or respond:</label>
            <input
              type="text"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="What do you mean by edge case?"
              disabled={interviewFinished}
            />
            <button onClick={handleSubmitMessage} disabled={loading || interviewFinished} className="bg-indigo-600 text-white px-4 py-2 mt-1 rounded">
              Send Message
            </button>
          </div>

          <div className="space-y-3 transition-opacity duration-500 ease-in-out">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-4 rounded shadow ${msg.role === 'user' ? 'bg-blue-50 text-left' : 'bg-white text-left'} ${index === messages.length - 1 && interviewFinished ? 'animate-fadeIn' : ''}`}
              >
                <strong>{msg.role === 'user' ? 'You' : 'Coach'}:</strong>
                <ReactMarkdown
                  children={msg.content}
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                />
              </div>
            ))}
            <div ref={bottomRef}></div>
          </div>

          {interviewFinished && (
            <div className="mt-6 border rounded p-4 shadow bg-green-50">
              <h2 className="text-lg font-bold mb-2">🎉 Interview Summary</h2>
              <p>Total Time: {formatTime(1200 - timeLeft)}</p>
              <p>Estimated Score: 🌟 Based on feedback</p>
              <button
                onClick={() => setShowRestartConfirm(true)}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
              >
                Restart Interview
              </button>
            </div>
          )}

          {showRestartConfirm && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10">
              <div className="bg-white p-6 rounded shadow-xl max-w-md text-center">
                <h2 className="text-lg font-semibold mb-4">Are you sure you want to restart?</h2>
                <div className="flex justify-center gap-4">
                  <button onClick={handleRestart} className="bg-red-600 text-white px-4 py-2 rounded">Yes, Restart</button>
                  <button onClick={() => setShowRestartConfirm(false)} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
