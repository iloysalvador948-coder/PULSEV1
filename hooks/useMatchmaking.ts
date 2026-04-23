import { useEffect, useRef, useCallback, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { MatchMode, OpponentProfile, MatchRoom, RoundResult, Question } from '../types';
import { MATCHMAKING_DELAY } from '../utils/constants';
import { simulateOpponentAnswer } from '../utils/matchSimulator';
import { io, Socket } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3001';

interface UseMatchmakingOptions {
  onMatchFound: (room: MatchRoom) => void;
}

export function useMatchmaking(options: UseMatchmakingOptions) {
  const { onMatchFound } = options;
  const isSearching = useRef(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<Socket | null>(null);

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
      const socket = io(SERVER_URL, {
        transports: ['websocket', 'polling']
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('PvP: Connected! Socket ID:', socket.id);
        socket.emit('find_match', { elo: playerElo, totalRounds });
      });

      socket.on('connect_error', (error) => {
        console.log('PvP: Connection error:', error.message);
      });

      socket.on('match_found', (room) => {
        console.log('PvP: Match found!', room);
        isSearching.current = false;
        onMatchFound(room);
      });

      socket.on('searching', ({ position }) => {
        console.log(`PvP: Searching... position ${position}`);
      });

      socket.on('disconnect', () => {
        console.log('PvP: Disconnected');
      });

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
    if (socketRef.current) {
      socketRef.current.emit('cancel_search');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    isSearching.current = false;
  }, []);

  return { findMatch, cancelSearch, isSearching: isSearching.current };
}

export function usePvPMatch(roomId: string | null) {
  const store = useGameStore.getState();
  const [connected, setConnected] = useState(false);
  const [opponentAnswer, setOpponentAnswer] = useState<RoundResult | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const ws = connectToMatchRoom(roomId);
    setConnected(true);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleNetworkMessage(message);
    };

    ws.onclose = () => {
      setConnected(false);
    };

    return () => {
      ws.close();
      setConnected(false);
    };
  }, [roomId]);

  const handleNetworkMessage = (message: { type: string; payload: unknown }) => {
    switch (message.type) {
      case 'answer_submitted':
        setOpponentAnswer(message.payload as RoundResult);
        break;
    }
  };

  const submitAnswer = useCallback(async (answer: string) => {
    if (!roomId) return;
    await matchmakingApi_submitAnswer(roomId, answer);
  }, [roomId]);

  const waitForOpponent = useCallback(async (): Promise<RoundResult> => {
    return new Promise((resolve) => {
      const checkAnswer = setInterval(() => {
        if (opponentAnswer) {
          clearInterval(checkAnswer);
          resolve(opponentAnswer);
        }
      }, 100);
    });
  }, [opponentAnswer]);

  return { connected, submitAnswer, waitForOpponent };
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

function connectToMatchRoom(roomId: string): WebSocket {
  const wsUrl = `wss://your-server.com/match/${roomId}`;
  return new WebSocket(wsUrl);
}

async function matchmakingApi_findMatch(playerElo: number): Promise<MatchRoom> {
  const response = await fetch('https://your-api.com/match/find', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ elo: playerElo }),
  });
  if (!response.ok) {
    throw new Error('Failed to find match');
  }
  return response.json();
}

async function matchmakingApi_submitAnswer(roomId: string, answer: string): Promise<void> {
  const response = await fetch(`https://your-api.com/match/${roomId}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer }),
  });
  if (!response.ok) {
    throw new Error('Failed to submit answer');
  }
}

export function getOpponentResultForPvP(
  question: Question,
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