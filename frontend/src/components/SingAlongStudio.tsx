import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Search,
  Upload,
  Music,
  CheckCircle2,
  Volume2,
  ArrowLeft,
  Sparkles,
  Crosshair,
  FileCode2,
  Video,
  Database,
} from 'lucide-react';
import {
  RecommendedSong,
  VocalMicrophoneEngine,
  LivePitchFrame,
  searchYouTubeMusicAndOpenLyrics,
  parseLrcLyrics,
  parseOpenLyricsOrOpenSongXml,
  ParsedLrcLine,
} from '../services/dspAndApi';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface SingAlongStudioProps {
  activeSong: RecommendedSong;
  catalog: RecommendedSong[];
  onSelectSong: (song: RecommendedSong) => void;
  onBackToDna: () => void;
  onLivePitchUpdate?: (hz: number, rms: number, isPlayingAudio: boolean) => void;
}

export const SingAlongStudio: React.FC<SingAlongStudioProps> = ({
  activeSong,
  catalog,
  onSelectSong,
  onBackToDna,
  onLivePitchUpdate,
}) => {
  const [currentTrack, setCurrentTrack] = useState<RecommendedSong>(activeSong);
  const [videoId, setVideoId] = useState<string>(activeSong.videoId);
  const [directStreamUrl, setDirectStreamUrl] = useState<string>('');
  const [playerMode, setPlayerMode] = useState<'ytmusic' | 'direct'>('ytmusic');
  const [lyrics, setLyrics] = useState<ParsedLrcLine[]>([]);
  const [lyricsSourceBadge, setLyricsSourceBadge] = useState<string>('LRCLIB Open Dataset');
  const [isLoadingMedia, setIsLoadingMedia] = useState<boolean>(false);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(activeSong.durationSec || 210);
  const [lyricOffsetSec, setLyricOffsetSec] = useState<number>(0);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const [isMicCoachOn, setIsMicCoachOn] = useState<boolean>(false);
  const [liveFrame, setLiveFrame] = useState<LivePitchFrame | null>(null);
  const [sweetSpotScore, setSweetSpotScore] = useState<number>(95);

  const ytPlayerRef = useRef<any>(null);
  const ytPollTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const micEngineRef = useRef<VocalMicrophoneEngine | null>(null);
  const activeLyricRef = useRef<HTMLDivElement | null>(null);

  // 1. Load Official YouTube IFrame API Script Once
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }
    return () => {
      if (ytPollTimerRef.current) window.clearInterval(ytPollTimerRef.current);
      micEngineRef.current?.stop();
    };
  }, []);

  // 2. Fetch YouTube Music VideoId + Direct Stream + Full-Length LRCLIB Lyrics when activeSong changes
  useEffect(() => {
    setCurrentTrack(activeSong);
    setVideoId(activeSong.videoId);
    setDuration(activeSong.durationSec || 210);
    setIsPlaying(false);
    setCurrentTime(0);
    setLyricOffsetSec(0);

    let isCancelled = false;
    const fetchUnifiedYTMusic = async () => {
      setIsLoadingMedia(true);
      try {
        const data = await searchYouTubeMusicAndOpenLyrics(
          activeSong.searchQuery || `${activeSong.title} ${activeSong.artist}`,
          activeSong.title,
          activeSong.artist,
          activeSong.videoId,
          activeSong.durationSec
        );
        if (isCancelled) return;

        if (data.videoId) setVideoId(data.videoId);
        setDirectStreamUrl(data.streamUrl || '');
        setDuration(data.durationSec || activeSong.durationSec || 210);
        setLyricsSourceBadge(data.lyricsSource || 'LRCLIB Open Dataset');
        setLyrics(parseLrcLyrics(data.syncedLyrics));
      } finally {
        if (!isCancelled) {
          setIsLoadingMedia(false);
        }
      }
    };

    fetchUnifiedYTMusic();
    return () => {
      isCancelled = true;
    };
  }, [activeSong]);

  // 3. Initialize / Update Official YouTube Music IFrame Player & 100ms Clock Sync
  useEffect(() => {
    if (playerMode !== 'ytmusic' || !videoId) return;

    const initPlayer = () => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
        ytPlayerRef.current.cueVideoById(videoId);
        return;
      }

      ytPlayerRef.current = new window.YT.Player('ytmusic-iframe-mount', {
        height: '200',
        width: '100%',
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (event: any) => {
            const d = event.target.getDuration();
            if (d && d > 0) setDuration(d);
          },
          onStateChange: (event: any) => {
            const playing = event.data === 1; // YT.PlayerState.PLAYING
            setIsPlaying(playing);
            onLivePitchUpdate?.(playing ? currentTrack.idealHz : 0, playing ? 0.06 : 0, playing);

            const d = event.target.getDuration();
            if (d && d > 0) setDuration(d);
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    if (ytPollTimerRef.current) window.clearInterval(ytPollTimerRef.current);
    ytPollTimerRef.current = window.setInterval(() => {
      if (
        playerMode === 'ytmusic' &&
        ytPlayerRef.current &&
        typeof ytPlayerRef.current.getCurrentTime === 'function'
      ) {
        const state = ytPlayerRef.current.getPlayerState?.();
        if (state === 1) {
          const t = ytPlayerRef.current.getCurrentTime();
          if (typeof t === 'number' && !Number.isNaN(t)) {
            setCurrentTime(t);
          }
        }
      }
    }, 100);

    return () => {
      if (ytPollTimerRef.current) window.clearInterval(ytPollTimerRef.current);
    };
  }, [videoId, playerMode]);

  const effectiveTime = Math.max(0, currentTime + lyricOffsetSec);
  const activeLineIndex = lyrics.reduce((acc, line, idx) => {
    if (effectiveTime >= line.time) return idx;
    return acc;
  }, 0);

  useEffect(() => {
    if (activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLineIndex]);

  const togglePlayPause = async () => {
    if (playerMode === 'ytmusic' && ytPlayerRef.current) {
      const state = ytPlayerRef.current.getPlayerState?.();
      if (state === 1) {
        ytPlayerRef.current.pauseVideo?.();
        setIsPlaying(false);
      } else {
        ytPlayerRef.current.playVideo?.();
        setIsPlaying(true);
      }
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setPlayerMode('ytmusic');
      }
    }
  };

  const seekAudioTo = async (targetSeconds: number) => {
    const clamped = Math.max(0, Math.min(duration || 240, targetSeconds));
    setCurrentTime(clamped);

    if (playerMode === 'ytmusic' && ytPlayerRef.current?.seekTo) {
      ytPlayerRef.current.seekTo(clamped, true);
      ytPlayerRef.current.playVideo?.();
      setIsPlaying(true);
      return;
    }

    if (audioRef.current) {
      audioRef.current.currentTime = clamped;
      if (!isPlaying) {
        await audioRef.current.play().catch(() => undefined);
        setIsPlaying(true);
      }
    }
  };

  const handleCustomSongSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q || isSearching) return;

    setIsSearching(true);
    ytPlayerRef.current?.pauseVideo?.();
    audioRef.current?.pause();
    setIsPlaying(false);

    try {
      const parts = q.split('-').map((s) => s.trim());
      const trackGuess = parts[0] || q;
      const artistGuess = parts[1] || '';

      const data = await searchYouTubeMusicAndOpenLyrics(q, trackGuess, artistGuess);
      const customSong: RecommendedSong = {
        id: `ytm-${Date.now()}`,
        title: data.trackName || trackGuess,
        artist: data.artistName || artistGuess || 'YouTube Music Artist',
        lang: 'Global / Hindi',
        key: currentTrack.key,
        range: currentTrack.range,
        idealHz: currentTrack.idealHz,
        fitScore: 96,
        searchQuery: q,
        videoId: data.videoId || videoId,
        durationSec: data.durationSec || 210,
        streamUrl: data.streamUrl,
        artworkUrl: data.artworkUrl,
        lyricsSource: data.lyricsSource,
        lrc: data.syncedLyrics,
      };

      setCurrentTrack(customSong);
      if (data.videoId) setVideoId(data.videoId);
      setDirectStreamUrl(data.streamUrl || '');
      setDuration(data.durationSec || 210);
      setLyricsSourceBadge(data.lyricsSource || 'LRCLIB Open Dataset');
      setLyrics(parseLrcLyrics(data.syncedLyrics));
      setCurrentTime(0);
      setLyricOffsetSec(0);
    } finally {
      setIsSearching(false);
    }
  };

  // Import OpenLyrics (.xml), OpenSong XML, or .lrc file directly
  const handleImportOpenDatasetFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    if (file.name.endsWith('.xml') || text.trim().startsWith('<')) {
      const parsedXml = parseOpenLyricsOrOpenSongXml(text, duration);
      if (parsedXml.length > 0) {
        setLyrics(parsedXml);
        setLyricsSourceBadge(`OpenLyrics / OpenSong XML (${file.name})`);
      }
    } else {
      setLyrics(parseLrcLyrics(text));
      setLyricsSourceBadge(`Imported LRC (${file.name})`);
    }
  };

  const handleLocalAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setDirectStreamUrl(localUrl);
    setPlayerMode('direct');
    setCurrentTrack((prev) => ({
      ...prev,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'Local Master Audio',
    }));
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const snapLyricsToCurrentAudio = () => {
    const targetLine = lyrics[activeLineIndex] || lyrics[0];
    if (!targetLine) return;
    setLyricOffsetSec(Number((targetLine.time - currentTime).toFixed(2)));
  };

  const toggleMicPitchCoach = async () => {
    if (isMicCoachOn) {
      micEngineRef.current?.stop();
      micEngineRef.current = null;
      setIsMicCoachOn(false);
      setLiveFrame(null);
      return;
    }

    const engine = new VocalMicrophoneEngine();
    micEngineRef.current = engine;

    try {
      await engine.start((frame) => {
        setLiveFrame(frame);
        onLivePitchUpdate?.(frame.hz, frame.rms, isPlaying);

        if (frame.isVoiced && frame.hz > 0) {
          const delta = Math.abs(frame.hz - currentTrack.idealHz);
          setSweetSpotScore((prev) =>
            Math.min(99, Math.max(75, Math.round(prev * 0.85 + (delta <= 55 ? 98 : 80) * 0.15)))
          );
        }
      });
      setIsMicCoachOn(true);
    } catch {
      alert('Please allow microphone access to use the Live Pitch Coach.');
    }
  };

  const formatClock = (sec: number): string => {
    const mins = Math.floor(sec / 60);
    const rem = Math.floor(sec % 60);
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Bar: Back Button + YouTube Music & Open-Source Lyrics Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0D1522]/90 border border-slate-800 rounded-2xl p-4">
        <button
          onClick={onBackToDna}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>Back to Vocal DNA</span>
        </button>

        <form onSubmit={handleCustomSongSearch} className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search YouTube Music + LRCLIB (e.g. Sahiba Aditya Rikhari, Kesariya)..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-cyan-400 text-slate-950 font-extrabold text-xs hover:brightness-110 transition cursor-pointer disabled:opacity-50"
          >
            {isSearching ? 'Searching YTMusic...' : 'Search YTMusic'}
          </button>
        </form>
      </div>

      {/* Song Switcher Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {catalog.map((song) => {
          const active = song.id === currentTrack.id;
          return (
            <button
              key={song.id}
              onClick={() => onSelectSong(song)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition cursor-pointer ${
                active
                  ? 'bg-cyan-500/20 border-cyan-400 text-white'
                  : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Music className="w-3.5 h-3.5 text-cyan-400" />
              <span>{song.title}</span>
              <span className="text-[10px] text-slate-400 font-normal">({song.artist.split(',')[0]})</span>
            </button>
          );
        })}
      </div>

      {/* Main Split Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Official YouTube Music Player + Direct Audio Stream + Pitch Coach */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-[#0D1522] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-extrabold text-white">YouTube Music Full-Track Engine</span>
              </div>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setPlayerMode('ytmusic')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                    playerMode === 'ytmusic'
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  YTMusic Player
                </button>
                {directStreamUrl && (
                  <button
                    type="button"
                    onClick={() => setPlayerMode('direct')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                      playerMode === 'direct'
                        ? 'bg-cyan-400 text-slate-950'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Direct Audio Stream
                  </button>
                )}
              </div>
            </div>

            {/* Official YouTube Music IFrame Mount (Starts at 0:00 of official audio track!) */}
            <div className={playerMode === 'ytmusic' ? 'block' : 'hidden'}>
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black aspect-video">
                <div id="ytmusic-iframe-mount" className="w-full h-full" />
              </div>
            </div>

            {/* Direct yt-dlp / Local Audio Stream Element */}
            <audio
              ref={audioRef}
              src={directStreamUrl}
              onTimeUpdate={() => {
                if (playerMode === 'direct' && audioRef.current) {
                  setCurrentTime(audioRef.current.currentTime);
                  if (audioRef.current.duration) setDuration(audioRef.current.duration);
                }
              }}
              onEnded={() => setIsPlaying(false)}
            />

            {/* Unified Master Timeline Scrubber */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlayPause}
                  className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-300 text-slate-950 flex items-center justify-center shadow-lg hover:scale-105 transition cursor-pointer shrink-0"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                <div className="flex-1 space-y-1">
                  <input
                    type="range"
                    min={0}
                    max={duration || 210}
                    step={0.1}
                    value={currentTime}
                    onChange={(e) => seekAudioTo(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>{formatClock(currentTime)}</span>
                    <span>
                      {isLoadingMedia ? 'Syncing YTMusic + LRCLIB...' : formatClock(duration)}
                    </span>
                  </div>
                </div>
                <Volume2 className="w-4 h-4 text-cyan-400 shrink-0" />
              </div>
            </div>

            {/* OpenLyrics / OpenSong XML Import & Sync Calibration */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-3">
                <label className="cursor-pointer flex items-center gap-1 text-cyan-300 hover:underline font-semibold">
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span>Import OpenLyrics/OpenSong (.xml/.lrc)</span>
                  <input
                    type="file"
                    accept=".xml,.lrc,.txt"
                    onChange={handleImportOpenDatasetFile}
                    className="hidden"
                  />
                </label>

                <label className="cursor-pointer flex items-center gap-1 text-teal-300 hover:underline font-semibold">
                  <Upload className="w-3.5 h-3.5" />
                  <span>MP3</span>
                  <input type="file" accept="audio/*" onChange={handleLocalAudioUpload} className="hidden" />
                </label>
              </div>

              <div className="flex items-center gap-1 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={snapLyricsToCurrentAudio}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 cursor-pointer"
                >
                  <Crosshair className="w-3 h-3" />
                  <span>Snap</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLyricOffsetSec((s) => Number((s - 0.5).toFixed(1)))}
                  className="px-1.5 py-0.5 rounded bg-slate-800 text-white cursor-pointer"
                >
                  -0.5s
                </button>
                <span className="text-cyan-300">
                  {lyricOffsetSec >= 0 ? `+${lyricOffsetSec}s` : `${lyricOffsetSec}s`}
                </span>
                <button
                  type="button"
                  onClick={() => setLyricOffsetSec((s) => Number((s + 0.5).toFixed(1)))}
                  className="px-1.5 py-0.5 rounded bg-slate-800 text-white cursor-pointer"
                >
                  +0.5s
                </button>
              </div>
            </div>
          </div>

          {/* Live Mic Pitch Coach */}
          <div className="bg-[#0D1522] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">Live Sing-Along Pitch Coach</h4>
              <button
                onClick={toggleMicPitchCoach}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isMicCoachOn
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                }`}
              >
                {isMicCoachOn ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isMicCoachOn ? 'Stop Mic' : 'Enable Mic Coach'}</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">YOUR VOICE</span>
                <span className="text-base font-extrabold font-mono text-cyan-300">
                  {liveFrame && liveFrame.isVoiced ? `${liveFrame.hz} Hz` : '--- Hz'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">TARGET KEY</span>
                <span className="text-base font-extrabold font-mono text-teal-300">
                  {currentTrack.idealHz} Hz
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">ACCURACY</span>
                <span className="text-base font-extrabold font-mono text-emerald-400">
                  {sweetSpotScore}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Full-Track Duration-Locked LRCLIB / OpenLyrics Teleprompter */}
        <div className="lg:col-span-7 bg-[#0D1522] border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl min-h-[470px]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Full-Length Time-Synced Lyrics Teleprompter
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-[10px] font-mono text-teal-300">
                <Database className="w-3 h-3" />
                <span>{lyricsSourceBadge}</span>
              </span>
              <span className="text-xs font-mono text-cyan-400">
                Line {activeLineIndex + 1} / {lyrics.length}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[380px] space-y-3 py-6 pr-2">
            {lyrics.map((line, index) => {
              const isCurrent = index === activeLineIndex;
              return (
                <div
                  key={`${line.time}-${index}`}
                  ref={isCurrent ? activeLyricRef : null}
                  onClick={() => seekAudioTo(Math.max(0, line.time - lyricOffsetSec))}
                  className={`cursor-pointer transition-all duration-200 rounded-2xl px-5 py-3.5 ${
                    isCurrent
                      ? 'bg-gradient-to-r from-cyan-500/20 to-teal-400/10 border-l-4 border-cyan-400 text-white scale-[1.01]'
                      : 'text-slate-400 hover:text-slate-200 opacity-60 hover:opacity-90'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <p
                      className={
                        isCurrent ? 'text-xl sm:text-2xl font-extrabold' : 'text-base font-semibold'
                      }
                    >
                      {line.text}
                    </p>
                    <span className="text-[11px] font-mono text-slate-500 shrink-0">
                      {formatClock(line.time)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              Click any lyric line to seek the YouTube Music player to that exact timestamp.
            </span>
            <span className="font-mono text-cyan-300">LRCLIB + OpenLyrics + YTMusic</span>
          </div>
        </div>
      </div>
    </div>
  );
};