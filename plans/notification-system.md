# Plano: Sistema de Notificações Customizado

## Objetivo
Substituir todos os `alert()` e `confirm()` do navegador por um sistema de notificações customizado com design glass-morphism consistente com o app.

## Estado Atual
- **3 chamadas `alert()`**: cartelas (perguntas insuficientes), perguntas (erro import JSON), exportação (concluído)
- **5 chamadas `confirm()`**: exclusão de projeto, perguntas (1 e múltiplas), raridades, envelopes, cartelas
- CSS para toast já existe em `globals.css` (`.toast-enter`) mas não é usado
- Bell icon no Header é decorativo (sem funcionalidade)

---

## Fase 1: Componentes Base

### 1.1 Toast Component
**Arquivo:** `src/components/ui/Toast.tsx`

Componente de notificação temporária com 4 variantes:
- `success` — verde, ícone CheckCircle
- `error` — vermelho, ícone XCircle
- `warning` — amarelo, ícone AlertTriangle
- `info` — azul, ícone Info

Props:
```typescript
interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number; // default 3000ms
  onClose: (id: string) => void;
}
```

Design:
- Glass-morphism (backdrop-blur, bordas translúcidas)
- Posição: canto inferior direito
- Animação: slide-in da direita + fade-out ao sair
- Auto-dismiss com progress bar animada
- Botão X para fechar manualmente

### 1.2 Confirm Dialog Component
**Arquivo:** `src/components/ui/ConfirmDialog.tsx`

Modal de confirmação substituindo `confirm()` do navegador:

Props:
```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string; // default "Confirmar"
  cancelLabel?: string; // default "Cancelar"
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}
```

Design:
- Modal centralizado com overlay escuro
- Glass-morphism no card
- Botão confirmar com cor baseada na variante (danger = vermelho, etc)
- Animação de scale-in
- ESC para cancelar

### 1.3 Toast Container
**Arquivo:** `src/components/ui/ToastContainer.tsx`

Container que renderiza todos os toasts ativos na posição canto inferior direito.

---

## Fase 2: Context Provider

### 2.1 NotificationContext
**Arquivo:** `src/contexts/NotificationContext.tsx`

```typescript
interface NotificationContextType {
  toast: (props: Omit<ToastProps, 'id' | 'onClose'>) => void;
  confirm: (props: Omit<ConfirmDialogProps, 'isOpen' | 'onConfirm' | 'onCancel'>) => Promise<boolean>;
}
```

- `toast()` — adiciona toast à lista, auto-remove após duration
- `confirm()` — retorna Promise<boolean> (true = confirmou, false = cancelou)
- Gerencia estado dos toasts e do confirm dialog

### 2.2 Integrar no Provider
**Arquivo:** `src/app/admin/layout.tsx`

Adicionar `<NotificationProvider>` ao redor do conteúdo.

---

## Fase 3: Substituir Chamadas

### 3.1 Substituir `alert()` → `toast()`

| Arquivo | Linha | Atual | Novo |
|---------|-------|-------|------|
| `src/app/admin/cartelas/page.tsx` | 80 | `alert('Perguntas insuficientes...')` | `toast({ type: 'warning', title: 'Perguntas insuficientes', message: '...' })` |
| `src/app/admin/perguntas/page.tsx` | 157 | `alert('Erro ao importar arquivo JSON')` | `toast({ type: 'error', title: 'Erro ao importar', message: 'Arquivo JSON inválido' })` |
| `src/app/admin/exportacao/page.tsx` | 18 | `alert('Exportação simulada concluída!')` | `toast({ type: 'success', title: 'Exportação concluída' })` |

### 3.2 Substituir `confirm()` → `confirm()` do Context

| Arquivo | Linha | Contexto |
|---------|-------|----------|
| `src/app/admin/page.tsx` | 308 | Excluir projeto |
| `src/app/admin/perguntas/page.tsx` | 106 | Excluir pergunta |
| `src/app/admin/perguntas/page.tsx` | 124 | Excluir múltiplas perguntas |
| `src/app/admin/raridades/page.tsx` | 68 | Excluir raridade |
| `src/app/admin/envelopes/page.tsx` | 56 | Excluir envelope |
| `src/app/admin/cartelas/page.tsx` | 96 | Excluir cartela |

Padrão de substituição:
```typescript
// Antes
if (confirm('Excluir este item?')) { deleteItem(); }

// Depois
const confirmed = await confirm({ title: 'Excluir', message: 'Tem certeza?', variant: 'danger' });
if (confirmed) { deleteItem(); }
```

---

## Fase 4: Header Bell Icon (Opcional/Melhoria)

### 4.1 Conectar Bell Icon
**Arquivo:** `src/components/layout/Header.tsx`

Tornar o Bell funcional:
- Mostrar notificações recentes (últimas 5)
- Badge com contador
- Dropdown ao clicar

---

## Verificação

1. `npm run build` — sem erros
2. Testar manualmente:
   - Criar projeto → toast de sucesso
   - Excluir item → dialog de confirmação customizado
   - Tentar gerar cartelas sem perguntas → toast de warning
   - Importar JSON inválido → toast de erro
3. Verificar que nenhum `alert()` ou `confirm()` nativo permanece: `grep -r "alert(" src/` e `grep -r "confirm(" src/`

---

## Arquivos a Criar/Modificar

**Criar:**
- `src/components/ui/Toast.tsx`
- `src/components/ui/ConfirmDialog.tsx`
- `src/components/ui/ToastContainer.tsx`
- `src/contexts/NotificationContext.tsx`

**Modificar:**
- `src/app/admin/layout.tsx` — adicionar NotificationProvider
- `src/components/layout/Header.tsx` — conectar bell icon (fase 4)
- `src/app/admin/cartelas/page.tsx` — substituir alert/confirm
- `src/app/admin/perguntas/page.tsx` — substituir alert/confirm
- `src/app/admin/exportacao/page.tsx` — substituir alert
- `src/app/admin/page.tsx` — substituir confirm
- `src/app/admin/raridades/page.tsx` — substituir confirm
- `src/app/admin/envelopes/page.tsx` — substituir confirm
