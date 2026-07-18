export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'archived';
}

export type BingoSize = 4 | 5 | 6 | 7;
export type Difficulty = 'facil' | 'medio' | 'dificil';
export type QuestionCategory =
  | 'antigo_testamento'
  | 'novo_testamento'
  | 'evangelhos'
  | 'personagens'
  | 'milagres'
  | 'cartas'
  | 'profetas';

export interface BibleQuestion {
  id: string;
  projectId: string;
  question: string;
  correctAnswer: string;
  hint?: string;
  category: QuestionCategory;
  difficulty: Difficulty;
  tags: string[];
  status: 'active' | 'inactive';
  notes?: string;
  biblicalReference?: string;
  linkedCells: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BingoCell {
  id: string;
  cardId: string;
  row: number;
  col: number;
  questionId?: string;
  isFree: boolean;
  isLocked: boolean;
}

export interface BingoCard {
  id: string;
  projectId: string;
  name: string;
  size: BingoSize;
  cells: BingoCell[];
  createdAt: string;
  updatedAt: string;
}

export type RewardType =
  | 'premio'
  | 'versiculo'
  | 'doce'
  | 'bonus'
  | 'nova_tentativa'
  | 'vazio'
  | 'desafio_extra';

export interface RarityDistribution {
  rewardType: RewardType;
  percentage: number;
}

export interface Rarity {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  color: string;
  secondaryColor?: string;
  gradient?: boolean;
  gradientStyle?: 'linear' | 'radial';
  glowIntensity: number;
  particleIntensity: number;
  animationSpeed: number;
  particleSize: number;
  opacity: number;
  borderSpecial?: string;
  icon?: string;
  order: number;
  active: boolean;
  distributions: RarityDistribution[];
  createdAt: string;
  updatedAt: string;
}

export interface Envelope {
  id: string;
  projectId: string;
  name: string;
  code: string;
  rarityId: string;
  description: string;
  rewardType: RewardType;
  quantity: number;
  icon?: string;
  status: 'active' | 'inactive' | 'delivered' | 'consumed';
  createdAt: string;
  updatedAt: string;
}

export interface SimulationResult {
  id: string;
  projectId: string;
  totalOpened: number;
  rarityBreakdown: Record<string, number>;
  rewardBreakdown: Record<RewardType, number>;
  createdAt: string;
}

export interface AppState {
  currentProject: Project | null;
  projects: Project[];
  questions: BibleQuestion[];
  cards: BingoCard[];
  envelopes: Envelope[];
  rarities: Rarity[];
  simulations: SimulationResult[];
  loading: boolean;
}
