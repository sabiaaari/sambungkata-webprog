"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";
import TugOfWarArena from "@/components/TugOfWarArena";

/**
 * 1. SUPABASE CONFIGURATION
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = (supabaseUrl !== "" && supabaseKey !== "") 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

/**
 * TYPES & INTERFACES
 */
type ScreenState = "HOME" | "LOBBY" | "ARENA" | "RESULT";
type Turn = "P1" | "P2"; 

interface WinnerData {
  name: string;
  score: number;
  avgTime: string;
}

interface GamePayload {
  currentScreen?: ScreenState;
  currentPhrase?: string;
  ropePosition?: number;
  currentTurn?: Turn;
  timeLeft?: number;
  actionPlayer?: string;
  winnerData?: WinnerData;
  usedPhrases?: string[];
}

/**
 * UI COMPONENTS
 */
const Cloud = ({ className }: { className?: string }) => (
  <div className={`absolute bg-white rounded-full opacity-60 blur-sm ${className}`} />
);

export default function SambungCepat() {
  // 1. ALL STATES & REFS (AT THE TOP)
  const [currentScreen, setCurrentScreen] = useState<ScreenState>("HOME");
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const [currentPhrase, setCurrentPhrase] = useState("Meja Makan");
  const [currentTurn, setCurrentTurn] = useState<Turn>("P1");
  const [ropePosition, setRopePosition] = useState(0); 
  const [timeLeft, setTimeLeft] = useState(10);
  const [inputValue, setInputValue] = useState("");
  
  const [stats, setStats] = useState({ 
    totalCorrect: 0, 
    totalTime: 0, 
    turns: 0 
  });
  const [winnerData, setWinnerData] = useState<WinnerData | null>(null);
  const [usedPhrases, setUsedPhrases] = useState<string[]>(["meja makan"]);
  const [isYourTurn, setIsYourTurn] = useState(false);

  const [isMuted, setIsMuted] = useState(false);
  const [warning, setWarning] = useState("");
  const [shouldShake, setShouldShake] = useState(false);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 2. AUDIO FUNCTIONS
  const playClickSound = useCallback(() => {
    if (isMuted) return;
    const clickAudio = new Audio('/sounds/click.ogg');
    clickAudio.play().catch(() => {}); 
  }, [isMuted]);

  const startBGM = useCallback(() => {
    if (!bgmRef.current) {
      const clickAudio = new Audio('/sounds/bgm.mp3');
      clickAudio.loop = true;
      clickAudio.volume = 0.3;
      bgmRef.current = clickAudio;
    }
    if (!isMuted) {
      bgmRef.current.play().catch(() => {});
    }
  }, [isMuted]);

  useEffect(() => {
    if (bgmRef.current) {
      if (isMuted) {
        bgmRef.current.pause();
      } else {
        bgmRef.current.play().catch(() => {});
      }
    }
  }, [isMuted]);

  // 3. BROADCAST HELPER
  const broadcastUpdate = useCallback((payload: GamePayload) => {
    if (channelRef.current && isConnected) {
      channelRef.current.send({
        type: "broadcast",
        event: "game_update",
        payload,
      });
    }
  }, [isConnected]);

  // 4. DATA SYNC HELPER (FOR WEBSOCKETS)
  const syncStateWithServer = useCallback((serverPayload: { newWord: string, ropePos: number, isMyTurn: boolean, lastPlayerName: string }) => {
    setCurrentPhrase(serverPayload.newWord);
    setRopePosition(serverPayload.ropePos);
    setIsYourTurn(serverPayload.isMyTurn);
    setUsedPhrases((prev) => [...prev, serverPayload.newWord.toLowerCase()]);

    // Suara untuk pergerakan lawan
    playClickSound();
  }, [playClickSound]);

  useEffect(() => {
    // =================================================================
    // 🚀 TODO TEAM 3 (WEBSOCKETS): AREA INTEGRASI SOCKET.IO / PUSHER
    // =================================================================
    if (!roomCode || !supabase || currentScreen !== "ARENA") return;

    // Listen to changes in the Room table
    const channel = supabase
      .channel(`db-room-${roomCode}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Room",
          filter: `roomCode=eq.${roomCode}`,
        },
        async (payload) => {
          const updatedRoom = payload.new;

          // Fetch current players to calculate turn and score
          const { data: players } = await supabase
            .from("Player")
            .select("*")
            .eq("roomId", updatedRoom.id)
            .order("id", { ascending: true });

          if (players && players.length >= 2) {
            const p1 = players[0];
            const p2 = players[1];
            
            // Calculate rope position based on score difference (P2 score - P1 score) * 10
            const calculatedRopePos = (p2.score - p1.score) * 10;
            
            const currentPlayer = players[updatedRoom.turnIndex];
            const isMyTurnNow = currentPlayer?.username === playerName;

            syncStateWithServer({
              newWord: updatedRoom.currentWord || "",
              ropePos: calculatedRopePos,
              isMyTurn: isMyTurnNow,
              lastPlayerName: updatedRoom.turnIndex === 0 ? p2.username : p1.username
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // =================================================================
  }, [supabase, roomCode, currentScreen, playerName, syncStateWithServer]);

  // ERROR TRIGGER (SHAKE + WARNING)
  const triggerError = (msg: string) => {
    setWarning(msg);
    setShouldShake(true);
    // Hentikan getar setelah 500ms
    setTimeout(() => {
      setShouldShake(false);
    }, 500);
    // Hapus teks peringatan setelah 2 detik
    setTimeout(() => {
      setWarning("");
    }, 2000);
  };

  // 4. LOGIC: Handle Main Lagi (Reset State)
  const handleMainLagi = () => {
    playClickSound();
    // Reset State Permainan
    setRopePosition(0);
    setCurrentPhrase("Meja Makan");
    setUsedPhrases(["meja makan"]);
    setStats({ totalCorrect: 0, totalTime: 0, turns: 0 });
    setWinnerData(null);
    setWarning("");
    setInputValue("");
    setTimeLeft(10);
    setCurrentTurn("P1");
    // Pindah ke Home
    setCurrentScreen("HOME");
  };

  // 5. DEV TOOL: Handle screen jumping
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const screenParam = params.get("screen");

    if (screenParam === "LOBBY" || screenParam === "ARENA" || screenParam === "RESULT") {
      setCurrentScreen(screenParam as ScreenState);
      setPlayerName("TESTER");
      setRoomCode("DEV123");
      setIsHost(true);
      setIsConnected(true);
      if (screenParam === "RESULT") {
        setWinnerData({
          name: "TESTER",
          score: 12,
          avgTime: "2.4"
        });
      }
    }
  }, []);

  // 6. SUPABASE CONNECTION EFFECT
  useEffect(() => {
    if (!roomCode || currentScreen === "HOME" || !supabase) {
      return;
    }

    const channelName = `room-${roomCode}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true },
      },
    });

    channel
      .on("broadcast", { event: "game_update" }, ({ payload }: { payload: GamePayload }) => {
        if (payload.currentScreen) setCurrentScreen(payload.currentScreen);
        if (payload.currentPhrase) setCurrentPhrase(payload.currentPhrase);
        if (payload.ropePosition !== undefined) setRopePosition(payload.ropePosition);
        if (payload.currentTurn) setCurrentTurn(payload.currentTurn);
        if (payload.timeLeft !== undefined) setTimeLeft(payload.timeLeft);
        if (payload.winnerData) setWinnerData(payload.winnerData);
        if (payload.usedPhrases) setUsedPhrases(payload.usedPhrases);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      setIsConnected(false);
    };
  }, [roomCode, currentScreen]);

  // 7. GAME LOGIC FUNCTIONS
  const handleStartGame = async () => {
    if (!isHost) return;

    const res = await fetch("/api/rooms/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        roomCode
      })
    });

    if (res.ok) {
      broadcastUpdate({
        currentScreen: "ARENA",
      });
      setCurrentScreen("ARENA");
    } else {
      const data = await res.json().catch(() => ({}));
      triggerError(data?.error || "Minimal 2 pemain!");
    }
  };

  const checkWinner = (newPos: number) => {
    if (newPos <= -100 || newPos >= 100) {
      const winner = newPos <= -100 ? "P1" : "P2";
      const winName = winner === "P1" ? (isHost ? playerName : "Lawan") : (!isHost ? playerName : "Lawan");
      const avg = stats.turns > 0 ? (stats.totalTime / stats.turns).toFixed(1) : "0";
      
      // TUNGGU 1 DETIK SEBELUM KE RESULT
      setTimeout(() => {
        broadcastUpdate({
          currentScreen: "RESULT",
          winnerData: {
            name: winName,
            score: stats.totalCorrect,
            avgTime: avg
          }
        });
      }, 1000);
    }
  };

  const handleKirim = () => {
    // 1. Normalisasi String
    const normalizedInput = inputValue.trim().replace(/\s+/g, ' ');
    if (!normalizedInput) return;

    const lowerInput = normalizedInput.toLowerCase();
    const lowerCurrent = currentPhrase.toLowerCase();

    // 2. Cek Duplikasi (History)
    if (usedPhrases.includes(lowerInput)) {
      triggerError("Frasa ini sudah pernah digunakan! Cari kombinasi lain.");
      return;
    }

    // 3. Pecah frasa saat ini dan input menjadi array
    const currentWords = lowerCurrent.split(' ');
    const inputWords = lowerInput.split(' ');

    // 4. Validasi: Tepat 2 kata
    if (inputWords.length !== 2) {
      triggerError("Masukkan tepat 2 kata!");
      return;
    }

    // 5. Validasi: Apakah kata-kata ada di database Supabase?
    if (supabase) {
      const { data: dict1 } = await supabase
        .from("Dictionary")
        .select("id")
        .eq("word", inputWords[0])
        .single();
        
      const { data: dict2 } = await supabase
        .from("Dictionary")
        .select("id")
        .eq("word", inputWords[1])
        .single();

      if (!dict1 || !dict2) {
        const invalidWord = !dict1 ? inputWords[0] : inputWords[1];
        triggerError(`Kata "${invalidWord.toUpperCase()}" tidak ada di database!`);
        return;
      }
    } else {
      // Fallback ke local jika supabase tidak terkoneksi (opsional)
      if (!isValidWord(inputWords[0]) || !isValidWord(inputWords[1])) {
        const invalidWord = !isValidWord(inputWords[0]) ? inputWords[0] : inputWords[1];
        triggerError(`Kata "${invalidWord.toUpperCase()}" tidak ada di database!`);
        return;
      }
    }

    // 6. Validasi: Kata pertama input harus sama dengan kata kedua frasa saat ini
    if (inputWords[0] === currentWords[1]) {
      setWarning("");
      playClickSound();
      
      const nextTurn: Turn = currentTurn === "P1" ? "P2" : "P1";
      const moveDirection = currentTurn === "P1" ? -10 : 10;
      const newPos = Math.max(-100, Math.min(100, ropePosition + moveDirection));

      const timeUsed = 10 - timeLeft;
      setStats(prev => ({
        totalCorrect: prev.totalCorrect + 1,
        totalTime: prev.totalTime + timeUsed,
        turns: prev.turns + 1
      }));

      const newUsedPhrases = [...usedPhrases, lowerInput];
      setUsedPhrases(newUsedPhrases);

      // 🔥 UPDATE KE BACKEND PRISMA
      // Kita panggil API tapi tetap broadcast untuk sinkronisasi instan UI (Rope & Turn)
      fetch("/api/rooms/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode, username: playerName, word: normalizedInput }),
      }).catch(err => console.error("API Play Error:", err));

      broadcastUpdate({
        currentPhrase: normalizedInput,
        ropePosition: newPos,
        currentTurn: nextTurn,
        timeLeft: 10,
        usedPhrases: newUsedPhrases,
      });
      setInputValue("");
      checkWinner(newPos);
    } else {
      triggerError(`Kata pertama harus "${currentWords[1].toUpperCase()}"!`);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentScreen === "ARENA" && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && currentScreen === "ARENA") {
      const myPlayerRole: Turn = isHost ? "P1" : "P2";
      if (currentTurn === myPlayerRole) {
        const nextTurn: Turn = currentTurn === "P1" ? "P2" : "P1";
        const penalty = currentTurn === "P1" ? 15 : -15;
        broadcastUpdate({
          ropePosition: Math.max(-100, Math.min(100, ropePosition + penalty)),
          currentTurn: nextTurn,
          timeLeft: 10,
        });
      }
    }
    return () => clearInterval(timer);
  }, [currentScreen, timeLeft, currentTurn, isHost, ropePosition, broadcastUpdate]);

  const isMyTurn = (isHost && currentTurn === "P1") || (!isHost && currentTurn === "P2");

  const getTimerColor = () => {
    if (timeLeft > 5) return "bg-green-400";
    if (timeLeft > 3) return "bg-yellow-400";
    return "bg-red-400";
  };

  const handleCreateRoom = async () => {
    if (!playerName.trim()) return;

    const res = await fetch("/api/rooms/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: playerName }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      triggerError(data?.error || "Gagal membuat ruangan");
      return;
    }

    const data: { roomCode?: string } = await res.json();
    if (!data.roomCode) {
      triggerError("Backend tidak mengembalikan roomCode");
      return;
    }

    setRoomCode(data.roomCode);
    setIsHost(true);
    setCurrentScreen("LOBBY");
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim() || !roomCode) return;

    const res = await fetch("/api/rooms/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomCode,
        username: playerName,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      triggerError(data?.error || "Gagal bergabung");
      return;
    }

    setIsHost(false);
    setCurrentScreen("LOBBY");
    
    // Beritahu host bahwa ada yang bergabung (jika sudah subscribe)
    setTimeout(() => {
      broadcastUpdate({
        actionPlayer: playerName
      });
    }, 1000);
  };

  const springTransition = { type: "spring" as const, stiffness: 100, damping: 10 };

  const standardShellClass = "flex-1 w-full max-w-md md:max-w-2xl lg:max-w-4xl mx-auto flex flex-col p-4 md:p-8 min-h-0 relative overflow-hidden";

  return (
    <main className="h-[100dvh] w-full bg-sky-400 text-blue-950 font-sans overflow-hidden relative flex flex-col">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Cloud className="w-32 h-16 md:w-64 md:h-32 top-10 -left-10 md:-left-20" />
        <Cloud className="w-40 h-20 md:w-80 md:h-40 top-40 -right-10 md:-right-20" />
        <Cloud className="w-24 h-12 md:w-48 md:h-24 bottom-20 left-1/4" />
        <Cloud className="w-48 h-24 md:w-96 md:h-48 top-1/2 right-1/4" />
      </div>

      {/* AUDIO TOGGLE BUTTON */}
      <button 
        onClick={() => { setIsMuted(!isMuted); playClickSound(); startBGM(); }}
        className="fixed top-4 right-4 z-50 bg-white/80 backdrop-blur-sm w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-2xl border-2 border-sky-100 hover:scale-110 active:scale-95 transition-all"
      >
        {isMuted ? "🔇" : "🔊"}
      </button>

      <AnimatePresence mode="wait">
        {/* --- SCREEN: HOME --- */}
        {currentScreen === "HOME" && (
          <motion.div 
            key="home" 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.8 }} 
            transition={springTransition}
            className="w-full h-full overflow-y-auto flex flex-col items-center py-8 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            <div className="w-full flex flex-col items-center gap-6">
              <div className="bg-white border-b-8 border-slate-200 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl w-full max-w-sm md:max-w-md text-center flex flex-col gap-4 md:gap-8 shrink-0">
                <motion.h1 
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="text-4xl md:text-6xl font-black tracking-tight text-orange-500 leading-none shrink-0"
                >
                  SAMBUNG<br /><span className="text-yellow-400">KATA!</span>
                </motion.h1>
                
                <div className="flex flex-col gap-4 md:gap-6 shrink-0">
                  <input 
                    type="text" 
                    placeholder="NAMA KAMU..." 
                    value={playerName} 
                    onChange={(e) => { setPlayerName(e.target.value); startBGM(); }} 
                    className="w-full px-4 py-3 md:px-6 md:py-5 bg-sky-50 rounded-2xl font-black outline-none border-4 border-sky-100 focus:border-yellow-400 transition-all text-center uppercase placeholder:text-blue-300 text-lg md:text-xl shrink-0"
                  />

                  <div className="flex flex-col gap-3 md:gap-4 shrink-0">
                    <button 
                      onClick={() => { playClickSound(); startBGM(); handleCreateRoom(); }} 
                      className="bg-yellow-400 border-b-4 md:border-b-8 border-yellow-600 active:border-b-0 active:translate-y-1 text-yellow-950 font-black py-3 md:py-5 rounded-2xl md:rounded-3xl text-xl md:text-2xl uppercase shadow-md shrink-0"
                    >
                      Buat Ruangan
                    </button>
                    
                    <div className="flex flex-col gap-2 p-3 md:p-4 bg-sky-100 rounded-[2rem] border-4 border-sky-200 shadow-inner shrink-0">
                      <input 
                        type="text" 
                        placeholder="KODE" 
                        value={roomCode} 
                        onChange={(e) => { setRoomCode(e.target.value.toUpperCase()); startBGM(); }} 
                        className="w-full px-4 py-2 bg-white rounded-xl font-black text-center text-orange-500 outline-none border-2 border-transparent focus:border-orange-400 shrink-0" 
                      />
                      <button 
                        onClick={() => { playClickSound(); startBGM(); handleJoinRoom(); }} 
                        className="bg-orange-400 border-b-4 border-orange-600 active:border-b-0 active:translate-y-1 text-orange-950 font-black py-2 rounded-xl text-base uppercase shrink-0"
                      >
                        Gabung!
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* KOTAK INFORMASI CARA BERMAIN - GLASSMORPHISM STYLE */}
              <div className="bg-gradient-to-b from-white/90 to-white/70 backdrop-blur-md border-2 border-white/80 rounded-3xl p-6 shadow-xl w-full max-w-md mx-auto mt-2 mb-8 shrink-0 relative overflow-hidden">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-sky-400/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-yellow-400/10 rounded-full blur-xl" />
                
                <h3 className="flex items-center justify-center gap-2 text-xl font-extrabold text-sky-600 mb-5 border-b-2 border-sky-100/50 pb-3">
                  🎮 CARA BERMAIN
                </h3>
                
                <div className="flex flex-col gap-1">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-sky-400 flex items-center justify-center text-white font-bold shadow-sm text-sm">🔤</div>
                    <p className="text-sm md:text-base text-slate-700 font-medium leading-relaxed">
                      Sambung <b>kata terakhir</b> lawan menjadi <b>kata pertama</b> di kalimatmu!
                    </p>
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-white font-bold shadow-sm text-sm">⚡</div>
                    <p className="text-sm md:text-base text-slate-700 font-medium leading-relaxed">
                      Contoh: MEJA <b>MAKAN</b> ➡️ <b>MAKAN</b> MALAM. (Minimal 2 kata).
                    </p>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold shadow-sm text-sm">🏆</div>
                    <p className="text-sm md:text-base text-slate-700 font-medium leading-relaxed">
                      Tarik tali sampai ke posisimu untuk memenangkan pertandingan!
                    </p>
                  </div>
                </div>
              </div>

              {/* COPYRIGHT FOOTER */}
              <div className="mt-auto py-6 text-center shrink-0">
                <p className="text-[10px] md:text-xs font-bold text-white/60 uppercase tracking-[0.2em]">
                  &copy; {new Date().getFullYear()} SAMBUNG KATA
                </p>
                <p className="text-[10px] md:text-xs font-black text-white/80 uppercase tracking-widest mt-1">
                  KELOMPOK 22 • AZALIA • SIPA • SYAILA • SIXTA
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* --- SCREEN: LOBBY --- */}
        {currentScreen === "LOBBY" && (
          <motion.div 
            key="lobby" 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9 }} 
            transition={springTransition}
            className={standardShellClass}
          >
            <div className="m-auto w-full flex flex-col items-center">
              <div className="bg-white border-b-8 border-slate-200 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl w-full max-w-sm md:max-w-md text-center flex flex-col gap-4 md:gap-8 max-h-full overflow-y-auto shrink-0 no-scrollbar">
                <h2 className="text-2xl md:text-3xl font-black uppercase text-blue-900 shrink-0">Ruang Tunggu</h2>
                
                <div className="bg-sky-400 p-6 md:p-8 rounded-[2rem] border-b-8 border-sky-600 shadow-inner shrink-0">
                  <p className="text-xs font-black uppercase tracking-widest text-white mb-1">Kode Ruangan:</p>
                  <p className="text-4xl md:text-6xl font-black text-white tracking-widest">{roomCode}</p>
                </div>
                
                <div className="flex flex-col gap-2 shrink-0">
                  <p className="text-base font-black text-blue-900/60 uppercase">
                    {isHost ? "Kamu adalah Host" : "Berhasil Bergabung!"}
                  </p>
                  <div className="flex flex-col items-center gap-2">
                      <div className="flex gap-2 justify-center">
                        {[0,1,2].map(i => (
                          <motion.div 
                            key={i} 
                            animate={{ scale: [1, 1.2, 1], y: [0, -6, 0] }} 
                            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} 
                            className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} border-2 border-white`} 
                          />
                        ))}
                      </div>
                  </div>
                </div>

                {isHost ? (
                  <button 
                    onClick={() => { playClickSound(); handleStartGame(); }} 
                    className={`w-full py-4 md:py-6 rounded-2xl md:rounded-3xl font-black uppercase text-xl md:text-2xl border-b-4 md:border-b-8 shadow-lg shrink-0 bg-yellow-400 text-yellow-950 border-yellow-600 active:border-b-0 active:translate-y-1`}
                  >
                    GAS MULAI!
                  </button>
                ) : (
                  <div className="bg-sky-100 p-4 rounded-xl border-4 border-sky-200 animate-bounce shrink-0">
                    <p className="font-black text-sm text-blue-600 uppercase">Menunggu Host...</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* --- SCREEN: ARENA --- */}
        {currentScreen === "ARENA" && (
          <motion.div 
            key="arena" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={springTransition}
            className="h-[100dvh] w-full max-w-md md:max-w-2xl lg:max-w-4xl mx-auto flex flex-col px-4 pb-4 overflow-hidden relative z-10"
          >
            {/* 1. TOP PART: ENLARGED TUG OF WAR ANIMATION (flex-1) */}
            <div className="flex-1 min-h-0 flex items-center justify-center w-full relative mb-2">
              <TugOfWarArena ropePosition={ropePosition + 50} />
            </div>

            {/* 2. MIDDLE PART: WORD CARD (shrink-0) */}
            <div className="shrink-0 z-20 mb-6 flex flex-col items-center justify-center w-full max-w-lg mx-auto">
              <motion.div 
                layout
                className="bg-white border-b-8 border-slate-200 p-4 md:p-6 rounded-[2rem] md:rounded-[3rem] text-center w-full shadow-xl relative"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 border-2 border-white px-4 py-0.5 rounded-full font-black text-yellow-950 text-[10px] md:text-sm whitespace-nowrap shadow-sm">
                   KATA SAAT INI
                </div>

                <h2 className="text-xl md:text-3xl lg:text-4xl font-black uppercase tracking-tight leading-tight mb-2 md:mb-4 text-blue-950 break-words">
                   {currentPhrase.split(" ").map((w, i, arr) => (
                     <span key={i} className={i === arr.length - 1 ? "text-orange-500" : ""}>
                        {w}{" "}
                     </span>
                   ))}
                </h2>

                <div className="h-4 md:h-5 w-full bg-slate-100 rounded-full p-1 border-2 border-slate-200 shadow-inner overflow-hidden">
                  <motion.div 
                    initial={{ width: "100%" }}
                    animate={{ width: `${timeLeft * 10}%` }}
                    className={`h-full rounded-full transition-colors duration-500 ${getTimerColor()} border-b-2 border-black/10`}
                  />
                </div>
              </motion.div>
            </div>

            {/* 3. BOTTOM PART: REFINED BADGE & INPUT (shrink-0) */}
            <footer className="w-full max-w-xl mx-auto flex flex-col items-center mt-auto shrink-0 pb-6 px-2 relative z-30">
              <AnimatePresence mode="wait">
                {warning ? (
                  <motion.div 
                    key="warning"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    className="py-1.5 px-6 rounded-full text-sm font-black uppercase tracking-widest shadow-md mb-3 z-10 border-b-2 bg-red-500 text-white border-red-700"
                  >
                    {warning}
                  </motion.div>
                ) : (
                  <motion.div 
                    key={isMyTurn ? "my-turn" : "waiting"}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    className={`py-1.5 px-6 rounded-full text-sm font-black uppercase tracking-widest shadow-md mb-3 z-10 border-b-2 ${isMyTurn ? "bg-[#10b981] text-slate-900 border-green-700/30 animate-bounce" : "bg-white text-slate-400 border-slate-200"}`}
                  >
                    {isMyTurn ? "GILIRAN KAMU!" : "TUNGGU LAWAN..."}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="w-full bg-white p-2 md:p-3 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center gap-2 md:gap-3 relative z-0 border-b-4 border-slate-200">
                <input 
                  ref={inputRef}
                  disabled={!isMyTurn}
                  autoFocus
                  type="text"
                  placeholder={isMyTurn ? "KETIK DI SINI..." : "SABAR YA..."}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (playClickSound(), handleKirim())}
                  className={`flex-1 w-full px-5 py-3 md:py-4 bg-sky-50/50 rounded-xl md:rounded-2xl text-lg md:text-xl font-black outline-none border-2 transition-all uppercase disabled:bg-slate-50 placeholder:text-slate-300 ${shouldShake ? 'animate-shake' : 'border-transparent focus:border-blue-400'}`}
                />
                <button 
                  disabled={!isMyTurn}
                  onClick={() => { playClickSound(); handleKirim(); }}
                  className={`w-full md:w-auto px-8 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-lg md:text-xl uppercase border-b-4 transition-all shadow-md shrink-0 ${isMyTurn ? 'bg-yellow-400 text-yellow-950 border-yellow-600 active:border-b-0 active:translate-y-1' : 'bg-slate-200 text-slate-400 border-slate-300'}`}
                >
                  KIRIM!
                </button>
              </div>
            </footer>
          </motion.div>
        )}

        {/* --- SCREEN: RESULT --- */}
        {currentScreen === "RESULT" && winnerData && (
          <motion.div 
            key="result" 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={springTransition}
            className={standardShellClass}
          >
            <div className="m-auto w-full flex flex-col items-center">
              <div className="bg-white border-b-8 border-slate-200 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl w-full max-w-sm md:max-w-md text-center flex flex-col gap-4 md:gap-8 max-h-full overflow-y-auto shrink-0 no-scrollbar">
                <div className="flex justify-center shrink-0">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [-5, 5, -5] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="text-5xl md:text-6xl shrink-0"
                  >
                    🏆
                  </motion.div>
                </div>

                <h2 className="text-2xl md:text-3xl font-black uppercase text-blue-900 leading-tight shrink-0">Permainan Selesai!</h2>
                
                <div className="bg-yellow-400 p-5 md:p-6 rounded-[2rem] border-b-8 border-yellow-600 shadow-md shrink-0">
                  <p className="text-[10px] font-black uppercase text-yellow-950 mb-1 shrink-0">Pemenangnya:</p>
                  <p className="text-3xl md:text-4xl font-black text-white uppercase truncate shrink-0">{winnerData.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 shrink-0">
                  <div className="bg-sky-100 p-3 rounded-2xl border-b-4 border-sky-200 shrink-0">
                    <p className="text-[9px] font-black text-blue-400 uppercase">Total Kata</p>
                    <p className="text-xl md:text-2xl font-black text-blue-900">{winnerData.score}</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-2xl border-b-4 border-orange-200 shrink-0">
                    <p className="text-[9px] font-black text-orange-400 uppercase">Avg Waktu</p>
                    <p className="text-xl md:text-2xl font-black text-orange-600">{winnerData.avgTime}s</p>
                  </div>
                </div>

                <button 
                  onClick={handleMainLagi}
                  className="w-full bg-emerald-500 border-b-8 border-emerald-700 active:border-b-0 active:translate-y-2 text-white font-black py-4 md:py-5 rounded-2xl md:rounded-3xl text-xl md:text-2xl uppercase shadow-lg shrink-0"
                >
                  Main Lagi!
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
