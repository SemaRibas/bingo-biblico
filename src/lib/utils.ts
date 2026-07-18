import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 15);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const CATEGORY_LABELS: Record<string, string> = {
  antigo_testamento: 'Antigo Testamento',
  novo_testamento: 'Novo Testamento',
  evangelhos: 'Evangelhos',
  personagens: 'Personagens',
  milagres: 'Milagres',
  cartas: 'Cartas',
  profetas: 'Profetas',
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
};

export const REWARD_TYPE_LABELS: Record<string, string> = {
  premio: 'Prêmio',
  versiculo: 'Versículo',
  doce: 'Doce',
  bonus: 'Bônus',
  nova_tentativa: 'Nova Tentativa',
  vazio: 'Vazio',
  desafio_extra: 'Desafio Extra',
};

export const REWARD_TYPE_COLORS: Record<string, string> = {
  premio: 'bg-amber-500',
  versiculo: 'bg-blue-500',
  doce: 'bg-pink-500',
  bonus: 'bg-purple-500',
  nova_tentativa: 'bg-green-500',
  vazio: 'bg-gray-400',
  desafio_extra: 'bg-red-500',
};

export const DEFAULT_RARITY_PRESETS = [
  {
    name: 'Comum',
    slug: 'comum',
    color: '#9CA3AF',
    glowIntensity: 5,
    particleIntensity: 0,
    animationSpeed: 1,
    particleSize: 2,
    opacity: 60,
    order: 1,
  },
  {
    name: 'Incomum',
    slug: 'incomum',
    color: '#22C55E',
    glowIntensity: 20,
    particleIntensity: 10,
    animationSpeed: 1.5,
    particleSize: 3,
    opacity: 70,
    order: 2,
  },
  {
    name: 'Rara',
    slug: 'rara',
    color: '#3B82F6',
    glowIntensity: 40,
    particleIntensity: 30,
    animationSpeed: 2,
    particleSize: 4,
    opacity: 80,
    order: 3,
  },
  {
    name: 'Épica',
    slug: 'epica',
    color: '#A855F7',
    glowIntensity: 70,
    particleIntensity: 60,
    animationSpeed: 2.5,
    particleSize: 5,
    opacity: 90,
    order: 4,
  },
  {
    name: 'Lendária',
    slug: 'lendaria',
    color: '#F59E0B',
    glowIntensity: 100,
    particleIntensity: 90,
    animationSpeed: 3,
    particleSize: 6,
    opacity: 100,
    order: 5,
  },
];
