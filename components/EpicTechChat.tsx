// components/EpicTechChat.tsx
import React, { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import Lottie from "lottie-react";
import AvatarAnimation from "../public/avatar.json"; // Replace with your own .json Lottie file
import axios from "axios";

// Optional: STT/TTS hooks (Web Speech API)
const getSpeechRecognition = () =>
  window.SpeechRecognition || window.webkitSpeechRecognition;

const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

export default function EpicTechChat() {
  const [messages, setMessages] = useState([
    { id: uuidv4(), role: "bot", content: "Hi! I’m Epic Tech AI. Ask, talk, drop an image, or type /commands!" },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Voice out (TTS)
  const speak = (text: string) => {
    if (synth) {
      const utter = new window.SpeechSynthesisUtterance(text);
      utter.rate = 1.03;
      synth.cancel();
      synth.speak(utter);
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
      setMessages((msgs) => [
        ...msgs,
        { id: uuidv4(), role: "user", content: payload.input },
        { id: uuidv4(), role: "bot", content: data.output },
      ]);
      speak(data.output);
    } catch (err: any) {
      setMessages((msgs) => [
        ...msgs,
        { id: uuidv4(), role: "bot", content: "Network error. Try again?" },
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

  return (
    <div className="epic-chat-wrapper" onDrop={handleFileDrop} onDragOver={e => e.preventDefault()}>
      <div className="epic-chat-header">
        <Lottie animationData={AvatarAnimation} style={{ width: 80, height: 80 }} />
        <h2>Epic Tech Chat</h2>
        <button
          className={listening ? "listening-btn-on" : ""}
          onClick={handleVoice}
          title="Voice In"
        >🎤</button>
      </div>
      <div className="epic-chat-log">
        {messages.map(msg =>
          <div key={msg.id} className={`epic-msg ${msg.role}`}>
            {msg.content}
          </div>
        )}
        {loading && <div className="epic-msg bot">Thinking…</div>}
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
          placeholder="Ask anything, type /commands, or drop an image..."
        />
        <button type="submit" disabled={loading || !input}>Send</button>
      </form>
      <style jsx>{`
        .epic-chat-wrapper { max-width: 430px; margin: 0 auto; background: #181818; border-radius: 12px; box-shadow: 0 4px 24px #000a; padding: 24px; color: #fff; }
        .epic-chat-header { display: flex; align-items: center; gap: 12px; }
        .listening-btn-on { background: #01ff70; color: #111; }
        .epic-chat-log { min-height: 200px; max-height: 400px; overflow-y: auto; margin: 20px 0; }
        .epic-msg { padding: 8px 14px; margin-bottom: 7px; border-radius: 10px; line-height: 1.45; word-break: break-word; }
        .epic-msg.bot { background: #333652; }
        .epic-msg.user { background: #292929; margin-left: 24px; }
        .epic-chat-box { display: flex; gap: 7px; }
        .epic-chat-box input { flex: 1; background: #222; border: none; border-radius: 6px; padding: 12px; color: #fff; }
        .epic-chat-box input:disabled { background: #2b2b2b; }
        .epic-chat-box button { background: #f21d48; color: #fff; border: none; border-radius: 6px; padding: 0 18px; font-weight: bold; }
      `}</style>
    </div>
  );
}
