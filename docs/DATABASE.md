# Banco de dados (SQLite)

- **Arquivo:** `%APPDATA%\com.leagueanalytics.app\league-analytics.db`
- **Driver:** `rusqlite` com SQLite embutido (`bundled`), sem dependência instalada no Windows.
- **Modo:** WAL (leituras das telas não bloqueiam a escrita da sincronização), `foreign_keys = ON`.
- **Esquema:** [`src-tauri/migrations/0001_initial.sql`](../src-tauri/migrations/0001_initial.sql)
- **Código:** `src-tauri/src/database/` (`migrations.rs`, `models.rs`, `repo/`)

## Tabelas

| Tabela | Responsabilidade | Chave |
|---|---|---|
| `players` | Jogadores consultados (Riot ID, região, nível, ícone, última sincronização) | `puuid` |
| `matches` | Dados gerais da partida (fila, patch, início, duração) | `match_id` |
| `participants` | Os 10 participantes: time, campeão, posição, resultado | `id`; único `(match_id, puuid)` |
| `player_stats` | Estatísticas do participante (KDA, CS, ouro, dano, visão, objetivos) | `participant_id` (1:1) |
| `rank_history` | Fotografias do elo, gravadas só quando mudam | `id`; índice `(puuid, queue_type, recorded_at)` |
| `champions` | Dados estáticos do Data Dragon (nome de exibição, ícone) | `champion_id` |
| `sync_history` | Cada sincronização: tipo, status, partidas novas, erro | `id` |
| `settings` | Configurações do usuário (chave/valor) | `key` |

## Convenções

- **Datas:** `INTEGER` em milissegundos desde a época Unix (UTC). As consultas para a interface convertem para ISO 8601.
- **Booleanos:** `INTEGER` 0/1.
- **Identidade pelo PUUID.** O Riot ID pode mudar; o PUUID não. A busca por Riot ID no banco ignora maiúsculas.
- **Uma partida, um registro.** `matches` tem uma linha por partida e `participants` até dez. Nada é duplicado por jogador, e qualquer participante pode ser analisado depois.
- **Partidas são imutáveis.** Gravar uma partida que já existe não altera nada. A sincronização usa `existing_ids` para buscar na Riot só partidas novas.
- **CS = `minions_killed + neutral_minions`.** Guardados separados porque a Riot os separa (na selva, quase todo o farm é neutro).
- **Nome do campeão:** a Riot devolve o nome interno (`LeeSin`). As consultas usam `champions.name` ("Lee Sin") quando o Data Dragon já foi carregado.
- **Participação em abates:** calculada na consulta, `(abates + assistências) / abates do time`.
- **Remoção em cascata:** apagar uma partida remove seus participantes e estatísticas.
- **JSON bruto:** por ora não é guardado (uma partida tem dezenas de KB). Se for preciso recalcular métricas novas, a partida pode ser buscada de novo.

## Migrations

- Cada arquivo em `src-tauri/migrations/` é embutido no executável e aplicado uma vez, em ordem, dentro de uma transação. A versão aplicada fica em `PRAGMA user_version`.
- **Nunca edite uma migration publicada.** Para mudar o esquema, crie `0002_....sql` e adicione-o ao final de `MIGRATIONS` em `migrations.rs`.
- Se o banco estiver numa versão mais nova que a do app (usuário voltou para uma versão antiga), o app recusa abrir em vez de corromper dados.

## Testes

`cargo test` (em `src-tauri/`) roda os testes dos repositórios com banco em memória: migrations idempotentes, partida gravada uma única vez com 10 participantes, mapeamento para a interface, participação em abates, elo gravado só quando muda, configurações e histórico de sincronização.
