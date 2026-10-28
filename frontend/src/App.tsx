import React, { useState, useEffect } from 'react';
import {
  Mic,
  Sparkles,
  Radio,
  Cpu,
  CheckCircle2,
  Volume2,
  Sliders,
  ShieldCheck,
  Music2,
  Layers,
} from 'lucide-react';
import { ThreeMascot } from './components/ThreeMascot';
import { VocalLabAndDna } from './components/VocalLabAndDna';
import { SingAlongStudio } from './components/SingAlongStudio';
import {
  PHRASE_PACKS,
  INITIAL_SONG_CATALOG,
  PhrasePack,
  RecommendedSong,
  checkBackendHealth,
} from './services/dspAndApi';

export const App: React.FC = () => {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [selectedPack, setSelectedPack] = useState<PhrasePack>(PHRASE_PACKS[0]);
  const [languageFilter, setLanguageFilter] = useState<'all' | 'Hindi' | 'English'>('all');

  const [backendStatus, setBackendStatus] = useState<{
    backendOnline: boolean;
    ollamaOnline: boolean;
    activeModel: string;
  }>({
    backendOnline: false,
    ollamaOnline: false,
    activeModel: 'Checking...',
  });

  // Live telemetry passed to the 3D Mascot
  const [mascotHz, setMascotHz] = useState<number>(0);
  const [mascotRms, setMascotRms] = useState<number>(0);
  const [mascotMode, setMascotMode] = useState<
    'idle' | 'listening' | 'singing' | 'celebrating'
  >('idle');

  // Active song & catalog for Step 3 (Sing-Along Studio)
  const [songCatalog, setSongCatalog] = useState<RecommendedSong[]>(INITIAL_SONG_CATALOG);
  const [selectedSong, setSelectedSong] = useState<RecommendedSong>(INITIAL_SONG_CATALOG[0]);

  const openLab = () => {
    setMascotMode('listening');
    setActiveStep(2);
  };

  useEffect(() => {
    let mounted = true;
    const verifyHealth = async () => {
      const health = await checkBackendHealth();
      if (mounted) {
        setBackendStatus(health);
      }
    };
    verifyHealth();
    const interval = setInterval(verifyHealth, 12000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLaunchSingAlong = (song: RecommendedSong, allRanked: RecommendedSong[]) => {
    setSelectedSong(song);
    setSongCatalog(allRanked);
    setMascotMode('singing');
    setActiveStep(3);
  };

  return (
    <div className="min-h-screen bg-[#070B12] text-white selection:bg-cyan-400 selection:text-slate-950 font-sans">
      {/* Top CUE-Style Cyan-to-Mint Ribbon */}
      <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500" />

      {/* Crisp Sticky Studio Header */}
      <header className="sticky top-0 z-40 bg-[#070B12]/90 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <div
            onClick={() => setActiveStep(1)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-teal-300 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#070B12] rounded-[10px] flex items-center justify-center">
                <Mic className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-lg text-white">
                  VOCAL<span className="text-cyan-400">4</span>ACE
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Gemma 4 Audio DSP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Unlock Your Vocal DNA in 30 Seconds • Hindi & Global English
              </p>
            </div>
          </div>

          {/* Step Wizard Navigation Pills */}
          <nav className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveStep(1)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeStep === 1
                  ? 'bg-gradient-to-r from-cyan-400 to-teal-300 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              01 • Calibration & 3D Stage
            </button>
            <button
              onClick={openLab}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeStep === 2
                  ? 'bg-gradient-to-r from-cyan-400 to-teal-300 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              02 • 30s Vocal Lab & DNA
            </button>
            <button
              onClick={() => setActiveStep(3)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeStep === 3
                  ? 'bg-gradient-to-r from-cyan-400 to-teal-300 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              03 • Sing-Along Studio
            </button>
          </nav>

          {/* Live FastAPI + Local Ollama Status Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus.ollamaOnline
                  ? 'bg-emerald-400 animate-pulse'
                  : backendStatus.backendOnline
                  ? 'bg-cyan-400'
                  : 'bg-amber-400'
              }`}
            />
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-[11px] text-slate-300">
              {backendStatus.ollamaOnline
                ? `Ollama: ${backendStatus.activeModel}`
                : backendStatus.backendOnline
                ? 'FastAPI DSP Ready'
                : 'Browser WebAudio DSP'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* STEP 1: CUE-Inspired 3D Hero Stage + Phrase Calibration */}
        {activeStep === 1 && (
          <div className="space-y-10">
            {/* Hero Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-gradient-to-br from-[#0B192C] via-[#091322] to-[#070B12] border border-cyan-500/20 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
              {/* Left 7 Cols: Headline, Phrase Pack Selector & Launch CTA */}
              <div className="lg:col-span-7 space-y-6 z-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Built for HackDay Agra • Powered by Gemma 4 & Web Audio YIN DSP</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.12]">
                  Discover Your{' '}
                  <span className="bg-gradient-to-r from-cyan-300 via-teal-200 to-blue-400 bg-clip-text text-transparent">
                    True Vocal DNA
                  </span>{' '}
                  & Artist Twin in 30 Seconds.
                </h1>

                <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                  Stop singing songs in the wrong key. VOCAL4ACE extracts your real fundamental frequency (Hz),
                  comfortable octave span, and spectral timbre across 3 guided 10-second lyric snippets—matching your
                  voice to Hindi & Global English artists with instant time-synced karaoke.
                </p>

                {/* Step 1 Calibration: Choose 3-Snippet Test Pack */}
                <div className="space-y-2.5 pt-1">
                  <label className="text-xs font-mono uppercase tracking-wider text-cyan-300 block">
                    1. Select Your 30-Second (3 × 10s) Lyric Calibration Pack:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {PHRASE_PACKS.map((pack) => {
                      const isSelected = pack.id === selectedPack.id;
                      return (
                        <button
                          key={pack.id}
                          onClick={() => setSelectedPack(pack)}
                          className={`text-left p-3.5 rounded-2xl border transition-all ${
                            isSelected
                              ? 'bg-cyan-500/15 border-cyan-400 shadow-lg shadow-cyan-500/10'
                              : 'bg-slate-900/75 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{pack.label}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                            1. {pack.snippets[0].lyric.slice(0, 28)}...
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Catalog Language Filter & Primary CTA */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    onClick={() => {
                      setMascotMode('listening');
                      openLab();
                    }}
                    className="px-7 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 text-slate-950 font-extrabold text-sm tracking-wide shadow-xl shadow-cyan-500/25 hover:scale-[1.02] transition flex items-center gap-2.5"
                  >
                    <Mic className="w-5 h-5" />
                    <span>Launch 30s Vocal DNA Scanner</span>
                  </button>

                  <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl p-1">
                    {(['all', 'Hindi', 'English'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguageFilter(lang)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          languageFilter === lang
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {lang === 'all' ? 'Hindi + English' : lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right 5 Cols: Interactive 3D WebGL Astro-Cat Mascot (ACE-BOT) */}
              <div className="lg:col-span-5 z-10">
                <ThreeMascot
                  liveHz={mascotHz}
                  liveRms={mascotRms}
                  mode={mascotMode}
                />
              </div>
            </div>

            {/* CUE-Inspired Interactive Feature Tiles (4 Aces of Vocal4Ace) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#0D1522]/90 border border-slate-800/90 hover:border-cyan-400/50 transition group">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mb-3">
                  <Sliders className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-sm font-bold text-white">Ace 01 • Real YIN Pitch DSP</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Strict -42 dB RMS noise gate pauses timers during silence so only real vocal cord vibrations are
                  measured.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0D1522]/90 border border-slate-800/90 hover:border-teal-400/50 transition group">
                <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center mb-3">
                  <Cpu className="w-5 h-5 text-teal-300" />
                </div>
                <h3 className="text-sm font-bold text-white">Ace 02 • Gemma 4 Local Brain</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Streams your measured Hz & FFT spectral centroid directly into local Ollama (`gemma4:e4b`) for genuine
                  vocal coaching.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0D1522]/90 border border-slate-800/90 hover:border-blue-400/50 transition group">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mb-3">
                  <Layers className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-sm font-bold text-white">Ace 03 • Dual Artist Twin Match</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Simultaneously matches your vocal sweet spot to both Bollywood/Hindi icons and Global English pop
                  stars.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0D1522]/90 border border-slate-800/90 hover:border-emerald-400/50 transition group">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-3">
                  <Music2 className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-white">Ace 04 • Real AAC + Synced LRC</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Streams real master song previews from Apple Music with time-synced LRCLIB karaoke teleprompter
                  lyrics.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: 30s Guided Phrase Lab & Gemma 4 DNA Dashboard */}
        {activeStep === 2 && (
          <VocalLabAndDna
            selectedPack={selectedPack}
            languageFilter={languageFilter}
            onSelectSongForKaraoke={handleLaunchSingAlong}
            onLivePitchForMascot={(hz, rms) => {
              setMascotHz(hz);
              setMascotRms(rms);
            }}
          />
        )}

        {/* STEP 3: Real Song Audio & Time-Synced LRC Sing-Along Studio */}
        {activeStep === 3 && (
          <SingAlongStudio
            activeSong={selectedSong}
            catalog={songCatalog}
            onSelectSong={(song) => setSelectedSong(song)}
            onBackToDna={() => setActiveStep(2)}
            onLivePitchUpdate={(hz, rms, playing) => {
              setMascotHz(hz);
              setMascotRms(rms);
              setMascotMode(playing ? 'singing' : 'listening');
            }}
          />
        )}
      </main>
    </div>
  );
};

export default App;