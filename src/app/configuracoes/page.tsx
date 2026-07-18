'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useApp } from '@/contexts/AppContext';
import { DEFAULT_RARITY_PRESETS, REWARD_TYPE_LABELS } from '@/lib/utils';
import {
  Settings,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Check,
  Database,
  FileJson,
} from 'lucide-react';

export default function ConfiguracoesPage() {
  const { state, dispatch, projectId } = useApp();
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    const data = {
      project: state.currentProject,
      questions: state.questions.filter((q) => q.projectId === projectId),
      cards: state.cards.filter((c) => c.projectId === projectId),
      envelopes: state.envelopes.filter((e) => e.projectId === projectId),
      rarities: state.rarities.filter((r) => r.projectId === projectId),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bingo-biblico-${state.currentProject?.name || 'projeto'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.questions) {
          data.questions.forEach((q: any) => {
            dispatch({ type: 'ADD_QUESTION', payload: { ...q, id: crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 15) } });
          });
        }
        if (data.cards) {
          data.cards.forEach((c: any) => {
            dispatch({ type: 'ADD_CARD', payload: { ...c, id: crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 15) } });
          });
        }
        if (data.envelopes) {
          data.envelopes.forEach((e: any) => {
            dispatch({ type: 'ADD_ENVELOPE', payload: { ...e, id: crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 15) } });
          });
        }
        if (data.rarities) {
          data.rarities.forEach((r: any) => {
            dispatch({ type: 'ADD_RARITY', payload: { ...r, id: crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 15) } });
          });
        }
        alert('Importação concluída!');
      } catch {
        alert('Erro ao importar arquivo');
      }
      setImporting(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleFillDemo = () => {
    const demoQuestions: { question: string; correctAnswer: string; category: import('@/types').QuestionCategory; difficulty: 'facil' | 'medio' | 'dificil'; biblicalReference: string }[] = [
      { question: 'Quem construiu a arca?', correctAnswer: 'Noé', category: 'antigo_testamento', difficulty: 'facil', biblicalReference: 'Gênesis 6:14' },
      { question: 'Quantos mandamentos Deus deu no Sinai?', correctAnswer: '10', category: 'antigo_testamento', difficulty: 'facil', biblicalReference: 'Êxodo 20:1-17' },
      { question: 'Qual o primeiro milagre de Jesus?', correctAnswer: 'Transformar água em vinho', category: 'evangelhos', difficulty: 'medio', biblicalReference: 'João 2:1-11' },
      { question: 'Quem foi engolido pela baleia?', correctAnswer: 'Jonas', category: 'antigo_testamento', difficulty: 'facil', biblicalReference: 'Jonas 1:17' },
      { question: 'Quantos apóstolos Jesus escolheu?', correctAnswer: '12', category: 'evangelhos', difficulty: 'facil', biblicalReference: 'Mateus 10:1-4' },
      { question: 'Qual cidade Jesus nasceu?', correctAnswer: 'Belém', category: 'evangelhos', difficulty: 'facil', biblicalReference: 'Mateus 2:1' },
      { question: 'Quem traiu Jesus?', correctAnswer: 'Judas Iscariotes', category: 'evangelhos', difficulty: 'facil', biblicalReference: 'Mateus 26:14-16' },
      { question: 'Qual o maior mandamento?', correctAnswer: 'Amar a Deus sobre todas as coisas', category: 'evangelhos', difficulty: 'medio', biblicalReference: 'Mateus 22:37-38' },
      { question: 'Quantos livros tem a Bíblia?', correctAnswer: '66', category: 'novo_testamento', difficulty: 'dificil', biblicalReference: '' },
      { question: 'Quem foi o primeiro rei de Israel?', correctAnswer: 'Saul', category: 'antigo_testamento', difficulty: 'medio', biblicalReference: '1 Samuel 10:1' },
      { question: 'Qual o fruto do Espírito?', correctAnswer: 'Amor, gozo, paz, paciência', category: 'novo_testamento', difficulty: 'medio', biblicalReference: 'Gálatas 5:22' },
      { question: 'Quem ressuscitou Lázaro?', correctAnswer: 'Jesus', category: 'evangelhos', difficulty: 'facil', biblicalReference: 'João 11:1-44' },
      { question: 'Qual o livro mais curto da Bíblia?', correctAnswer: '3 João', category: 'novo_testamento', difficulty: 'dificil', biblicalReference: '3 João' },
      { question: 'Quem escreveu a maioria das epístolas?', correctAnswer: 'Paulo', category: 'cartas', difficulty: 'medio', biblicalReference: '' },
      { question: 'Qual o tema central do Apocalipse?', correctAnswer: 'A volta de Cristo', category: 'novo_testamento', difficulty: 'dificil', biblicalReference: 'Apocalipse 1:1' },
    ];

    const now = new Date().toISOString();
    demoQuestions.forEach((dq) => {
      dispatch({
        type: 'ADD_QUESTION',
        payload: {
          ...dq,
          id: crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 15),
          projectId: projectId || '',
          hint: '',
          tags: [],
          status: 'active',
          notes: '',
          linkedCells: [],
          createdAt: now,
          updatedAt: now,
        },
      });
    });

    // Add default rarities if empty
    if (state.rarities.filter((r) => r.projectId === projectId).length === 0) {
      DEFAULT_RARITY_PRESETS.forEach((preset) => {
        dispatch({
          type: 'ADD_RARITY',
          payload: {
            ...preset,
            id: crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 15),
            projectId: projectId || '',
            secondaryColor: '',
            gradient: false,
            gradientStyle: 'linear',
            borderSpecial: '',
            icon: '',
            active: true,
            distributions: [
              { rewardType: 'versiculo', percentage: 40 },
              { rewardType: 'doce', percentage: 30 },
              { rewardType: 'bonus', percentage: 20 },
              { rewardType: 'premio', percentage: 10 },
            ],
            createdAt: now,
            updatedAt: now,
          },
        });
      });
    }

    alert('Dados demo preenchidos!');
  };

  const handleClearAll = () => {
    if (!confirm('Tem certeza? Isso apagará todos os dados do projeto atual.')) return;
    const questions = state.questions.filter((q) => q.projectId !== projectId);
    const cards = state.cards.filter((c) => c.projectId !== projectId);
    const envelopes = state.envelopes.filter((e) => e.projectId !== projectId);
    const rarities = state.rarities.filter((r) => r.projectId !== projectId);
    dispatch({ type: 'SET_QUESTIONS', payload: questions });
    dispatch({ type: 'SET_CARDS', payload: cards });
    dispatch({ type: 'SET_ENVELOPES', payload: envelopes });
    dispatch({ type: 'SET_RARITIES', payload: rarities });
    alert('Dados apagados!');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Configurações</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie dados e configurações do projeto
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Export */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Download className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Exportar Projeto</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Exporte todos os dados do projeto como arquivo JSON
            </p>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <FileJson className="h-4 w-4" />
              Exportar JSON
            </button>
          </div>

          {/* Import */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Importar Dados</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Importe dados de um arquivo JSON exportado
            </p>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors">
              <Upload className="h-4 w-4" />
              {importing ? 'Importando...' : 'Selecionar Arquivo'}
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
          </div>

          {/* Fill Demo Data */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Database className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Preencher com Dados Demo</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Gere perguntas e raridades fictícios para teste
            </p>
            <button
              onClick={handleFillDemo}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              <Check className="h-4 w-4" />
              Preencher Demo
            </button>
          </div>

          {/* Clear Data */}
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Trash2 className="h-4 w-4 text-destructive" />
              <h3 className="text-sm font-semibold text-destructive">Limpar Dados</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Remover todos os dados do projeto atual (irreversível)
            </p>
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Limpar Tudo
            </button>
          </div>
        </div>

        {/* Project Info */}
        {state.currentProject && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3">Informações do Projeto</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome</span>
                <span className="font-medium">{state.currentProject.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em</span>
                <span>{new Date(state.currentProject.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={state.currentProject.status === 'active' ? 'text-emerald-500' : 'text-muted-foreground'}>
                  {state.currentProject.status === 'active' ? 'Ativo' : 'Arquivado'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
