import { useEffect, useRef, useCallback, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { MatchMode, OpponentProfile, MatchRoom, RoundResult } from '../types';
import { MATCHMAKING_DELAY } from '../utils/constants';
import { simulateOpponentAnswer } from '../utils/matchSimulator';
import { io, Socket } from 'socket.io-client';

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3001';

let sharedSocket: Socket | null = null;
let currentRoomId: string | null = null;

export function getSharedSocket(): Socket | null {
  return sharedSocket;
}

export function getCurrentRoomId(): string | null {
  return currentRoomId;
}

interface UseMatchmakingOptions {
  onMatchFound: (room: MatchRoom) => void;
}

export function useMatchmaking(options: UseMatchmakingOptions) {
  const { onMatchFound } = options;
  const isSearching = useRef(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    try {
      console.log('PvP: Connecting to', SERVER_URL);
      
      // Reuse existing socket or create new one
      if (!sharedSocket || !sharedSocket.connected) {
        sharedSocket = io(SERVER_URL, {
          transports: ['websocket', 'polling']
        });
      }

      const socket = sharedSocket;

      socket.on('connect', () => {
        console.log('PvP: Connected! Socket ID:', socket.id);
        socket.emit('find_match', { elo: playerElo, totalRounds });
      });

      socket.on('connect_error', (error) => {
        console.log('PvP: Connection error:', error.message);
      });

      socket.on('match_found', (room) => {
        console.log('PvP: Match found!', room);
        currentRoomId = room.id;
        isSearching.current = false;
        onMatchFound(room);
      });

      socket.on('searching', ({ position }) => {
        console.log(`PvP: Searching... position ${position}`);
      });

      // If already connected, emit immediately
      if (socket.connected) {
        socket.emit('find_match', { elo: playerElo, totalRounds });
      }

    } catch (error) {
      isSearching.current = false;
      throw error;
    }
  }, [onMatchFound]);

  const cancelSearch = useCallback(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
      searchTimeout.current = null;
    }
    if (sharedSocket) {
      sharedSocket.emit('cancel_search');
      sharedSocket.disconnect();
      sharedSocket = null;
      currentRoomId = null;
    }
    isSearching.current = false;
  }, []);

  return { findMatch, cancelSearch, isSearching: isSearching.current };
}

// Reusable PvP game hook that uses shared socket
export function usePvPGame() {
  const [state, setState] = useState({
    connected: false,
    roundResult: null as { playerResult: RoundResult; opponentResult: RoundResult } | null,
    waitingForOpponent: false,
  });

  const roundResultRef = useRef<{ playerResult: RoundResult; opponentResult: RoundResult } | null>(null);

  useEffect(() => {
    if (!sharedSocket || !currentRoomId) return;

    console.log('PvP Game: Setting up listeners for room', currentRoomId);

    const socket = sharedSocket;

    socket.on('round_result', (data) => {
      console.log('PvP Game: Round result received', data);
      roundResultRef.current = data;
      setState({
        connected: true,
        roundResult: data,
        waitingForOpponent: false
      });
    });

    socket.on('answer_received', () => {
      console.log('PvP Game: Waiting for opponent');
      setState(s => ({ ...s, waitingForOpponent: true }));
    });

    socket.on('disconnect', () => {
      console.log('PvP Game: Disconnected');
      setState(s => ({ ...s, connected: false }));
    });

    setState(s => ({ ...s, connected: socket.connected }));

    return () => {
      // Don't remove listeners - keep socket alive
    };
  }, []);

  const submitAnswer = useCallback((answer: string, timeUsed: number) => {
    if (!sharedSocket || !currentRoomId) return;
    
    sharedSocket.emit('submit_answer', {
      roomId: currentRoomId,
      answer,
      timeUsed
    });
    
    setState(s => ({ ...s, waitingForOpponent: true }));
    console.log('PvP Game: Submitted answer', answer);
  }, []);

  const clearRoundResult = useCallback(() => {
    roundResultRef.current = null;
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

export function getOpponentResultForPvP(
  question: { id: string; correctAnswer: string },
  playerAnswer: string | null,
  botElo: number,
  roundNumber: number,
  isCorrect: boolean,
  pointsEarned: number,
  timeUsed: number
): RoundResult {
  return {
    roundNumber,
    questionId: question.id,
    playerAnswer,
    correctAnswer: question.correctAnswer,
    isCorrect,
    pointsEarned,
    timeUsed,
    lifelineUsedThisRound: false,
  };
}