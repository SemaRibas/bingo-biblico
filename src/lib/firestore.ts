import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, increment, arrayUnion, arrayRemove,
  Unsubscribe, writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateRoomCode } from '@/lib/room-code';
import { generateId } from '@/lib/utils';
import type { Project, GameState, Player, PlayerEnvelope, BingoCard, BibleQuestion, Rarity, Envelope, BingoSize, RewardType } from '@/types';

const PROJECTS = 'projects';
const GAME_SESSIONS = 'game-sessions';
const PLAYERS = 'players';
const QUESTIONS = 'questions';
const CARDS = 'cards';
const RARITIES = 'rarities';
const ENVELOPES = 'envelopes';

// ─── Projects ──────────────────────────────────────────────

export async function createFirestoreProject(data: { name: string; description: string; hostId: string }): Promise<string> {
  const id = generateId();
  const roomCode = generateRoomCode();
  await setDoc(doc(db, PROJECTS, id), {
    id,
    name: data.name,
    description: data.description,
    roomCode,
    hostId: data.hostId,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return id;
}

export async function getProjectByRoomCode(roomCode: string): Promise<Project | null> {
  const q = query(collection(db, PROJECTS), where('roomCode', '==', roomCode.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as Project;
}

export async function getProject(projectId: string): Promise<Project | null> {
  const snap = await getDoc(doc(db, PROJECTS, projectId));
  return snap.exists() ? (snap.data() as Project) : null;
}

// ─── Game State ────────────────────────────────────────────

export async function createGameState(projectId: string, hostId: string): Promise<string> {
  const id = generateId();
  await setDoc(doc(db, PROJECTS, projectId, GAME_SESSIONS, id), {
    id,
    projectId,
    status: 'playing',
    drawnNumbers: [],
    currentNumber: null,
    hostId,
    startedAt: new Date().toISOString(),
    endedAt: null,
    winnerId: null,
  });
  return id;
}

export async function getActiveGameState(projectId: string): Promise<GameState | null> {
  const q = query(
    collection(db, PROJECTS, projectId, GAME_SESSIONS),
    where('status', 'in', ['waiting', 'playing'])
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as GameState;
}

export async function drawNumber(projectId: string, gameStateId: string): Promise<number | null> {
  const ref = doc(db, PROJECTS, projectId, GAME_SESSIONS, gameStateId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const state = snap.data() as GameState;
  const drawn = new Set(state.drawnNumbers);

  const allNumbers = Array.from({ length: 200 }, (_, i) => i + 1);
  const available = allNumbers.filter((n) => !drawn.has(n));
  if (available.length === 0) return null;

  const number = available[Math.floor(Math.random() * available.length)];
  await updateDoc(ref, {
    drawnNumbers: arrayUnion(number),
    currentNumber: number,
  });
  return number;
}

export async function finishGame(projectId: string, gameStateId: string, winnerId: string): Promise<void> {
  await updateDoc(doc(db, PROJECTS, projectId, GAME_SESSIONS, gameStateId), {
    status: 'finished',
    endedAt: new Date().toISOString(),
    winnerId,
  });
}

export function onGameStateChange(projectId: string, callback: (state: GameState | null) => void): Unsubscribe {
  const q = query(
    collection(db, PROJECTS, projectId, GAME_SESSIONS),
    where('status', 'in', ['waiting', 'playing'])
  );
  return onSnapshot(q, (snap) => {
    if (snap.empty) { callback(null); return; }
    callback(snap.docs[0].data() as GameState);
  });
}

// ─── Players ───────────────────────────────────────────────

export async function createPlayer(projectId: string, name: string, cardId: string): Promise<string> {
  const id = generateId();
  await setDoc(doc(db, PROJECTS, projectId, PLAYERS, id), {
    id,
    projectId,
    name,
    cardId,
    score: 0,
    completedCells: [],
    envelopes: [],
    joinedAt: new Date().toISOString(),
  });
  return id;
}

export async function getPlayer(projectId: string, playerId: string): Promise<Player | null> {
  const snap = await getDoc(doc(db, PROJECTS, projectId, PLAYERS, playerId));
  return snap.exists() ? (snap.data() as Player) : null;
}

export async function submitAnswer(projectId: string, playerId: string, cellId: string, answer: string, gameStateId: string): Promise<{ correct: boolean; rewardType?: RewardType; rarityName?: string; rarityColor?: string }> {
  const player = await getPlayer(projectId, playerId);
  if (!player) return { correct: false };

  const cardSnap = await getDoc(doc(db, PROJECTS, projectId, CARDS, player.cardId));
  if (!cardSnap.exists()) return { correct: false };
  const card = cardSnap.data() as BingoCard;
  const cell = card.cells.find((c) => c.id === cellId);
  if (!cell || !cell.questionId) return { correct: false };

  const questionSnap = await getDoc(doc(db, PROJECTS, projectId, QUESTIONS, cell.questionId));
  if (!questionSnap.exists()) return { correct: false };
  const question = questionSnap.data() as BibleQuestion;

  const correct = question.correctAnswer.toLowerCase().trim() === answer.toLowerCase().trim();

  if (correct) {
    const raritiesSnap = await getDocs(query(collection(db, PROJECTS, projectId, RARITIES), where('active', '==', true)));
    const rarities = raritiesSnap.docs.map((d) => d.data() as Rarity);

    let rewardType: RewardType = 'versiculo';
    let rarityName = 'Comum';
    let rarityColor = '#818cf8';

    if (rarities.length > 0) {
      const roll = Math.random() * 100;
      let cumulative = 0;
      for (const rarity of rarities) {
        cumulative += (100 / rarities.length);
        if (roll <= cumulative) {
          rarityName = rarity.name;
          rarityColor = rarity.color;
          if (rarity.distributions.length > 0) {
            const distRoll = Math.random() * 100;
            let distCum = 0;
            for (const dist of rarity.distributions) {
              distCum += dist.percentage;
              if (distRoll <= distCum) {
                rewardType = dist.rewardType;
                break;
              }
            }
          }
          break;
        }
      }
    }

    const envelope: PlayerEnvelope = {
      id: generateId(),
      rarityName,
      rarityColor,
      rewardType,
      openedAt: new Date().toISOString(),
    };

    const completedCells = [...player.completedCells, cellId];
    const gameRef = doc(db, PROJECTS, projectId, GAME_SESSIONS, gameStateId);
    const gameSnap = await getDoc(gameRef);
    const gameState = gameSnap.data() as GameState;

    await updateDoc(doc(db, PROJECTS, projectId, PLAYERS, playerId), {
      completedCells,
      score: increment(1),
      envelopes: arrayUnion(envelope),
    });

    const cardRef = doc(db, PROJECTS, projectId, CARDS, player.cardId);
    const updatedCells = card.cells.map((c) => c.id === cellId ? { ...c, isLocked: true } : c);
    const totalPlayable = card.cells.filter((c) => !c.isFree).length;
    if (completedCells.length >= totalPlayable) {
      await finishGame(projectId, gameStateId, playerId);
    }

    return { correct: true, rewardType, rarityName, rarityColor };
  }

  return { correct: false };
}

export function onPlayersChange(projectId: string, callback: (players: Player[]) => void): Unsubscribe {
  return onSnapshot(collection(db, PROJECTS, projectId, PLAYERS), (snap) => {
    callback(snap.docs.map((d) => d.data() as Player));
  });
}

// ─── Data Sync (Admin → Firestore) ────────────────────────

export async function syncProjectData(
  projectId: string,
  data: {
    questions?: BibleQuestion[];
    cards?: BingoCard[];
    rarities?: Rarity[];
    envelopes?: Envelope[];
  }
): Promise<void> {
  const batch = writeBatch(db);

  if (data.questions) {
    for (const q of data.questions) {
      batch.set(doc(db, PROJECTS, projectId, QUESTIONS, q.id), q);
    }
  }
  if (data.cards) {
    for (const c of data.cards) {
      batch.set(doc(db, PROJECTS, projectId, CARDS, c.id), c);
    }
  }
  if (data.rarities) {
    for (const r of data.rarities) {
      batch.set(doc(db, PROJECTS, projectId, RARITIES, r.id), r);
    }
  }
  if (data.envelopes) {
    for (const e of data.envelopes) {
      batch.set(doc(db, PROJECTS, projectId, ENVELOPES, e.id), e);
    }
  }

  await batch.commit();
}

export async function getProjectCards(projectId: string): Promise<BingoCard[]> {
  const snap = await getDocs(collection(db, PROJECTS, projectId, CARDS));
  return snap.docs.map((d) => d.data() as BingoCard);
}

export async function getRandomCard(projectId: string): Promise<BingoCard | null> {
  const cards = await getProjectCards(projectId);
  if (cards.length === 0) return null;
  return cards[Math.floor(Math.random() * cards.length)];
}
