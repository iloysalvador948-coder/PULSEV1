import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { GameState, FSMAction, MatchConfig, Question, RoundResult, RoundCount } from '../types';
import { TIMER_DURATION_SECONDS } from '../utils/constants';
import { getRandomQuestions } from '../utils/questions';
import { simulateOpponentAnswer, getBotElo } from '../utils/matchSimulator';

interface GameStore {
  state: GameState;
  config: MatchConfig | null;
  questions: Question[];
  currentQuestion: Question | null;
  roundResults: RoundResult[];
  opponentResults: RoundResult[];
  playerScore: number;
  opponentScore: number;
  playerElo: number;
  botElo: number;
  selectedAnswer: string | null;
  timeRemaining: number;
  isTimerRunning: boolean;
  answerSubmitted: boolean;
  transition: (action: FSMAction) => void;
  setConfig: (totalRounds: RoundCount) => void;
  syncPlayerElo: (elo: number) => void;
  startMatch: () => void;
  submitAnswer: (answer: string) => void;
  setTimeRemaining: (time: number) => void;
  setTimerRunning: (running: boolean) => void;
  useLifeline: () => void;
  reset: () => void;
}

const initialState = {
  state: GameState.IDLE as GameState,
  config: null,
  questions: [],
  currentQuestion: null,
  roundResults: [],
  opponentResults: [],
  playerScore: 0,
  opponentScore: 0,
  playerElo: 1200,
  botElo: 1200,
  selectedAnswer: null,
  timeRemaining: TIMER_DURATION_SECONDS,
  isTimerRunning: false,
  answerSubmitted: false,
};

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    ...initialState,
    
    transition: (action: FSMAction) => {
      const currentState = get().state;
      let newState: GameState = GameState.ERROR;
      
      switch (action) {
        case 'startMatchSetup':
          if (currentState === GameState.IDLE) {
            newState = GameState.PRE_MATCH_CONFIG;
          }
          break;
        case 'confirmConfig':
          if (currentState === GameState.PRE_MATCH_CONFIG) {
            newState = GameState.MATCHMAKING;
          }
          break;
        case 'cancelSetup':
          if (currentState === GameState.PRE_MATCH_CONFIG) {
            newState = GameState.IDLE;
          }
          break;
        case 'matchFound':
          if (currentState === GameState.MATCHMAKING) {
            const state = get();
            const questions = getRandomQuestions(state.config!.totalRounds);
            const botElo = getBotElo(state.playerElo);
            set((draft) => {
              draft.state = GameState.ROUND_ACTIVE;
              draft.questions = questions;
              draft.currentQuestion = questions[0];
              draft.opponentResults = [];
              draft.botElo = botElo;
              draft.roundResults = [];
              draft.playerScore = 0;
              draft.opponentScore = 0;
              draft.selectedAnswer = null;
              draft.answerSubmitted = false;
              draft.timeRemaining = TIMER_DURATION_SECONDS;
              draft.isTimerRunning = true;
            });
            return;
          }
          break;
        case 'submitAnswer':
        case 'timerExpired':
          if (currentState === GameState.ROUND_ACTIVE) {
            const state = get();
            const currentRound = state.config!.currentRound;
            const question = state.currentQuestion!;
            const isLifelineUsed = state.config!.lifelineUsed;
            const timeUsed = TIMER_DURATION_SECONDS - state.timeRemaining;
            
            let playerAnswer: string | null = state.selectedAnswer;
            if (action === 'timerExpired' && !playerAnswer) {
              playerAnswer = null;
            }
            
            const isCorrect = playerAnswer === question.correctAnswer;
            let pointsEarned = 0;
            if (isCorrect) {
              const basePoints = 100;
              const timeBonus = Math.max(0, Math.round((state.timeRemaining / TIMER_DURATION_SECONDS) * 20));
              pointsEarned = isLifelineUsed ? Math.floor((basePoints + timeBonus) / 2) : basePoints + timeBonus;
            }
            
            const roundResult: RoundResult = {
              roundNumber: currentRound,
              questionId: question.id,
              playerAnswer,
              correctAnswer: question.correctAnswer,
              isCorrect,
              pointsEarned,
              timeUsed: timeUsed === 0 && action === 'timerExpired' ? TIMER_DURATION_SECONDS : timeUsed,
              lifelineUsedThisRound: isLifelineUsed && playerAnswer !== null,
            };
            
            const opponentResult = simulateOpponentAnswer(question, state.botElo, currentRound);
            
            set((draft) => {
              draft.state = GameState.ROUND_RESULTS;
              draft.roundResults.push(roundResult);
              draft.opponentResults.push(opponentResult);
              draft.playerScore += roundResult.pointsEarned;
              draft.opponentScore += opponentResult.pointsEarned;
              draft.answerSubmitted = true;
              draft.isTimerRunning = false;
            });
            return;
          }
          break;
        case 'nextRound':
          if (currentState === GameState.ROUND_RESULTS) {
            const state = get();
            const totalRounds = state.config!.totalRounds;
            const nextRound = state.config!.currentRound + 1;
            
            if (nextRound <= totalRounds) {
              const nextQuestion = state.questions[nextRound - 1];
              set((draft) => {
                draft.state = GameState.ROUND_ACTIVE;
                draft.config!.currentRound = nextRound;
                draft.currentQuestion = nextQuestion;
                draft.selectedAnswer = null;
                draft.answerSubmitted = false;
                draft.timeRemaining = TIMER_DURATION_SECONDS;
                draft.isTimerRunning = true;
              });
              return;
            } else {
              set((draft) => {
                draft.state = GameState.GAME_SUMMARY;
                draft.isTimerRunning = false;
              });
              return;
            }
          }
          break;
        case 'returnToLobby':
          if (currentState === GameState.GAME_SUMMARY) {
            set((draft) => {
              draft.state = GameState.IDLE;
              draft.config = null;
              draft.questions = [];
              draft.currentQuestion = null;
              draft.roundResults = [];
              draft.opponentResults = [];
              draft.playerScore = 0;
              draft.opponentScore = 0;
              draft.selectedAnswer = null;
              draft.answerSubmitted = false;
              draft.timeRemaining = TIMER_DURATION_SECONDS;
            });
            return;
          }
          break;
      }
      
      if (newState !== GameState.ERROR && newState !== currentState) {
        set((draft) => {
          draft.state = newState;
        });
      }
    },
    
    setConfig: (totalRounds: RoundCount) => {
      set((draft) => {
        draft.config = {
          totalRounds,
          currentRound: 1,
          timePerRound: TIMER_DURATION_SECONDS,
          lifelineUsed: false,
        };
      });
    },
    
    syncPlayerElo: (elo: number) => {
      set((draft) => {
        draft.playerElo = elo;
      });
    },
    
    startMatch: () => {
      const state = get();
      if (state.config) {
        set((draft) => {
          draft.state = GameState.MATCHMAKING;
        });
      }
    },
    
    submitAnswer: (answer: string) => {
      if (get().state === GameState.ROUND_ACTIVE && !get().answerSubmitted) {
        set((draft) => {
          draft.selectedAnswer = answer;
        });
        get().transition('submitAnswer');
      }
    },
    
    setTimeRemaining: (time: number) => {
      set((draft) => {
        draft.timeRemaining = time;
      });
    },
    
    setTimerRunning: (running: boolean) => {
      set((draft) => {
        draft.isTimerRunning = running;
      });
    },
    
    useLifeline: () => {
      const state = get();
      if (state.config && !state.config.lifelineUsed && state.state === GameState.ROUND_ACTIVE) {
        set((draft) => {
          if (draft.config) {
            draft.config.lifelineUsed = true;
          }
        });
      }
    },
    
    reset: () => {
      set((draft) => {
        Object.assign(draft, initialState);
      });
    },
  }))
);