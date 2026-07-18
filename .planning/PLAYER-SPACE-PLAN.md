# Plano: Espaço dos Jogadores + Bingo Multiplayer

## Visão Geral

Transformar o app de admin local em plataforma de bingo multiplayer com:
- Projetos como "salas" com código de convite
- Host controla o jogo (sorteia números, gerencia fluxo)
- Jogadores entram com nome + código, veem cartela, respondem perguntas
- Envelopes gerados por raridade ao acertar
- Vitória = cartela completa
- Dados sincronizados via Firebase Firestore (real-time)

## Regras do Jogo

| Regra | Valor |
|---|---|
| Sorteio | Números 1-200, host clica para sortear |
| Cartela 4x4 | 16 números aleatórios de 1-200 |
| Cartela 5x5 | 24 números + 1 célula livre (centro) |
| Cartela 6x6 | 36 números de 1-200 |
| Cartela 7x7 | 49 números de 1-200 |
| Resposta | Jogador com número sorteado responde individualmente |
| Recompensa | Acerto = envelope gerado por distribuição de raridade |
| Vitória | Cartela inteira preenchida |

---

## Fase 1: Tipos + Firestore Schema

**Objetivo:** Estender tipos e criar camada de dados Firestore

### Tarefas

1. **Novos tipos em `src/types/index.ts`:**
   - `Player { id, projectId, name, cardId, score, completedCells: string[], joinedAt }`
   - `GameState { id, projectId, status, drawnNumbers: number[], currentNumber, hostId, startedAt, endedAt, winnerId? }`
   - Adicionar `number: number` ao `BingoCell`
   - Adicionar `roomCode: string` e `hostId: string` ao `Project`

2. **Firestore service em `src/lib/firestore.ts`:**
   - `createProject(data) → projectId + roomCode`
   - `joinProject(roomCode) → project`
   - `createPlayer(projectId, name) → player`
   - `startGame(projectId, hostId) → gameState`
   - `drawNumber(projectId) → number`
   - `submitAnswer(projectId, playerId, cellId, answer) → correct`
   - `openEnvelope(projectId, playerId) → envelope`
   - `onGameStateChange(projectId, callback) → unsubscribe`
   - `onPlayersChange(projectId, callback) → unsubscribe`

3. **Firestore rules** (em `firestore.rules`):
   - Leitura pública para projetos com roomCode válido
   - Escrita restrita ao host para game state
   - Jogadores só escrevem suas próprias respostas

### Verificação
- [ ] Tipos compilam sem erros
- [ ] Firestore service funciona com regras existentes
- [ ] `npm run build` passa

---

## Fase 2: Painel do Host (Game Control)

**Objetivo:** Criar `/jogo` como página do host para controlar a partida

### Tarefas

1. **Tela de setup do host (`/jogo/page.tsx`):**
   - Selecionar projeto (sala)
   - Botão "Iniciar Jogo" → cria GameState no Firestore
   - Exibe código da sala para compartilhar
   - Lista de jogadores conectados (real-time)

2. **Painel de controle durante o jogo:**
   - Globo animado com botão "Sortear Número"
   - Número sorteado exibido grande
   - Lista de números já sorteados
   - Timeline de jogadores que responderam
   - Status: aguardando respostas → todas respondidas → próximo sorteio

3. **Lógica de sorteio:**
   - `drawNumber()` picks random from 1-200 not yet drawn
   - Atualiza GameState no Firestore (real-time)
   - Jogadores com aquele número recebem notificação

### Verificação
- [ ] Host pode iniciar jogo
- [ ] Números sorteados sincronizam em real-time
- [ ] Timeline mostra respostas dos jogadores

---

## Fase 3: Área do Jogador

**Objetivo:** Criar `/jogar` como página do jogador

### Tarefas

1. **Tela de entrada (`/jogar/page.tsx`):**
   - Input: nome do jogador
   - Input: código da sala (6 chars)
   - Botão "Entrar"
   - Valida código → cria Player no Firestore
   - Redireciona para tela do jogo

2. **Tela do jogo do jogador:**
   - Nome do jogador + pontuação
   - Cartela do jogador (grid com números)
   - Células: número + pergunta vinculada
   - Destaque para número atual sorteado
   - Modal de resposta quando número sorteado é dele
   - Contador de envelopes ganhos

3. **Fluxo de resposta:**
   - Número sorteado → jogadores com esse número veem modal
   - Exibe pergunta + campo de resposta
   - Envia resposta → Firestore verifica
   - Acerto: célula marcada + envelope gerado
   - Erro: célula fica vazia, chance de retry (opcional)

4. **Sistema de envelopes:**
   - Ao acertar, busca raridades ativas do projeto
   - Rola distribuição de raridade → tipo de recompensa
   - Gera envelope visual com cor/brilho da raridade
   - Exibe animação de abertura
   - Lista de envelopes ganhos visível na tela

### Verificação
- [ ] Jogador entra com nome + código
- [ ] Cartela exibe números corretos
- [ ] Modal aparece quando número sorteado é dele
- [ ] Resposta correta marca célula + ganha envelope
- [ ] Envelope mostra visual da raridade

---

## Fase 4: Integração Admin → Firestore

**Objetivo:** Migrar dados do admin para Firestore para que host/jogadores acessem

### Tarefas

1. **Sync de dados do projeto:**
   - Ao criar/editar perguntas, cartelas, raridades, envelopes no admin → salva no Firestore
   - Coleção `projects/{id}/questions/`, `projects/{id}/cards/`, etc.
   - Mantém localStorage como cache local do admin

2. **Geração de cartelas com números:**
   - Modificar `createEmptyCard()` para atribuir números aleatórios
   - Range baseado no tamanho: `size*size` números de 1-200
   - Free cell (5x5 centro) não recebe número
   - Números únicos por cartela (sem duplicata dentro da mesma cartela)

3. **Vinculação pergunta ↔ número:**
   - Cada célula da cartela tem `number` e `questionId`
   - Ao sortear número, busca qual pergunta está vinculada

### Verificação
- [ ] Dados criados no admin aparecem no Firestore
- [ ] Cartelas têm números atribuídos
- [ ] Perguntas estão vinculadas às células

---

## Fase 5: Polish + UX

**Objetivo:** Animações, responsividade, tratamento de erros

### Tarefas

1. **Animações:**
   - Globo do bingo com animação de sorteio (canvas/CSS)
   - Envelope abrindo com partículas da raridade
   - Transição de célula completada
   - Notificação "Sua vez!" quando número sorteado é do jogador

2. **Responsividade:**
   - Admin: funciona em desktop
   - Jogador: funciona em mobile (cartela responsiva)
   - Globo do host: layout adaptativo

3. **Tratamento de erros:**
   - Sala não encontrada
   - Sala já começou (não pode entrar)
   - Jogador duplicado
   - Conexão perdida

### Verificação
- [ ] Fluxo completo funciona: setup → entrar → jogar → ganhar
- [ ] Mobile funciona para jogadores
- [ ] Sem erros de console

---

## Firestore Structure

```
projects/{projectId}
  ├── roomCode: "ABC123"
  ├── hostId: "host-uuid"
  ├── name, description, status
  │
  ├── game-sessions/{sessionId}
  │     ├── status: "waiting" | "playing" | "finished"
  │     ├── drawnNumbers: [7, 42, 103, ...]
  │     ├── currentNumber: 103
  │     ├── startedAt, endedAt
  │     └── winnerId?: "player-id"
  │
  ├── players/{playerId}
  │     ├── name: "João"
  │     ├── cardId: "card-ref"
  │     ├── score: 5
  │     ├── completedCells: ["cell-1", "cell-5"]
  │     └── envelopes: [{...}]
  │
  ├── questions/{questionId}
  ├── cards/{cardId}
  │     └── cells: [{row, col, number, questionId, isFree}]
  ├── rarities/{rarityId}
  └── envelopes/{envelopeId}
```

## Arquivos Novos/Modificados

| Arquivo | Ação |
|---|---|
| `src/types/index.ts` | Modificar - adicionar Player, GameState, number ao BingoCell, roomCode ao Project |
| `src/lib/firestore.ts` | Criar - service layer para Firestore |
| `src/lib/room-code.ts` | Criar - gerar código de sala único |
| `src/app/jogo/page.tsx` | Criar - painel do host |
| `src/app/jogar/page.tsx` | Criar - área do jogador |
| `src/components/game/BingoGlobe.tsx` | Criar - globo animado de sorteio |
| `src/components/game/PlayerCard.tsx` | Criar - cartela do jogador |
| `src/components/game/QuestionModal.tsx` | Criar - modal de resposta |
| `src/components/game/EnvelopeReveal.tsx` | Criar - animação de envelope |
| `src/components/game/PlayerJoin.tsx` | Criar - tela de entrada |
| `src/components/layout/Sidebar.tsx` | Modificar - adicionar links "Jogo" e "Jogar" |
| `src/app/cartelas/page.tsx` | Modificar - gerar números nas células |
| `src/contexts/AppContext.tsx` | Modificar - sync com Firestore |
