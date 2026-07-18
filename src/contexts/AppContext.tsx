'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { AppState, Project, BibleQuestion, BingoCard, Envelope, Rarity, SimulationResult } from '@/types';
import { generateId } from '@/lib/utils';

type Action =
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'SET_CURRENT_PROJECT'; payload: Project | null }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'SET_QUESTIONS'; payload: BibleQuestion[] }
  | { type: 'ADD_QUESTION'; payload: BibleQuestion }
  | { type: 'UPDATE_QUESTION'; payload: BibleQuestion }
  | { type: 'DELETE_QUESTION'; payload: string }
  | { type: 'SET_CARDS'; payload: BingoCard[] }
  | { type: 'ADD_CARD'; payload: BingoCard }
  | { type: 'UPDATE_CARD'; payload: BingoCard }
  | { type: 'DELETE_CARD'; payload: string }
  | { type: 'SET_ENVELOPES'; payload: Envelope[] }
  | { type: 'ADD_ENVELOPE'; payload: Envelope }
  | { type: 'UPDATE_ENVELOPE'; payload: Envelope }
  | { type: 'DELETE_ENVELOPE'; payload: string }
  | { type: 'SET_RARITIES'; payload: Rarity[] }
  | { type: 'ADD_RARITY'; payload: Rarity }
  | { type: 'UPDATE_RARITY'; payload: Rarity }
  | { type: 'DELETE_RARITY'; payload: string }
  | { type: 'SET_SIMULATIONS'; payload: SimulationResult[] }
  | { type: 'ADD_SIMULATION'; payload: SimulationResult }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> };

const initialState: AppState = {
  currentProject: null,
  projects: [],
  questions: [],
  cards: [],
  envelopes: [],
  rarities: [],
  simulations: [],
  loading: true,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'SET_CURRENT_PROJECT':
      return { ...state, currentProject: action.payload };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.payload),
      };
    case 'SET_QUESTIONS':
      return { ...state, questions: action.payload };
    case 'ADD_QUESTION':
      return { ...state, questions: [...state.questions, action.payload] };
    case 'UPDATE_QUESTION':
      return {
        ...state,
        questions: state.questions.map((q) =>
          q.id === action.payload.id ? action.payload : q
        ),
      };
    case 'DELETE_QUESTION':
      return {
        ...state,
        questions: state.questions.filter((q) => q.id !== action.payload),
      };
    case 'SET_CARDS':
      return { ...state, cards: action.payload };
    case 'ADD_CARD':
      return { ...state, cards: [...state.cards, action.payload] };
    case 'UPDATE_CARD':
      return {
        ...state,
        cards: state.cards.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'DELETE_CARD':
      return {
        ...state,
        cards: state.cards.filter((c) => c.id !== action.payload),
      };
    case 'SET_ENVELOPES':
      return { ...state, envelopes: action.payload };
    case 'ADD_ENVELOPE':
      return { ...state, envelopes: [...state.envelopes, action.payload] };
    case 'UPDATE_ENVELOPE':
      return {
        ...state,
        envelopes: state.envelopes.map((e) =>
          e.id === action.payload.id ? action.payload : e
        ),
      };
    case 'DELETE_ENVELOPE':
      return {
        ...state,
        envelopes: state.envelopes.filter((e) => e.id !== action.payload),
      };
    case 'SET_RARITIES':
      return { ...state, rarities: action.payload };
    case 'ADD_RARITY':
      return { ...state, rarities: [...state.rarities, action.payload] };
    case 'UPDATE_RARITY':
      return {
        ...state,
        rarities: state.rarities.map((r) =>
          r.id === action.payload.id ? action.payload : r
        ),
      };
    case 'DELETE_RARITY':
      return {
        ...state,
        rarities: state.rarities.filter((r) => r.id !== action.payload),
      };
    case 'SET_SIMULATIONS':
      return { ...state, simulations: action.payload };
    case 'ADD_SIMULATION':
      return { ...state, simulations: [...state.simulations, action.payload] };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOAD_STATE':
      return { ...state, ...action.payload, loading: false };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  projectId: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bingo-biblico-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'LOAD_STATE', payload: parsed });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  useEffect(() => {
    if (!state.loading) {
      const toSave = {
        currentProject: state.currentProject,
        projects: state.projects,
        questions: state.questions,
        cards: state.cards,
        envelopes: state.envelopes,
        rarities: state.rarities,
        simulations: state.simulations,
      };
      localStorage.setItem('bingo-biblico-state', JSON.stringify(toSave));
    }
  }, [state, state.loading]);

  const projectId = state.currentProject?.id ?? null;

  return (
    <AppContext.Provider value={{ state, dispatch, projectId }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
