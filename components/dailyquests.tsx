// components/dailyquests.tsx
import React, { useEffect, useState } from "react";

const QUESTS = [
  { id: 1, text: "Send a meme using /meme", reward: "🎉" },
  { id: 2, text: "Win an emoji-battle", reward: "🤖" },
  { id: 3, text: "Drop an image to the AI", reward: "🖼️" },
  { id: 4, text: "Hit a 3-message streak!", reward: "🔥" },
  { id: 5, text: "Try /joke or /quiz", reward: "😹" }
];

const QUEST_STORAGE_KEY = "epic-daily-quests";

export default function DailyQuests() {
  const [quests, setQuests] = useState<any[]>([]);

  // Load or initialize quests for the day
  useEffect(() => {
    let today = new Date().toISOString().slice(0,10);
    let saved = localStorage.getItem(QUEST_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === today) return setQuests(parsed.quests);
    }
    // Shuffle quests
    let newQ = QUESTS.sort(() => 0.5 - Math.random()).slice(0, 3).map(q => ({ ...q, done: false }));
    localStorage.setItem(QUEST_STORAGE_KEY, JSON.stringify({ date: today, quests: newQ }));
    setQuests(newQ);
  }, []);

  // Mark a quest done!
  function completeQuest(idx: number) {
    const newQ = quests.map((q, i) => i === idx ? { ...q, done: true } : q);
    setQuests(newQ);
    let today = new Date().toISOString().slice(0,10);
    localStorage.setItem(QUEST_STORAGE_KEY, JSON.stringify({ date: today, quests: newQ }));
  }

  return (
    <div className="quest-box">
      <h4>🏆 Daily Quests</h4>
      <ul>
        {quests.map((q, idx) => (
          <li key={q.id}>
            <input 
              type="checkbox"
              checked={q.done}
              onChange={() => !q.done && completeQuest(idx)}
            />
            <span className={q.done ? "done" : ""}>
              {q.text} <b>{q.reward}</b>
            </span>
          </li>
        ))}
      </ul>
      <style jsx>{`
        .quest-box { background: #212224; margin: 17px auto; max-width: 340px; padding: 15px 20px; border-radius: 12px; color: #effffd; }
        h4 { margin: 0 0 8px 0; }
        ul { padding-left: 18px; margin-top: 0; }
        .done { text-decoration: line-through; opacity: 0.52; }
        input[type=checkbox] { accent-color: #f21d48; }
      `}</style>
    </div>
  )
}
