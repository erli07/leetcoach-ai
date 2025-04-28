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

interface SessionRecord {
  id: string;
  topic: string;
  difficulty: string;
  startTime: string;
  endTime: string;
  duration: string;
  messages: Message[];
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
  const [sessionHistory, setSessionHistory] = useState<SessionRecord[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(`${API_URL}/get_sessions`);
        const data = await res.json();
        setSessionHistory(data);
      } catch (err) {
        console.error('Failed to load session history', err);
      }
    }
    loadHistory();
  }, []);

  const saveSession = async (sessionRecord: SessionRecord) => {
    try {
      await fetch(`${API_URL}/save_session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionRecord),
      });
    } catch (err) {
      console.error('Failed to save session', err);
    }
  };

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
    startTimeRef.current = Date.now();

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

    const sessionRecord: SessionRecord = {
      id: Date.now().toString(),
      topic,
      difficulty,
      startTime: new Date(startTimeRef.current).toISOString(),
      endTime: new Date().toISOString(),
      duration: formatTime(1200 - timeLeft),
      messages: messages,
    };

    await saveSession(sessionRecord);
    setSessionHistory(prev => [...prev, sessionRecord]);
  };

  const handleRestart = () => {
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
    <div className="max-w-7xl mx-auto py-10 grid grid-cols-3 gap-8">
      <div className="col-span-2 space-y-6">
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
        ) : interviewFinished ? (
          <div className="space-y-4">
            <div className="mt-6 border rounded p-4 shadow bg-green-50">
              <h2 className="text-lg font-bold mb-2">🎉 Interview Summary</h2>
              <p>Total Time: {formatTime(1200 - timeLeft)}</p>
              <p>Estimated Score: 🌟 Based on feedback</p>
              <div className="flex justify-center mt-4">
                <button onClick={handleRestart} className="bg-red-600 text-white px-4 py-2 rounded">
                  Restart Interview
                </button>
              </div>
            </div>
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
                  className={`p-4 rounded shadow ${msg.role === 'user' ? 'bg-blue-50 text-left' : 'bg-white text-left'}`}
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
          </>
        )}
      </div>

      <div className="col-span-1 border rounded p-4 overflow-y-auto max-h-[80vh]">
        <h2 className="text-xl font-bold mb-4">🕘 Past Interview History</h2>
        {sessionHistory.map(session => (
          <details key={session.id} className="mb-4 border rounded p-4">
            <summary className="cursor-pointer font-semibold">
              {session.topic} ({session.difficulty}) - {session.duration}
            </summary>
            <div className="mt-2 space-y-2">
              {session.messages.map((msg, idx) => (
                <div key={idx} className="text-sm">
                  <strong>{msg.role === 'user' ? 'You' : 'Coach'}:</strong> {msg.content}
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
