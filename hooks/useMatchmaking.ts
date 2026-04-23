import { useEffect, useRef, useCallback, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { MatchMode, OpponentProfile, MatchRoom, RoundResult } from '../types';
import { MATCHMAKING_DELAY } from '../utils/constants';
import { io, Socket } from 'socket.io-client';

const SERVER_URL = 'https://pulse-7rvn.onrender.com';

class PvPSocketManager {
  private socket: Socket | null = null;
  private currentRoomId: string | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  connect(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    console.log('PvPSocketManager: Creating new socket connection');

    this.socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('PvPSocketManager: Connected!', this.socket?.id);
      this.reconnectAttempts = 0;
      this.emit('connected', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('PvPSocketManager: Disconnected', reason);
      this.emit('disconnected', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.log('PvPSocketManager: Connection error', error.message);
      this.reconnectAttempts++;
    });

    this.socket.on('round_result', (data) => {
      console.log('PvPSocketManager: Round result', data);
      this.emit('round_result', data);
    });

    this.socket.on('answer_received', () => {
      console.log('PvPSocketManager: Answer received, waiting');
      this.emit('waiting_for_opponent');
    });

    return this.socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  setRoomId(roomId: string) {
    this.currentRoomId = roomId;
    console.log('PvPSocketManager: Room ID set to', roomId);
  }

  getRoomId(): string | null {
    return this.currentRoomId;
  }

  findMatch(playerElo: number, totalRounds: number) {
    if (!this.socket) {
      this.connect();
    }
    
    if (this.socket?.connected) {
      console.log('PvPSocketManager: Emitting find_match');
      this.socket.emit('find_match', { elo: playerElo, totalRounds });
    }
  }

  submitAnswer(answer: string, timeUsed: number) {
    if (!this.socket || !this.currentRoomId) {
      console.log('PvPSocketManager: Cannot submit - no socket or room');
      return;
    }

    console.log('PvPSocketManager: Submitting answer', answer);
    this.socket.emit('submit_answer', {
      roomId: this.currentRoomId,
      answer,
      timeUsed
    });
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data?: any) {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentRoomId = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const pvpSocket = new PvPSocketManager();

export function useMatchmaking(options: { onMatchFound: (room: MatchRoom) => void }) {
  const { onMatchFound } = options;
  const isSearching = useRef(false);
  const cleanupRef = useRef<Function | null>(null);

  const findMatch = useCallback(async (mode: MatchMode, playerElo: number, totalRounds: number = 5) => {
    if (isSearching.current) return;
    isSearching.current = true;

    if (mode === 'bot') {
      const delay = Math.random() * 
        (MATCHMAKING_DELAY.max - MATCHMAKING_DELAY.min) + 
        MATCHMAKING_DELAY.min;
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const botProfile: OpponentProfile = {
        id: `bot_${Date.now()}`,
        username: generateBotUsername(),
        elo: getBotEloForPlayer(playerElo),
      };

      const room: MatchRoom = {
        id: `room_${Date.now()}`,
        players: [{ id: 'player', username: 'You', elo: playerElo }, botProfile],
        isReady: true,
        roundAnswers: [],
      };

      isSearching.current = false;
      onMatchFound(room);
      return;
    }

    const socket = pvpSocket.connect();

    socket.on('match_found', (room) => {
      console.log('PvP: Match found!', room);
      pvpSocket.setRoomId(room.id);
      isSearching.current = false;
      onMatchFound(room);
    });

    socket.on('searching', ({ position }) => {
      console.log(`PvP: Searching... position ${position}`);
    });

    socket.on('connect', () => {
      console.log('PvP: Connected!', socket.id);
      pvpSocket.findMatch(playerElo, totalRounds);
    });

    if (socket.connected) {
      pvpSocket.findMatch(playerElo, totalRounds);
    }

  }, [onMatchFound]);

  const cancelSearch = useCallback(() => {
    pvpSocket.disconnect();
    isSearching.current = false;
  }, []);

  useEffect(() => {
    return () => {
      // Don't disconnect on unmount - keep socket alive for battle
    };
  }, []);

  return { findMatch, cancelSearch, isSearching: isSearching.current };
}

export function usePvPGame() {
  const [state, setState] = useState({
    connected: false,
    roundResult: null as { playerResult: RoundResult; opponentResult: RoundResult } | null,
    waitingForOpponent: false,
  });

  useEffect(() => {
    console.log('usePvPGame: Setting up listeners');

    const handleRoundResult = (data: any) => {
      console.log('usePvPGame: Round result received', data);
      setState({
        connected: true,
        roundResult: data,
        waitingForOpponent: false,
      });
    };

    const handleWaiting = () => {
      console.log('usePvPGame: Waiting for opponent');
      setState(s => ({ ...s, waitingForOpponent: true }));
    };

    const handleConnected = () => {
      console.log('usePvPGame: Connected');
      setState(s => ({ ...s, connected: true }));
    };

    const handleDisconnected = () => {
      console.log('usePvPGame: Disconnected');
      setState(s => ({ ...s, connected: false }));
    };

    pvpSocket.on('round_result', handleRoundResult);
    pvpSocket.on('waiting_for_opponent', handleWaiting);
    pvpSocket.on('connected', handleConnected);
    pvpSocket.on('disconnected', handleDisconnected);

    setState(s => ({ ...s, connected: pvpSocket.isConnected() }));

    return () => {
      pvpSocket.off('round_result', handleRoundResult);
      pvpSocket.off('waiting_for_opponent', handleWaiting);
      pvpSocket.off('connected', handleConnected);
      pvpSocket.off('disconnected', handleDisconnected);
    };
  }, []);

  const submitAnswer = useCallback((answer: string, timeUsed: number) => {
    pvpSocket.submitAnswer(answer, timeUsed);
    setState(s => ({ ...s, waitingForOpponent: true }));
  }, []);

  const clearRoundResult = useCallback(() => {
    setState(s => ({ ...s, roundResult: null }));
  }, []);

  return {
    connected: state.connected,
    roundResult: state.roundResult,
    waitingForOpponent: state.waitingForOpponent,
    submitAnswer,
    clearRoundResult,
  };
}

function generateBotUsername(): string {
  const adjectives = ['Cyber', 'Net', 'Data', 'Byte', 'Hack', 'Secure', 'Zero', 'Crypto'];
  const nouns = ['Ninja', 'Guardian', 'Hunter', 'Breaker', 'Master', 'Defender', 'Wolf', 'Fox'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 99);
  return `${adj}${noun}${num}`;
}

function getBotEloForPlayer(playerElo: number): number {
  const min = Math.max(800, playerElo - 150);
  const max = Math.min(2200, playerElo + 150);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}