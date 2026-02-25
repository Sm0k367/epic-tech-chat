// components/EpicTechChat.tsx
import React, { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import dynamic from "next/dynamic";
import axios from "axios";

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

const getSpeechRecognition = () => {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
};

export default function EpicTechChat() {
  const [messages, setMessages] = useState([
    { id: uuidv4(), role: "bot", content: "Yo what's good. I'm here to vibe and help out. What you need?" },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [avatarData, setAvatarData] = useState<any>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize browser-only features
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      // Load avatar animation
      import("../public/avatar.json")
        .then((data) => setAvatarData(data.default))
        .catch(() => console.log("Avatar animation not found"));
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Voice out (TTS)
  const speak = (text: string) => {
    if (voiceEnabled && synthRef.current && typeof window !== "undefined") {
      const cleanText = text.replace(/!\[^\\s]+\.png[^)]*/g, "").replace(/[*_~`]/g, "");
      const utter = new window.SpeechSynthesisUtterance(cleanText);
      utter.rate = 0.95;
      utter.pitch = 0.9;
      synthRef.current.cancel();
      synthRef.current.speak(utter);
    }
  };

  // Voice in (STT)
  const handleVoice = () => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition || listening) return;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.onresult = (e: any) => {
      const transcript = [...e.results].map((r: any) => r[0].transcript).join("");
      setInput(transcript);
      setListening(false);
    };
    recognitionRef.current.onend = () => setListening(false);
    recognitionRef.current.start();
    setListening(true);
  };

  // Send message to backend
  async function sendMessage(payload: any) {
    setLoading(true);
    try {
      const { data } = await axios.post("/api/chat", payload);
      let msgOut = data.output;
      setMessages((msgs) => [
        ...msgs,
        { id: uuidv4(), role: "user", content: payload.input },
        { id: uuidv4(), role: "bot", content: msgOut },
      ]);
      speak(msgOut);
    } catch (err: any) {
      setMessages((msgs) => [
        ...msgs,
        { id: uuidv4(), role: "bot", content: "Yo my bad, something broke. Try again?" }
      ]);
    }
    setLoading(false);
    setInput("");
  }

  // Handle slash commands
  function handleSlash(inputStr: string) {
    const [slash, ...rest] = inputStr.split(" ");
    sendMessage({ slash, input: rest.join(" "), history: messages.slice(-10) });
    setInput("");
  }

  // Handle file drop (images)
  function handleFileDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image")) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      sendMessage({
        input: "[Image uploaded]",
        vision: reader.result,
        history: messages.slice(-10)
      });
    };
    reader.readAsDataURL(file);
  }

  // Meme preview renderer
  function renderContent(content: string) {
    const memeRegex = /!\[meme\]\((https:\/\/api\.memegen\.link\/images[^)]+)\)/;
    const memeMatch = content.match(memeRegex);
    if (memeMatch) {
      return <>
        <span>{content.replace(memeRegex, "")}</span>
        <img src={memeMatch[1]} alt="meme" style={{ maxWidth: 320, marginTop: 10, borderRadius: 8 }} />
      </>;
    }
    return content;
  }

  return (
    <div className="epic-container" onDrop={handleFileDrop} onDragOver={e => e.preventDefault()}>
      {/* Animated background */}
      <div className="bg-animation"></div>
      
      <div className="epic-chat-wrapper">
        <div className="epic-chat-header">
          <div className="header-left">
            {avatarData && <Lottie animationData={avatarData} style={{ width: 60, height: 60 }} />}
            <div>
              <h2>Epic Tech Chat</h2>
              <span className="status">Online • Vibing</span>
            </div>
          </div>
          <div className="header-controls">
            <button
              className={`control-btn ${voiceEnabled ? 'active' : ''}`}
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              title={voiceEnabled ? "Voice ON" : "Voice OFF"}
            >
              {voiceEnabled ? '🔊' : '🔇'}
            </button>
            <button
              className={`control-btn ${listening ? 'listening' : ''}`}
              onClick={handleVoice}
              title="Voice Input"
            >
              🎤
            </button>
          </div>
        </div>

        <div className="epic-chat-log">
          {messages.map(msg =>
            <div key={msg.id} className={`epic-msg ${msg.role}`}>
              <div className="msg-content">
                {renderContent(msg.content)}
              </div>
            </div>
          )}
          {loading && <div className="epic-msg bot loading">
            <div className="msg-content">
              <span className="typing-indicator">
                <span></span><span></span><span></span>
              </span>
            </div>
          </div>}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            if (input.startsWith("/")) handleSlash(input);
            else sendMessage({ input, history: messages.slice(-10) });
          }}
          className="epic-chat-box"
        >
          <input
            disabled={loading}
            value={input}
            onChange={e => setInput(e.target.value)}
            autoFocus
            placeholder="Type your message... or try /meme, /joke, /vibe"
          />
          <button type="submit" disabled={loading || !input} className="send-btn">
            {loading ? '...' : '→'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .epic-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }

        .bg-animation {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
          z-index: -1;
        }

        .bg-animation::before {
          content: '';
          position: absolute;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(79, 172, 254, 0.1) 0%, transparent 50%);
          animation: pulse 8s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: translate(-25%, -25%) scale(1); opacity: 0.3; }
          50% { transform: translate(-25%, -25%) scale(1.2); opacity: 0.5; }
        }

        .epic-chat-wrapper {
          width: 100%;
          max-width: 900px;
          height: 85vh;
          max-height: 800px;
          background: rgba(20, 20, 30, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 100px rgba(79, 172, 254, 0.1);
          border: 1px solid rgba(79, 172, 254, 0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .epic-chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          background: rgba(30, 30, 45, 0.8);
          border-bottom: 1px solid rgba(79, 172, 254, 0.2);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .epic-chat-header h2 {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .status {
          font-size: 13px;
          color: #4facfe;
          opacity: 0.8;
        }

        .header-controls {
          display: flex;
          gap: 10px;
        }

        .control-btn {
          width: 44px;
          height: 44px;
          border: none;
          background: rgba(79, 172, 254, 0.1);
          border-radius: 12px;
          cursor: pointer;
          font-size: 20px;
          transition: all 0.3s ease;
          border: 1px solid rgba(79, 172, 254, 0.2);
        }

        .control-btn:hover {
          background: rgba(79, 172, 254, 0.2);
          transform: translateY(-2px);
        }

        .control-btn.active {
          background: rgba(79, 172, 254, 0.3);
          border-color: #4facfe;
        }

        .control-btn.listening {
          background: rgba(0, 242, 254, 0.3);
          animation: pulse-btn 1s ease-in-out infinite;
        }

        @keyframes pulse-btn {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .epic-chat-log {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .epic-chat-log::-webkit-scrollbar {
          width: 8px;
        }

        .epic-chat-log::-webkit-scrollbar-track {
          background: rgba(79, 172, 254, 0.05);
          border-radius: 10px;
        }

        .epic-chat-log::-webkit-scrollbar-thumb {
          background: rgba(79, 172, 254, 0.3);
          border-radius: 10px;
        }

        .epic-msg {
          display: flex;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .epic-msg.user {
          justify-content: flex-end;
        }

        .msg-content {
          max-width: 70%;
          padding: 14px 18px;
          border-radius: 16px;
          line-height: 1.5;
          word-break: break-word;
          font-size: 15px;
        }

        .epic-msg.bot .msg-content {
          background: linear-gradient(135deg, rgba(79, 172, 254, 0.15) 0%, rgba(0, 242, 254, 0.1) 100%);
          border: 1px solid rgba(79, 172, 254, 0.2);
          color: #e0e0e0;
        }

        .epic-msg.user .msg-content {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: #0a0a0a;
          font-weight: 500;
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 4px 0;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: #4facfe;
          border-radius: 50%;
          animation: typing 1.4s ease-in-out infinite;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.7; }
          30% { transform: translateY(-10px); opacity: 1; }
        }

        .epic-chat-box {
          display: flex;
          gap: 12px;
          padding: 20px 24px;
          background: rgba(30, 30, 45, 0.8);
          border-top: 1px solid rgba(79, 172, 254, 0.2);
        }

        .epic-chat-box input {
          flex: 1;
          background: rgba(79, 172, 254, 0.05);
          border: 1px solid rgba(79, 172, 254, 0.2);
          border-radius: 14px;
          padding: 14px 18px;
          color: #fff;
          font-size: 15px;
          transition: all 0.3s ease;
        }

        .epic-chat-box input:focus {
          outline: none;
          border-color: #4facfe;
          background: rgba(79, 172, 254, 0.1);
          box-shadow: 0 0 20px rgba(79, 172, 254, 0.2);
        }

        .epic-chat-box input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .send-btn {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: #0a0a0a;
          border: none;
          border-radius: 14px;
          padding: 0 28px;
          font-weight: 700;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
        }

        .send-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(79, 172, 254, 0.4);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        img {
          max-width: 100%;
          border-radius: 8px;
          margin-top: 8px;
        }

        @media (max-width: 768px) {
          .epic-chat-wrapper {
            height: 90vh;
            max-height: none;
            border-radius: 16px;
          }

          .msg-content {
            max-width: 85%;
          }
        }
      `}</style>
    </div>
  );
}
