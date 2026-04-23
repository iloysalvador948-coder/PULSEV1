import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../store/useGameStore';
import { RoundResult } from '../types';

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3001';

interface PvPGameState {
  connected: boolean;
  roomId: string | null;
  roundResult: { playerResult: RoundResult; opponentResult: RoundResult } | null;
  waitingForOpponent: boolean;
}

export function usePvPGame(roomId: string | null) {
  const [state, setState] = useState<PvPGameState>({
    connected: false,
    roomId,
    roundResult: null,
    waitingForOpponent: false,
  });
  
  const socketRef = useRef<Socket | null>(null);
  const timeUsedRef = useRef<number>(0);

  useEffect(() => {
    if (!roomId) return;

    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('PvP Game: Connected', socket.id);
      setState(s => ({ ...s, connected: true }));
    });

    socket.on('round_result', (data) => {
      console.log('PvP Game: Round result received', data);
      setState(s => ({ 
        ...s, 
        roundResult: data,
        waitingForOpponent: false 
      }));
      
      // Update game store with results
      useGameStore.setState((store) => ({
        playerScore: data.scores.find((s: any) => s.socketId === socket.id)?.score || store.playerScore,
        opponentScore: data.scores.find((s: any) => s.socketId !== socket.id)?.score || store.opponentScore,
      }));
    });

    socket.on('answer_received', (data) => {
      console.log('PvP Game: Answer received, waiting for opponent', data);
      setState(s => ({ ...s, waitingForOpponent: true }));
    });

    socket.on('match_end', (data) => {
      console.log('PvP Game: Match ended', data);
    });

    socket.on('disconnect', () => {
      console.log('PvP Game: Disconnected');
      setState(s => ({ ...s, connected: false }));
    });

    socket.on('connect_error', (error) => {
      console.log('PvP Game: Connection error', error.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId]);

  const submitAnswer = useCallback((answer: string, timeUsed: number) => {
    if (!socketRef.current || !roomId) return;
    
    timeUsedRef.current = timeUsed;
    
    socketRef.current.emit('submit_answer', {
      roomId,
      answer,
      timeUsed
    });
    
    setState(s => ({ ...s, waitingForOpponent: true }));
    console.log('PvP Game: Submitted answer', answer);
  }, [roomId]);

  const clearRoundResult = useCallback(() => {
    setState(s => ({ ...s, roundResult: null }));
  }, []);

  return {
    connected: state.connected,
    roomId: state.roomId,
    roundResult: state.roundResult,
    waitingForOpponent: state.waitingForOpponent,
    submitAnswer,
    clearRoundResult,
  };
}

export function getPvPGameSocket(): Socket | null {
  return socketRef;
}

let socketRef: Socket | null = null;