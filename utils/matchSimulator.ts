import { Question, RoundResult } from '../types';
import { ELO_RANGES } from './constants';

function getBotAccuracy(difficulty: string, botElo: number): number {
  const isHighElo = botElo >= 1400;
  
  switch (difficulty) {
    case 'easy':
      return isHighElo ? 0.92 : 0.80;
    case 'medium':
      return isHighElo ? 0.75 : 0.60;
    case 'hard':
      return isHighElo ? 0.58 : 0.40;
    default:
      return 0.60;
  }
}

function generateBotResponseTime(): number {
  return Math.random() * 10 + 3;
}

export function getBotElo(playerElo: number): number {
  const minElo = Math.max(ELO_RANGES.min, playerElo - ELO_RANGES.botRange);
  const maxElo = Math.min(ELO_RANGES.max, playerElo + ELO_RANGES.botRange);
  return Math.floor(Math.random() * (maxElo - minElo + 1)) + minElo;
}

export function simulateOpponentAnswer(
  question: Question,
  botElo: number,
  roundNumber: number
): RoundResult {
  const accuracy = getBotAccuracy(question.difficulty, botElo);
  const isCorrect = Math.random() < accuracy;
  const timeUsed = Math.round(generateBotResponseTime() * 10) / 10;
  
  const options = ['A', 'B', 'C', 'D'] as const;
  const correctAnswer = question.correctAnswer;
  
  let playerAnswer: string;
  if (isCorrect) {
    playerAnswer = correctAnswer;
  } else {
    const wrongOptions = options.filter((opt) => opt !== correctAnswer);
    playerAnswer = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
  }

  const basePoints = 100;
  const timeBonus = Math.max(0, Math.round((1 - timeUsed / 15) * 20));
  const pointsEarned = isCorrect ? basePoints + timeBonus : 0;

  return {
    roundNumber,
    questionId: question.id,
    playerAnswer,
    correctAnswer,
    isCorrect,
    pointsEarned,
    timeUsed,
    lifelineUsedThisRound: false,
  };
}

export function calculateOpponentScore(opponentResults: RoundResult[]): number {
  return opponentResults.reduce((total, result) => total + result.pointsEarned, 0);
}