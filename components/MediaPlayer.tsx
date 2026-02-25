// components/MediaPlayer.tsx
import React, { useState, useRef, useEffect } from 'react';

interface MediaFile {
  id: string;
  name: string;
  url: string;
  type: 'audio' | 'video';
}

interface MediaPlayerProps {
  onClose: () => void;
}

export default function MediaPlayer({ onClose }: MediaPlayerProps) {
  const [playlist, setPlaylist] = useState<MediaFile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 100 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const currentMedia = playlist[currentIndex];

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const updateProgress = () => {
      setProgress(media.currentTime);
      setDuration(media.duration || 0);
    };

    const handleEnded = () => {
      if (currentIndex < playlist.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setIsPlaying(false);
      }
    };

    media.addEventListener('timeupdate', updateProgress);
    media.addEventListener('ended', handleEnded);
    media.addEventListener('loadedmetadata', updateProgress);

    return () => {
      media.removeEventListener('timeupdate', updateProgress);
      media.removeEventListener('ended', handleEnded);
      media.removeEventListener('loadedmetadata', updateProgress);
    };
  }, [currentIndex, playlist.length]);

  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (mediaRef.current && isPlaying) {
      mediaRef.current.play();
    } else if (mediaRef.current) {
      mediaRef.current.pause();
    }
  }, [isPlaying, currentIndex]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newMedia: MediaFile[] = files.map(file => ({
      id: Math.random().toString(36),
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : 'audio'
    }));
    setPlaylist([...playlist, ...newMedia]);
    if (playlist.length === 0) {
      setCurrentIndex(0);
    }
  };

  const handleDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleDrag = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, dragOffset]);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    if (mediaRef.current) {
      mediaRef.current.currentTime = percent * duration;
    }
  };

  return (
    <div
      ref={playerRef}
      className="media-player"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleDragStart}
    >
      <div className="player-header">
        <span className="player-title">Media Player</span>
        <button className="close-btn no-drag" onClick={onClose}>×</button>
      </div>

      {currentMedia && (
        <div className="media-container no-drag">
          {currentMedia.type === 'video' ? (
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={currentMedia.url}
              className="media-element"
            />
          ) : (
            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              src={currentMedia.url}
            />
          )}
        </div>
      )}

      <div className="player-controls no-drag">
        <div className="progress-bar" onClick={handleProgressClick}>
          <div 
            className="progress-fill" 
            style={{ width: `${(progress / duration) * 100}%` }}
          />
        </div>

        <div className="time-display">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="control-buttons">
          <button 
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
          >
            ⏮
          </button>
          <button 
            className="play-btn"
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={!currentMedia}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button 
            onClick={() => setCurrentIndex(Math.min(playlist.length - 1, currentIndex + 1))}
            disabled={currentIndex === playlist.length - 1}
          >
            ⏭
          </button>
        </div>

        <div className="volume-control">
          <span>🔊</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="volume-slider"
          />
        </div>
      </div>

      <div className="playlist no-drag">
        <div className="playlist-header">
          <span>Playlist ({playlist.length})</span>
          <label className="upload-btn">
            + Add
            <input
              type="file"
              accept="audio/*,video/*"
              multiple
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
        <div className="playlist-items">
          {playlist.map((item, idx) => (
            <div
              key={item.id}
              className={`playlist-item ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(idx)}
            >
              <span className="item-icon">{item.type === 'video' ? '🎥' : '🎵'}</span>
              <span className="item-name">{item.name}</span>
              <button
                className="remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setPlaylist(playlist.filter((_, i) => i !== idx));
                  if (idx === currentIndex && currentIndex > 0) {
                    setCurrentIndex(currentIndex - 1);
                  }
                }}
              >
                ×
              </button>
            </div>
          ))}
          {playlist.length === 0 && (
            <div className="empty-playlist">
              Drop audio/video files or click + Add
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .media-player {
          position: fixed;
          width: 380px;
          background: rgba(15, 15, 25, 0.98);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 1px solid rgba(79, 172, 254, 0.3);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 100px rgba(79, 172, 254, 0.2);
          overflow: hidden;
          z-index: 1000;
          user-select: none;
        }

        .player-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: rgba(79, 172, 254, 0.1);
          border-bottom: 1px solid rgba(79, 172, 254, 0.2);
        }

        .player-title {
          font-weight: 600;
          font-size: 14px;
          color: #4facfe;
        }

        .close-btn {
          background: none;
          border: none;
          color: #fff;
          font-size: 24px;
          cursor: pointer;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .media-container {
          width: 100%;
          background: #000;
        }

        .media-element {
          width: 100%;
          height: 200px;
          object-fit: contain;
          background: #000;
        }

        .player-controls {
          padding: 16px;
          background: rgba(20, 20, 30, 0.8);
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: rgba(79, 172, 254, 0.2);
          border-radius: 3px;
          cursor: pointer;
          margin-bottom: 12px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
          transition: width 0.1s linear;
        }

        .time-display {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 12px;
        }

        .control-buttons {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .control-buttons button {
          background: rgba(79, 172, 254, 0.2);
          border: 1px solid rgba(79, 172, 254, 0.3);
          color: #fff;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .control-buttons button:hover:not(:disabled) {
          background: rgba(79, 172, 254, 0.4);
          transform: scale(1.1);
        }

        .control-buttons button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .play-btn {
          width: 50px !important;
          height: 50px !important;
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%) !important;
          border: none !important;
        }

        .volume-control {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .volume-control span {
          font-size: 18px;
        }

        .volume-slider {
          flex: 1;
          height: 4px;
          -webkit-appearance: none;
          background: rgba(79, 172, 254, 0.2);
          border-radius: 2px;
          outline: none;
        }

        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          background: #4facfe;
          border-radius: 50%;
          cursor: pointer;
        }

        .playlist {
          max-height: 200px;
          overflow-y: auto;
          background: rgba(10, 10, 15, 0.6);
        }

        .playlist::-webkit-scrollbar {
          width: 6px;
        }

        .playlist::-webkit-scrollbar-track {
          background: rgba(79, 172, 254, 0.05);
        }

        .playlist::-webkit-scrollbar-thumb {
          background: rgba(79, 172, 254, 0.3);
          border-radius: 3px;
        }

        .playlist-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
          border-bottom: 1px solid rgba(79, 172, 254, 0.1);
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
        }

        .upload-btn {
          background: rgba(79, 172, 254, 0.2);
          padding: 4px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }

        .upload-btn:hover {
          background: rgba(79, 172, 254, 0.3);
        }

        .playlist-items {
          padding: 8px;
        }

        .playlist-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 4px;
        }

        .playlist-item:hover {
          background: rgba(79, 172, 254, 0.1);
        }

        .playlist-item.active {
          background: rgba(79, 172, 254, 0.2);
          border: 1px solid rgba(79, 172, 254, 0.3);
        }

        .item-icon {
          font-size: 18px;
        }

        .item-name {
          flex: 1;
          font-size: 13px;
          color: #fff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .remove-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 20px;
          cursor: pointer;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .remove-btn:hover {
          background: rgba(255, 0, 0, 0.2);
          color: #ff4444;
        }

        .empty-playlist {
          text-align: center;
          padding: 40px 20px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
