// components/EpicTechChat.tsx
import React, { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import Lottie from "lottie-react";
import AvatarAnimation from "../public/avatar.json"; // Add your custom Lottie avatar json
import axios from "axios";

const getSpeechRecognition = () =>
  window.SpeechRecognition || window.webkitSpeechRecognition;

const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

function streakBadge(count: number) {
  if (count >= 7) return <span className="badge gold">🔥 EPIC STREAK {count}!</span>;
  if (count >= 3) return <span className="badge silver">💥 Streak {count}</span>;
  return null;
}

export default function EpicTechChat() {
  const [messages, setMessages] = useState([
    { id: uuidv4(), role: "bot", content: "Yo! I’m Epic Tech AI. Type, talk, /meme, drop images—let’s GO! 🔥" },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [streak, setStreak] = useState(() => Number(localStorage.getItem("epic-streak") || 1));
  const recognitionRef = useRef<any>(null);

  // Voice out (TTS)
  const speak = (text: string) => {
    if (synth) {
      const utter = new window.SpeechSynthesisUtterance(text.replace(/![^\s]+\.png[^)]*/g, "")); // skip meme previews
      utter.rate = 1.04;
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
      let msgOut = data.output;
      setMessages((msgs) => [
        ...msgs,
        { id: uuidv4(), role: "user", content: payload.input },
        { id: uuidv4(), role: "bot", content: msgOut },
      ]);
      speak(msgOut);
      // Increment streak
      if (Date.now() - Number(localStorage.getItem("last-streak")) > 60 * 60 * 1000) {
        setStreak(s => {
          const newStreak = s + 1;
          localStorage.setItem("epic-streak", String(newStreak));
          localStorage.setItem("last-streak", String(Date.now()));
          return newStreak;
        });
      }
    } catch (err: any) {
      setMessages((msgs) => [
        ...msgs,
        { id: uuidv4(), role: "bot", content: "Network error. Try again?" }
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
        <img src={memeMatch[1]} alt="meme" style={{ maxWidth: 280, marginTop: 7, borderRadius: 6 }} />
      </>;
    }
    return content;
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
        {streakBadge(streak)}
      </div>
      <div className="epic-chat-log">
        {messages.map(msg =>
          <div key={msg.id} className={`epic-msg ${msg.role}`}>
            {renderContent(msg.content)}
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
          placeholder="Talk, command, drop image, or try /meme, /joke, /quiz..."
        />
        <button type="submit" disabled={loading || !input}>Send</button>
      </form>
      <style jsx>{`
        .epic-chat-wrapper { max-width: 480px; margin: 0 auto; background: #181818; border-radius: 12px; box-shadow: 0 4px 28px #000a; padding: 32px 16px; color: #fff; }
        .epic-chat-header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
        .listening-btn-on { background: #01ff70; color: #111; }
        .badge { margin-left: 10px; padding: 4px 11px; border-radius: 9px; font-weight: bold; }
        .badge.gold { background: gold; color: #181818; }
        .badge.silver { background: #bfc7d1; color: #222; }
        .epic-chat-log { min-height: 200px; max-height: 400px; overflow-y: auto; margin: 16px 0 22px 0; }
        .epic-msg { padding: 9px 16px; margin-bottom: 10px; border-radius: 10px; line-height: 1.45; word-break: break-word; }
        .epic-msg.bot { background: #232452; }
        .epic-msg.user { background: #222; margin-left: 19px; }
        .epic-chat-box { display: flex; gap: 7px; margin-bottom: 5px; }
        .epic-chat-box input { flex: 1; background: #222; border: none; border-radius: 6px; padding: 14px; color: #fff; }
        .epic-chat-box input:disabled { background: #2b2b2b; }
        .epic-chat-box button { background: #f21d48; color: #fff; border: none; border-radius: 6px; padding: 0 19px; font-weight: bold; }
        img { max-height: 120px; }
      `}</style>
    </div>
  );
}
