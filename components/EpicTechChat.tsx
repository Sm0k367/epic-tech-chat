// components/EpicTechChat.tsx
import React, { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import dynamic from "next/dynamic";
import axios from "axios";

// Dynamically import to avoid SSR issues
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });
const ThreeBackground = dynamic(() => import("./ThreeBackground"), { ssr: false });
const MediaPlayer = dynamic(() => import("./MediaPlayer"), { ssr: false });

const getSpeechRecognition = () => {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
};

// Slash commands list for autocomplete
const SLASH_COMMANDS = [
  { cmd: '/help', desc: 'Show all commands' },
  { cmd: '/joke', desc: 'Get a joke' },
  { cmd: '/meme', desc: 'Generate a meme' },
  { cmd: '/vibe', desc: 'Check the vibe' },
  { cmd: '/roll', desc: 'Roll a dice' },
  { cmd: '/flip', desc: 'Flip a coin' },
  { cmd: '/riddle', desc: 'Get a riddle' },
  { cmd: '/quiz', desc: 'Quick quiz' },
  { cmd: '/randomfact', desc: 'Random fact' },
  { cmd: '/weather', desc: 'Check weather' },
  { cmd: '/remind', desc: 'Set reminder' },
  { cmd: '/define', desc: 'Define a word' },
];

export default function EpicTechChat() {
  const [messages, setMessages] = useState([
    { id: uuidv4(), role: "bot", content: "Yo what's good. I'm here to vibe and help out. What you need?" },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('male');
  const [showInstructions, setShowInstructions] = useState(false);
  const [showMediaPlayer, setShowMediaPlayer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [commandSuggestions, setCommandSuggestions] = useState<typeof SLASH_COMMANDS>([]);
  const [avatarData, setAvatarData] = useState<any>(null);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize browser-only features
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      import("../public/avatar.json")
        .then((data) => setAvatarData(data.default))
        .catch(() => console.log("Avatar animation not found"));
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Command autocomplete
  useEffect(() => {
    if (input.startsWith('/')) {
      const search = input.toLowerCase();
      const filtered = SLASH_COMMANDS.filter(cmd => 
        cmd.cmd.toLowerCase().startsWith(search) || 
        cmd.desc.toLowerCase().includes(search.slice(1))
      );
      setCommandSuggestions(filtered.slice(0, 5));
    } else {
      setCommandSuggestions([]);
    }
  }, [input]);

  // Natural voice synthesis with gender selection
  const speak = (text: string) => {
    if (voiceEnabled && synthRef.current && typeof window !== "undefined") {
      const cleanText = text.replace(/!\[^\\s]+\.png[^)]*/g, "").replace(/[*_~`]/g, "");
      const utter = new window.SpeechSynthesisUtterance(cleanText);
      
      // Get available voices
      const voices = synthRef.current.getVoices();
      
      // Select natural-sounding voice based on gender
      if (voiceGender === 'female') {
        const femaleVoice = voices.find(v => 
          v.name.includes('Samantha') || 
          v.name.includes('Karen') || 
          v.name.includes('Female') ||
          v.name.includes('Zira')
        ) || voices.find(v => v.name.includes('Google US English') && v.name.includes('Female'));
        if (femaleVoice) utter.voice = femaleVoice;
      } else {
        const maleVoice = voices.find(v => 
          v.name.includes('Daniel') || 
          v.name.includes('Alex') || 
          v.name.includes('Male') ||
          v.name.includes('David')
        ) || voices.find(v => v.name.includes('Google US English') && !v.name.includes('Female'));
        if (maleVoice) utter.voice = maleVoice;
      }
      
      utter.rate = 0.95;
      utter.pitch = voiceGender === 'female' ? 1.1 : 0.9;
      utter.volume = 0.9;
      
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
    setCommandSuggestions([]);
  }

  // Handle slash commands
  function handleSlash(inputStr: string) {
    const [slash, ...rest] = inputStr.split(" ");
    sendMessage({ slash, input: rest.join(" "), history: messages.slice(-10) });
  }

  // Handle file drop (images and media)
  function handleFileDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    if (file.type.startsWith("image")) {
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
    <>
      <ThreeBackground />
      
      <div className="epic-container" onDrop={handleFileDrop} onDragOver={e => e.preventDefault()}>
        <div className="epic-chat-wrapper">
          {/* Header */}
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
                className="control-btn"
                onClick={() => setShowMediaPlayer(!showMediaPlayer)}
                title="Media Player"
              >
                🎵
              </button>
              <button
                className="control-btn"
                onClick={() => setShowSettings(!showSettings)}
                title="Settings"
              >
                ⚙️
              </button>
              <button
                className="control-btn"
                onClick={() => setShowInstructions(!showInstructions)}
                title="Instructions"
              >
                ❓
              </button>
            </div>
          </div>

          {/* Instructions Panel */}
          {showInstructions && (
            <div className="instructions-panel">
              <h3>How to Use Epic Tech Chat</h3>
              <div className="instruction-section">
                <h4>💬 Chat Features</h4>
                <ul>
                  <li>Type normally to chat with AI</li>
                  <li>Use slash commands for special features</li>
                  <li>Drag & drop images to analyze them</li>
                  <li>Click 🎤 to use voice input</li>
                </ul>
              </div>
              <div className="instruction-section">
                <h4>🎵 Media Player</h4>
                <ul>
                  <li>Click 🎵 to open media player</li>
                  <li>Upload audio/video files</li>
                  <li>Create playlists while chatting</li>
                  <li>Drag player anywhere on screen</li>
                </ul>
              </div>
              <div className="instruction-section">
                <h4>🔊 Voice Settings</h4>
                <ul>
                  <li>Toggle voice responses on/off</li>
                  <li>Choose male or female voice</li>
                  <li>Natural-sounding speech synthesis</li>
                </ul>
              </div>
              <div className="instruction-section">
                <h4>⚡ Slash Commands</h4>
                <div className="command-grid">
                  {SLASH_COMMANDS.map(cmd => (
                    <div key={cmd.cmd} className="command-item">
                      <code>{cmd.cmd}</code>
                      <span>{cmd.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Settings Panel */}
          {showSettings && (
            <div className="settings-panel">
              <h3>Settings</h3>
              <div className="setting-item">
                <label>Voice Responses</label>
                <button
                  className={`toggle-btn ${voiceEnabled ? 'active' : ''}`}
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                >
                  {voiceEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="setting-item">
                <label>Voice Gender</label>
                <select 
                  value={voiceGender} 
                  onChange={(e) => setVoiceGender(e.target.value as 'male' | 'female')}
                  className="voice-select"
                >
                  <option value="male">Male Voice</option>
                  <option value="female">Female Voice</option>
                </select>
              </div>
              <div className="setting-item">
                <label>Voice Input</label>
                <button
                  className={`control-btn ${listening ? 'listening' : ''}`}
                  onClick={handleVoice}
                >
                  🎤 {listening ? 'Listening...' : 'Click to speak'}
                </button>
              </div>
            </div>
          )}

          {/* Chat Log */}
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

          {/* Command Suggestions */}
          {commandSuggestions.length > 0 && (
            <div className="command-suggestions">
              {commandSuggestions.map(cmd => (
                <div
                  key={cmd.cmd}
                  className="suggestion-item"
                  onClick={() => {
                    setInput(cmd.cmd + ' ');
                    setCommandSuggestions([]);
                    inputRef.current?.focus();
                  }}
                >
                  <code>{cmd.cmd}</code>
                  <span>{cmd.desc}</span>
                </div>
              ))}
            </div>
          )}

          {/* Input Box */}
          <form
            onSubmit={e => {
              e.preventDefault();
              if (input.startsWith("/")) handleSlash(input);
              else sendMessage({ input, history: messages.slice(-10) });
            }}
            className="epic-chat-box"
          >
            <input
              ref={inputRef}
              disabled={loading}
              value={input}
              onChange={e => setInput(e.target.value)}
              autoFocus
              placeholder="Type your message... or try /help for commands"
            />
            <button type="submit" disabled={loading || !input} className="send-btn">
              {loading ? '...' : '→'}
            </button>
          </form>
        </div>
      </div>

      {/* Floating Media Player */}
      {showMediaPlayer && <MediaPlayer onClose={() => setShowMediaPlayer(false)} />}

      <style jsx>{`
        .epic-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
        }

        .epic-chat-wrapper {
          width: 100%;
          max-width: 1000px;
          height: 90vh;
          max-height: 900px;
          background: rgba(15, 15, 25, 0.85);
          backdrop-filter: blur(30px);
          border-radius: 24px;
          box-shadow: 0 20px 80px rgba(0, 0, 0, 0.6), 0 0 100px rgba(79, 172, 254, 0.15);
          border: 1px solid rgba(79, 172, 254, 0.3);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        .epic-chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 28px;
          background: rgba(20, 20, 35, 0.9);
          border-bottom: 1px solid rgba(79, 172, 254, 0.2);
          backdrop-filter: blur(10px);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .epic-chat-header h2 {
          margin: 0;
          font-size: 24px;
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
          min-width: 44px;
          height: 44px;
          border: none;
          background: rgba(79, 172, 254, 0.1);
          border-radius: 12px;
          cursor: pointer;
          font-size: 18px;
          transition: all 0.3s ease;
          border: 1px solid rgba(79, 172, 254, 0.2);
          padding: 0 12px;
          color: #fff;
        }

        .control-btn:hover {
          background: rgba(79, 172, 254, 0.25);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
        }

        .control-btn.listening {
          background: rgba(0, 242, 254, 0.3);
          animation: pulse-btn 1s ease-in-out infinite;
        }

        @keyframes pulse-btn {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(0, 242, 254, 0.5); }
        }

        .instructions-panel, .settings-panel {
          background: rgba(20, 20, 35, 0.95);
          border-bottom: 1px solid rgba(79, 172, 254, 0.2);
          padding: 24px 28px;
          max-height: 300px;
          overflow-y: auto;
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from { max-height: 0; opacity: 0; }
          to { max-height: 300px; opacity: 1; }
        }

        .instructions-panel h3, .settings-panel h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          color: #4facfe;
        }

        .instruction-section {
          margin-bottom: 20px;
        }

        .instruction-section h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #00f2fe;
        }

        .instruction-section ul {
          margin: 0;
          padding-left: 20px;
          font-size: 13px;
          line-height: 1.8;
          color: rgba(255, 255, 255, 0.8);
        }

        .command-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 8px;
          margin-top: 8px;
        }

        .command-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 8px 12px;
          background: rgba(79, 172, 254, 0.1);
          border-radius: 8px;
          font-size: 12px;
        }

        .command-item code {
          color: #4facfe;
          font-weight: 600;
        }

        .command-item span {
          color: rgba(255, 255, 255, 0.6);
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding: 12px;
          background: rgba(79, 172, 254, 0.05);
          border-radius: 10px;
        }

        .setting-item label {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
        }

        .toggle-btn {
          padding: 6px 20px;
          border: 1px solid rgba(79, 172, 254, 0.3);
          background: rgba(79, 172, 254, 0.1);
          color: #fff;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
        }

        .toggle-btn.active {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: #0a0a0a;
          border-color: transparent;
        }

        .voice-select {
          padding: 8px 16px;
          background: rgba(79, 172, 254, 0.1);
          border: 1px solid rgba(79, 172, 254, 0.3);
          color: #fff;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        }

        .voice-select option {
          background: #1a1a2e;
          color: #fff;
        }

        .epic-chat-log {
          flex: 1;
          overflow-y: auto;
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 18px;
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

        .epic-chat-log::-webkit-scrollbar-thumb:hover {
          background: rgba(79, 172, 254, 0.5);
        }

        .epic-msg {
          display: flex;
          animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .epic-msg.user {
          justify-content: flex-end;
        }

        .msg-content {
          max-width: 75%;
          padding: 16px 20px;
          border-radius: 18px;
          line-height: 1.6;
          word-break: break-word;
          font-size: 15px;
        }

        .epic-msg.bot .msg-content {
          background: linear-gradient(135deg, rgba(79, 172, 254, 0.15) 0%, rgba(0, 242, 254, 0.1) 100%);
          border: 1px solid rgba(79, 172, 254, 0.25);
          color: #e8e8e8;
        }

        .epic-msg.user .msg-content {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: #0a0a0a;
          font-weight: 500;
        }

        .typing-indicator {
          display: flex;
          gap: 5px;
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

        .command-suggestions {
          position: absolute;
          bottom: 90px;
          left: 28px;
          right: 28px;
          background: rgba(15, 15, 25, 0.98);
          border: 1px solid rgba(79, 172, 254, 0.3);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.2s ease-out;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .suggestion-item {
          display: flex;
          justify-content: space-between;
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 1px solid rgba(79, 172, 254, 0.1);
        }

        .suggestion-item:last-child {
          border-bottom: none;
        }

        .suggestion-item:hover {
          background: rgba(79, 172, 254, 0.15);
        }

        .suggestion-item code {
          color: #4facfe;
          font-weight: 600;
          font-size: 14px;
        }

        .suggestion-item span {
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
        }

        .epic-chat-box {
          display: flex;
          gap: 12px;
          padding: 24px 28px;
          background: rgba(20, 20, 35, 0.9);
          border-top: 1px solid rgba(79, 172, 254, 0.2);
        }

        .epic-chat-box input {
          flex: 1;
          background: rgba(79, 172, 254, 0.08);
          border: 1px solid rgba(79, 172, 254, 0.25);
          border-radius: 16px;
          padding: 16px 20px;
          color: #fff;
          font-size: 15px;
          transition: all 0.3s ease;
        }

        .epic-chat-box input:focus {
          outline: none;
          border-color: #4facfe;
          background: rgba(79, 172, 254, 0.12);
          box-shadow: 0 0 25px rgba(79, 172, 254, 0.25);
        }

        .epic-chat-box input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .send-btn {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: #0a0a0a;
          border: none;
          border-radius: 16px;
          padding: 0 32px;
          font-weight: 700;
          font-size: 22px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(79, 172, 254, 0.4);
        }

        .send-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 30px rgba(79, 172, 254, 0.5);
        }

        .send-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
        }

        img {
          max-width: 100%;
          border-radius: 10px;
          margin-top: 10px;
        }

        @media (max-width: 768px) {
          .epic-chat-wrapper {
            height: 95vh;
            max-height: none;
            border-radius: 0;
          }

          .msg-content {
            max-width: 85%;
          }

          .command-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
