import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const ELO_RANGE = parseInt(process.env.ELO_RANGE || '150');
const ROUND_TIME = parseInt(process.env.ROUND_TIME || '15');

const rooms = new Map();
const matchmakingQueue = [];

const questions = [
  {
    id: 'Q001',
    scenario: 'You receive an email from your CEO requesting an urgent wire transfer to a new vendor. The email address looks slightly off: ceo@company-support.com instead of ceo@company.com. What is the most appropriate first response?',
    options: { A: 'Process the transfer immediately as it is from the CEO', B: 'Verify the request through a separate communication channel like a phone call', C: 'Reply to the email asking for more details about the vendor', D: 'Forward the email to IT for analysis without taking any action' },
    correctAnswer: 'B',
    explanation: 'This is a classic Business Email Compromise (BEC) attack.',
    difficulty: 'medium',
    category: 'Social Engineering'
  },
  {
    id: 'Q002',
    scenario: 'During a routine security audit, you discover unauthorized outgoing traffic on port 4444 from several workstations. What type of attack is most likely occurring?',
    options: { A: 'SQL Injection attack', B: 'Cross-Site Scripting (XSS)', C: 'Metasploit reverse HTTP shell callback', D: 'DNS tunneling for data exfiltration' },
    correctAnswer: 'C',
    explanation: 'Port 4444 is the default callback port for Metasploit reverse shells.',
    difficulty: 'hard',
    category: 'Network Security'
  },
  {
    id: 'Q003',
    scenario: 'A user reports their computer is running extremely slow and all their files have mysterious .encrypted extensions. What is the immediate containment priority?',
    options: { A: 'Attempt to decrypt files using known tools', B: 'Isolate the affected machine from the network immediately', C: 'Check if the user has recent backups available', D: 'Analyze the ransomware sample in a sandbox environment' },
    correctAnswer: 'B',
    explanation: 'Network isolation is the immediate priority to prevent lateral movement.',
    difficulty: 'easy',
    category: 'Endpoint Security'
  },
  {
    id: 'Q004',
    scenario: 'Your SIEM detects a service account attempting to access multiple file servers it has never accessed before, during odd hours (2 AM). What is the most likely explanation?',
    options: { A: 'A scheduled backup job that was misconfigured', B: 'Compromised service account being used for lateral movement', C: 'A new automated reporting system deployment', D: 'Normal administrative tasks by the IT team' },
    correctAnswer: 'B',
    explanation: 'This behavior pattern strongly indicates credential compromise.',
    difficulty: 'hard',
    category: 'Endpoint Security'
  },
  {
    id: 'Q005',
    scenario: 'An employee receives a text message claiming to be from IT support asking them to verify their credentials via a link. What is the correct response?',
    options: { A: 'Click the link and enter credentials as it appears to be from IT', B: 'Ignore the message as IT never requests credentials via text', C: 'Call the helpdesk using the official number to verify the request', D: 'Reply asking for more details about the verification requirement' },
    correctAnswer: 'C',
    explanation: 'The safest verification method is calling the official IT helpdesk.',
    difficulty: 'easy',
    category: 'Social Engineering'
  },
  {
    id: 'Q006',
    scenario: 'You discover a USB drive in the parking lot labeled "Executive Salary Data - Confidential". What should you do with this device?',
    options: { A: 'Plug it into a secure analysis machine to see what\'s on it', B: 'Bring it directly to the security team without connecting it to any system', C: 'Throw it away as it could be a malicious device', D: 'Plug it into a disconnected test machine to examine contents' },
    correctAnswer: 'B',
    explanation: 'This is a classic USB drop attack.',
    difficulty: 'easy',
    category: 'Social Engineering'
  },
  {
    id: 'Q007',
    scenario: 'A web application firewall blocks repeated login attempts from IP address 192.168.1.100 to multiple user accounts. What type of attack is this?',
    options: { A: 'Credential stuffing attack', B: 'Password spray attack', C: 'Brute force attack', D: 'Rainbow table attack' },
    correctAnswer: 'B',
    explanation: 'Password spraying uses a single common password against many usernames.',
    difficulty: 'medium',
    category: 'Network Security'
  },
  {
    id: 'Q008',
    scenario: 'Your vulnerability scanner reports a critical CVE for a server running an outdated version of OpenSSL. The CVE allows remote code execution without authentication. What is the highest priority action?',
    options: { A: 'Schedule the patch for the next maintenance window', B: 'Immediately isolate the affected server from the network', C: 'Implement a WAF rule to block exploitation attempts', D: 'Review logs for indicators of compromise' },
    correctAnswer: 'B',
    explanation: 'Given the critical severity, immediate network isolation is required.',
    difficulty: 'medium',
    category: 'Endpoint Security'
  },
  {
    id: 'Q009',
    scenario: 'An attacker performs DNS poisoning to redirect traffic from your company\'s website to a malicious server. What DNS record type is most likely targeted?',
    options: { A: 'MX records', B: 'A records and CNAME records', C: 'TXT records', D: 'PTR records' },
    correctAnswer: 'B',
    explanation: 'DNS poisoning typically targets A and CNAME records.',
    difficulty: 'hard',
    category: 'Network Security'
  },
  {
    id: 'Q010',
    scenario: 'A user receives a calendar invite from an unknown sender containing a link to join a video call. What is the safest course of action?',
    options: { A: 'Accept and join to avoid missing important meetings', B: 'Decline and report to security team', C: 'Forward to the CEO for confirmation', D: 'Check the sender email domain to verify authenticity' },
    correctAnswer: 'B',
    explanation: 'Meeting invitations are a growing attack vector.',
    difficulty: 'medium',
    category: 'Social Engineering'
  },
];

function getRandomQuestions(count) {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getBotAccuracy(difficulty, elo) {
  const isHighElo = elo >= 1400;
  switch (difficulty) {
    case 'easy': return isHighElo ? 0.92 : 0.80;
    case 'medium': return isHighElo ? 0.75 : 0.60;
    case 'hard': return isHighElo ? 0.58 : 0.40;
    default: return 0.60;
  }
}

function calculatePoints(timeUsed, isCorrect, lifelineUsed) {
  if (!isCorrect) return 0;
  const basePoints = 100;
  const timeBonus = Math.max(0, Math.round((1 - timeUsed / ROUND_TIME) * 20));
  const points = basePoints + timeBonus;
  return lifelineUsed ? Math.floor(points / 2) : points;
}

function findMatchmakingPair(elo) {
  const minElo = elo - ELO_RANGE;
  const maxElo = elo + ELO_RANGE;
  const index = matchmakingQueue.findIndex(p => p.elo >= minElo && p.elo <= maxElo);
  if (index !== -1) {
    return matchmakingQueue.splice(index, 1)[0];
  }
  return null;
}

function generateBotUsername() {
  const adjectives = ['Cyber', 'Net', 'Data', 'Byte', 'Hack', 'Secure', 'Zero', 'Crypto', 'Shadow', 'Ghost'];
  const nouns = ['Ninja', 'Guardian', 'Hunter', 'Breaker', 'Master', 'Defender', 'Wolf', 'Fox', 'Storm', 'Blade'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 999);
  return `${adj}${noun}${num}`;
}

function simulateBotAnswer(question, elo) {
  const accuracy = getBotAccuracy(question.difficulty, elo);
  const isCorrect = Math.random() < accuracy;
  const timeUsed = Math.random() * 10 + 3;
  const options = ['A', 'B', 'C', 'D'];
  const correctAnswer = question.correctAnswer;
  
  let playerAnswer;
  if (isCorrect) {
    playerAnswer = correctAnswer;
  } else {
    const wrongOptions = options.filter(opt => opt !== correctAnswer);
    playerAnswer = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
  }
  
  const points = calculatePoints(timeUsed, isCorrect, false);
  
  return {
    roundNumber: 0,
    questionId: question.id,
    playerAnswer,
    correctAnswer,
    isCorrect,
    pointsEarned: points,
    timeUsed
  };
}

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  let botTimeout = null;

  socket.on('find_match', ({ elo = 1200, totalRounds = 5 }) => {
    console.log(`Finding match for ${socket.id} with ELO ${elo}, ${totalRounds} rounds`);
    
    // Clear any existing timeout
    if (botTimeout) {
      clearTimeout(botTimeout);
      botTimeout = null;
    }

    const opponent = findMatchmakingPair(elo);
    
    if (opponent) {
      // REAL PvP - match two players together
      const roomId = uuidv4();
      
      const room = {
        id: roomId,
        players: [
          { id: 'player1', socketId: opponent.socketId, username: 'Player 1', elo: opponent.elo, score: 0 },
          { id: 'player2', socketId: socket.id, username: 'Player 2', elo, score: 0 }
        ],
        currentRound: 1,
        totalRounds,
        questions: getRandomQuestions(totalRounds),
        playerAnswers: new Map(),
        roundResults: new Map(),
        state: 'playing',
        startTime: Date.now()
      };
      
      rooms.set(roomId, room);
      io.sockets.sockets.get(opponent.socketId)?.join(roomId);
      socket.join(roomId);
      
      io.to(roomId).emit('match_found', {
        roomId,
        players: room.players,
        questions: room.questions,
        startTime: Date.now() + 2000,
        currentRound: 1
      });
      
      console.log(`REAL PvP Match created: ${roomId}`);
    } else {
      // Add to queue
      matchmakingQueue.push({ socketId: socket.id, elo, totalRounds });
      socket.emit('searching', { position: matchmakingQueue.length });
      console.log(`Added ${socket.id} to queue. Queue size: ${matchmakingQueue.length}`);
      
      // Set timeout - if no match found in 10 seconds, create bot match
      botTimeout = setTimeout(() => {
        const roomId = uuidv4();
        const botElo = Math.max(800, Math.min(2200, elo + (Math.random() * 300 - 150)));
        
        const room = {
          id: roomId,
          players: [
            { id: 'player1', socketId: socket.id, username: 'Player', elo, score: 0 },
            { id: 'bot', socketId: 'bot', username: generateBotUsername(), elo: botElo, score: 0 }
          ],
          currentRound: 1,
          totalRounds,
          questions: getRandomQuestions(totalRounds),
          playerAnswers: new Map(),
          roundResults: new Map(),
          state: 'playing',
          startTime: Date.now()
        };
        
        rooms.set(roomId, room);
        socket.join(roomId);
        
        socket.emit('match_found', {
          roomId,
          players: room.players,
          questions: room.questions,
          startTime: Date.now() + 2000,
          currentRound: 1
        });
        
        console.log(`Bot match (timeout) for ${socket.id}: ${roomId}`);
      }, 10000); // 10 second timeout
    }
  });

  socket.on('submit_answer', ({ roomId, answer, timeUsed }) => {
    const room = rooms.get(roomId);
    if (!room || room.state !== 'playing') return;
    
    const currentQuestion = room.questions[room.currentRound - 1];
    const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
    if (playerIndex === -1) return;
    
    // Calculate player's result
    const isCorrect = answer === currentQuestion.correctAnswer;
    const actualTimeUsed = timeUsed || (Math.random() * 10 + 3);
    const points = calculatePoints(actualTimeUsed, isCorrect, false);
    
    const playerResult = {
      roundNumber: room.currentRound,
      questionId: currentQuestion.id,
      playerAnswer: answer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      pointsEarned: points,
      timeUsed: actualTimeUsed
    };
    
    // Store answer and result
    room.playerAnswers.set(socket.id, { answer, timeUsed: actualTimeUsed });
    room.roundResults.set(socket.id, playerResult);
    room.players[playerIndex].score += points;
    
    console.log(`Player ${playerIndex + 1} answered: ${answer} (correct: ${isCorrect})`);
    
    // For BOT matches, calculate bot answer immediately
    if (room.players[1].socketId === 'bot') {
      const botResult = simulateBotAnswer(currentQuestion, room.players[1].elo);
      room.roundResults.set('bot', botResult);
      room.players[1].score += botResult.pointsEarned;
      
      io.to(roomId).emit('round_result', {
        playerResult,
        opponentResult: botResult,
        scores: room.players.map(p => ({ socketId: p.socketId, score: p.score }))
      });
      console.log(`Bot answered: ${botResult.playerAnswer} (correct: ${botResult.isCorrect})`);
    } else {
      // Real PvP - wait for opponent's answer
      const opponentSocketId = room.players.find(p => p.socketId !== socket.id)?.socketId;
      const opponentAnswer = room.playerAnswers.get(opponentSocketId);
      
      if (opponentAnswer) {
        // Both players answered - calculate opponent result
        const opponentResult = {
          roundNumber: room.currentRound,
          questionId: currentQuestion.id,
          playerAnswer: opponentAnswer.answer,
          correctAnswer: currentQuestion.correctAnswer,
          isCorrect: opponentAnswer.answer === currentQuestion.correctAnswer,
          pointsEarned: calculatePoints(opponentAnswer.timeUsed, opponentAnswer.answer === currentQuestion.correctAnswer, false),
          timeUsed: opponentAnswer.timeUsed
        };
        
        room.roundResults.set(opponentSocketId, opponentResult);
        const opponentIndex = room.players.findIndex(p => p.socketId === opponentSocketId);
        if (opponentIndex !== -1) {
          room.players[opponentIndex].score += opponentResult.pointsEarned;
        }
        
        io.to(roomId).emit('round_result', {
          playerResult,
          opponentResult,
          scores: room.players.map(p => ({ socketId: p.socketId, score: p.score }))
        });
        console.log(`Both answered - P1: ${playerResult.playerAnswer}, P2: ${opponentResult.playerAnswer}`);
      } else {
        // Only one answered - send acknowledgment
        socket.emit('answer_received', { playerResult });
        console.log(`Waiting for opponent's answer...`);
      }
    }
  });

  socket.on('next_round', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    
    room.currentRound++;
    room.playerAnswers.clear();
    
    if (room.currentRound > room.totalRounds) {
      room.state = 'finished';
      const winner = room.players[0].score >= room.players[1].score ? 'player1' : 'bot';
      io.to(roomId).emit('match_end', {
        winner,
        scores: room.players.map(p => p.score),
        results: Array.from(room.roundResults.values())
      });
    } else {
      const startTime = Date.now() + 2000;
      io.to(roomId).emit('round_start', {
        round: room.currentRound,
        question: room.questions[room.currentRound - 1],
        startTime
      });
    }
  });

  socket.on('cancel_search', () => {
    const index = matchmakingQueue.findIndex(p => p.socketId === socket.id);
    if (index !== -1) {
      matchmakingQueue.splice(index, 1);
      console.log(`Removed ${socket.id} from queue`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    const index = matchmakingQueue.findIndex(p => p.socketId === socket.id);
    if (index !== -1) {
      matchmakingQueue.splice(index, 1);
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    queue: matchmakingQueue.length, 
    rooms: rooms.size,
    uptime: process.uptime()
  });
});

app.get('/stats', (req, res) => {
  res.json({
    queueSize: matchmakingQueue.length,
    activeRooms: rooms.size,
    totalQuestions: questions.length
  });
});

httpServer.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     PULSE SERVER v1.0.0               ║
╠════════════════════════════════════════╣
║  Server:    http://localhost:${PORT}        ║
║  Health:   http://localhost:${PORT}/health  ║
║  Stats:    http://localhost:${PORT}/stats   ║
╚════════════════════════════════════════╝
  `);
});