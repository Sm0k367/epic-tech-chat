// components/leaderboard.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<{name: string, streak: number, emoji: string}[]>([]);
  
  useEffect(() => {
    axios.get('/api/leaderboard').then(res => setLeaders(res.data));
  }, []);

  return (
    <div className="leaderboard-box">
      <h3>🔥 Epic Streak Leaderboard</h3>
      <ol>
        {leaders.map((u, idx) => (
          <li key={u.name}>
            <span style={{ marginRight: 10 }}>{u.emoji}</span> 
            <b>{u.name}</b> — Streak: <span className="score">{u.streak}</span>
            {idx === 0 && <span className="crown"> 👑</span>}
          </li>
        ))}
      </ol>
      <style jsx>{`
        .leaderboard-box {
          background: #191c23;
          color: #fad2ff;
          margin: 20px auto 0;
          border-radius: 12px;
          padding: 14px 20px;
          max-width: 350px;
        }
        h3 { margin-top: 0; margin-bottom: 7px; }
        ol { padding-left: 17px; }
        .score { color: #ff81ca; font-weight: bold; }
        .crown { margin-left: 8px; color: gold; }
      `}</style>
    </div>
  );
}
