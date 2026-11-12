# hooks

Hooks React reutilizáveis que consomem `services/`:

- `useAsync`: executa uma função assíncrona e expõe `loading` / `error` / `success`; recarrega quando as dependências mudam, mantendo os dados anteriores na tela.
- `usePlayerRefresh`: botão **Atualizar** (perfil + elo na Riot e download das partidas que faltam, com progresso).
