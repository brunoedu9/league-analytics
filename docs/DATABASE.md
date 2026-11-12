# Banco de dados (SQLite)

Modelo inicial. As migrations serão criadas em `src-tauri/migrations/` na etapa 5.

| Tabela | Responsabilidade |
|---|---|
| `players` | Identificação dos jogadores (PUUID, Riot ID, região) |
| `matches` | Informações gerais das partidas (ID, fila, data, duração, patch) |
| `participants` | Os participantes de cada partida (até 10 por partida) |
| `player_stats` | Estatísticas individuais de um participante em uma partida |
| `rank_history` | Histórico de classificação (fila, tier, divisão, PDL, data) |
| `champions` | Dados estáticos dos campeões (Data Dragon) |
| `sync_history` | Controle das sincronizações (início, fim, status, erro) |
| `settings` | Configurações do usuário (chave/valor) |

## Princípios

- **Uma partida, um registro.** Uma partida tem um registro em `matches` e até dez
  em `participants`. Os dados não são duplicados por jogador; isso economiza
  espaço e facilita comparações.
- **Identidade pelo PUUID.** O Riot ID pode mudar; o PUUID não.
- **Dados brutos preservados.** O JSON original da partida pode ser guardado
  para recalcular métricas no futuro sem consultar a API novamente.
- **Migrations versionadas.** Toda mudança de esquema é uma nova migration;
  uma migration já publicada nunca é alterada.
