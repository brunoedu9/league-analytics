# League Analytics

Aplicativo desktop **gratuito** para Windows que consulta, guarda e analisa estatísticas de jogadores de
League of Legends usando a API oficial da Riot Games.

- Tudo roda **no seu computador**: não há servidor, conta ou assinatura.
- Cada pessoa usa a **própria chave da Riot API**, cadastrada dentro do app.
- Os dados baixados ficam salvos localmente e continuam disponíveis **sem internet**.

> Status: versão inicial (0.1). Algumas telas ainda estão marcadas como **em breve**.

---

## Sumário

- [O que o app faz](#o-que-o-app-faz)
- [Instalação](#instalação)
- [Primeiros passos](#primeiros-passos)
- [Como obter sua chave da Riot API](#como-obter-sua-chave-da-riot-api)
- [Usando o app](#usando-o-app)
- [Onde ficam os seus dados](#onde-ficam-os-seus-dados)
- [Problemas comuns](#problemas-comuns)
- [Para desenvolvedores](#para-desenvolvedores)
- [Mapa do código](#mapa-do-código)
- [Licença](#licença) · [Aviso legal](#aviso-legal)

---

## O que o app faz

| Tela | O que mostra |
|---|---|
| **Dashboard** | Resumo do seu jogador principal: elo, evolução de PDL, taxa de vitória, KDA, CS/min, visão, partidas recentes e campeões mais jogados |
| **Perfil do jogador** | Pesquisa qualquer jogador por Riot ID, com elo, partidas e estatísticas |
| **Histórico de partidas** | Todas as partidas salvas, com filtros por fila e resultado |
| **Análise de partidas** | Os 10 participantes de uma partida, totais dos times, vantagem de ouro minuto a minuto e comparação com o adversário direto |
| **Campeões** | Estatísticas por campeão (partidas, win rate, KDA, CS/min), com ordenação |
| **Configurações** | Chave da Riot API e informações do banco de dados local |
| Desempenho, Rankings, Comparação | *Em breve* |

---

## Instalação

**Requisitos:** Windows 10 ou 11 (64 bits) e conexão com a internet para baixar dados novos.

1. Abra a página de **[Releases](https://github.com/brunoedu9/league-analytics/releases)** e baixe a versão mais recente:
   - o arquivo terminado em **`_x64-setup.exe`** (recomendado; ex.: `League-Analytics_0.1.0_x64-setup.exe`), ou
   - o arquivo **`.msi`**.

   Para conferir a integridade, compare o SHA-256 do arquivo com o `SHA256SUMS.txt` da release.
2. Execute o instalador. O `.exe` instala só para o seu usuário e **não pede senha de administrador**
   (o `.msi` instala para todos os usuários e pode pedir).
3. Se aparecer a tela azul **"O Windows protegeu o computador"**, clique em **Mais informações** e depois em
   **Executar assim mesmo**. Esse aviso aparece porque o app ainda não tem um certificado de assinatura de
   código (que é pago). O código-fonte é aberto e pode ser conferido neste repositório.
4. Abra **League Analytics** pelo menu Iniciar.

> O app usa o **Microsoft Edge WebView2**, que já vem no Windows 11 e na maioria dos Windows 10.
> Se faltar, o instalador baixa automaticamente.

**Desinstalar:** Configurações do Windows → Aplicativos → League Analytics → Desinstalar.

---

## Primeiros passos

1. **Cadastre sua chave da Riot API** em **Configurações → Chave da Riot API**
   ([como obter](#como-obter-sua-chave-da-riot-api)). Cole a chave e clique em **Salvar e testar**: o app
   confere a chave com a Riot antes de salvar.
2. **Pesquise seu Riot ID** na barra superior, no formato `Nome#TAG` (ex.: `Fulano#BR1`), escolha a
   região e pressione **Enter**. O primeiro jogador pesquisado vira o seu **jogador principal**.
3. Na página do jogador (ou no Dashboard), clique em **Atualizar** para baixar as últimas 20 partidas.
4. Pronto: o Dashboard, o Histórico e Campeões passam a mostrar as suas estatísticas.

---

## Como obter sua chave da Riot API

A chave é gratuita e pessoal. Ela identifica você para a Riot, por isso **não compartilhe com ninguém**.

1. Acesse o **[Riot Developer Portal](https://developer.riotgames.com/)** e entre com a sua conta Riot
   (a mesma do jogo).
2. Aceite os termos de uso, se for o primeiro acesso.
3. No painel, copie a **Development API Key** (começa com `RGAPI-`). Se ela estiver expirada, clique em
   **Regenerate API Key**.
4. No app: **Configurações → Chave da Riot API → cole → Salvar e testar**.

**Importante sobre a validade:**

| Tipo de chave | Validade | Como conseguir |
|---|---|---|
| **Development API Key** | **Expira a cada 24 horas** | Automática no painel do portal |
| **Personal API Key** | Não expira | Em *Register Product → Personal API Key*, descrevendo o uso (ex.: "acompanhar minhas próprias estatísticas") e aguardando a aprovação da Riot |

Com a chave de desenvolvimento, quando ela expirar o app avisa *"a chave da Riot API foi recusada"*. Gere uma
nova no portal e substitua em Configurações. **Os dados já baixados continuam disponíveis** mesmo com a
chave expirada. Para não precisar renovar todo dia, solicite uma Personal API Key.

---

## Usando o app

### Pesquisar jogadores
Digite `Nome#TAG` na barra superior, escolha a região (BR, NA, EUW...) e pressione **Enter**. O perfil e o
elo são buscados na Riot e salvos no computador. Jogadores já pesquisados aparecem em
**Perfil do jogador → Pesquisas recentes** e podem ser abertos mesmo offline.

### Jogador principal
É o jogador exibido no Dashboard, no Histórico de partidas e em Campeões. Para trocar, abra o perfil de
outro jogador e clique em **Definir como principal**.

### Atualizar dados
O botão **Atualizar** busca o perfil e o elo atuais e baixa **só as partidas que ainda não estão salvas**
(até as 20 mais recentes por vez). Clique de novo depois de jogar para trazer as partidas novas.
O gráfico de **Evolução de PDL** ganha um ponto cada vez que o seu PDL muda entre atualizações.

### Analisar uma partida
Clique em qualquer partida de qualquer lista. A análise mostra os 10 jogadores, os totais dos times
(abates, ouro, torres, dragões, barões), a **vantagem de ouro** minuto a minuto e a comparação com o
**adversário direto** da mesma posição. A linha do tempo é baixada na primeira vez que você abre a
partida e fica salva para consultas offline.

### Sem internet
O app continua funcionando com tudo o que já foi baixado. O indicador no canto superior direito mostra
**Offline · exibindo dados salvos**. Ao voltar a conexão, use **Atualizar** para buscar o que for novo.

### Limites da Riot
Cada chave pode fazer até **20 requisições por segundo e 100 a cada 2 minutos**. O app respeita esses
limites sozinho: se você baixar muitas partidas de uma vez, ele aguarda o tempo necessário em vez de falhar.

---

## Onde ficam os seus dados

| O quê | Onde |
|---|---|
| Partidas, perfis, elo e configurações | `%APPDATA%\com.leagueanalytics.app\league-analytics.db` |
| Chave da Riot API | **Gerenciador de Credenciais do Windows** (item `league-analytics`) |

- Nada é enviado para servidores do projeto: o app conversa **apenas** com os servidores da Riot
  (API e Data Dragon, para nomes e ícones dos campeões).
- A chave nunca fica no banco de dados, em arquivos do app ou no código.
- **Remover a chave:** Configurações → Chave da Riot API → **Remover chave**.
- **Apagar todos os dados:** feche o app e exclua a pasta `%APPDATA%\com.leagueanalytics.app`
  (cole esse endereço na barra do Explorador de Arquivos).

---

## Problemas comuns

| Mensagem ou situação | O que fazer |
|---|---|
| *"Cadastre sua chave da Riot API em Configurações"* | Nenhuma chave cadastrada. Veja [Como obter sua chave](#como-obter-sua-chave-da-riot-api) |
| *"A chave da Riot API foi recusada (inválida ou expirada)"* | A chave de desenvolvimento expirou (24 h). Gere outra no portal e substitua em Configurações |
| *"Formato de chave inválido"* | Copie a chave completa, incluindo `RGAPI-` |
| *"Jogador não encontrado"* | Confira o nome, a **tag** (depois do `#`) e a **região** |
| *"Use o formato Nome#TAG"* | Faltou a tag. Exemplo: `Fulano#BR1` |
| *"Sem conexão com a Riot API"* | Verifique a internet. Os dados salvos continuam disponíveis |
| *"Riot API indisponível no momento"* | Instabilidade nos servidores da Riot. Tente de novo em alguns minutos |
| Nenhuma partida aparece | Clique em **Atualizar**. Contas novas ou que só jogaram contra bots podem não ter partidas no histórico da Riot |
| Ícones dos campeões aparecem como iniciais | Sem internet, ou os dados dos campeões ainda não foram baixados. Clique em **Atualizar** com internet |
| Aviso "O Windows protegeu o computador" na instalação | **Mais informações → Executar assim mesmo** (veja [Instalação](#instalação)) |

Encontrou outro problema? Abra uma [issue](https://github.com/brunoedu9/league-analytics/issues).

---

## Para desenvolvedores

**Stack:** Tauri 2 · React · TypeScript · Rust · SQLite · Recharts

### Requisitos
- Node.js (LTS)
- Rust (rustup, toolchain `stable-x86_64-pc-windows-msvc`)
- Microsoft C++ Build Tools
- WebView2 Runtime
- VS Code com as extensões Tauri e rust-analyzer (recomendado)

### Executar em modo desenvolvimento
```bash
npm install
npm run tauri dev
```

Em desenvolvimento, além de cadastrar a chave pela tela, é possível criar um arquivo `.env` na raiz
(ignorado pelo Git) com `RIOT_API_KEY=RGAPI-...`. O build de release ignora esse arquivo.

### Testes e verificações
```bash
cd src-tauri && cargo test
```

```bash
cd src-tauri && cargo clippy --all-targets -- -D warnings
```

```bash
npm run build
```

Testes que acessam a Riot ou o cofre do Windows ficam marcados como `#[ignore]` e rodam com
`cargo test -- --ignored` (precisam de uma chave válida no `.env`).

### Gerar o instalador localmente
```bash
npm run tauri build
```
Os instaladores ficam em `src-tauri/target/release/bundle/` (`nsis/` e `msi/`).

### Publicar uma versão
1. Atualize a versão em `package.json`, `src-tauri/Cargo.toml` e `src-tauri/tauri.conf.json`.
2. Leve as mudanças para a `main` e crie a tag:
   ```bash
   git tag v0.1.0
   ```
   ```bash
   git push origin v0.1.0
   ```
3. O workflow [Release](.github/workflows/release.yml) compila no Windows e publica os instaladores em
   **Releases**.

### Fluxo de branches
`main` (estável) · `develop` (integração) · `feature/<nome>` · `fix/<nome>`. Todo PR passa pelo
[CI](.github/workflows/ci.yml): checagem de tipos, build, `cargo fmt`, `clippy` e testes.

### Documentação técnica
- [Requisitos (SRS)](docs/SRS.md)
- [Arquitetura](docs/ARCHITECTURE.md)
- [Banco de dados](docs/DATABASE.md)

---

## Mapa do código

Guia de onde fica cada coisa. O app tem duas partes que conversam por **comandos Tauri**:

```
Interface (React, src/)  ──invoke("comando")──▶  Backend (Rust, src-tauri/src/)  ──▶  SQLite local
                                                         │
                                                         └──▶  Riot API / Data Dragon (só para buscar dados novos)
```

**Regra principal:** as telas leem **sempre** do banco local. A Riot só é chamada quando o usuário
pesquisa um jogador, clica em **Atualizar** ou abre a linha do tempo de uma partida pela primeira vez.

### Onde mexer para…

| Quero… | Arquivos |
|---|---|
| Criar uma tela nova | Página em `src/features/<modulo>/`, rota e item da sidebar em `src/app/navigation.tsx` (rotas com parâmetro em `src/app/App.tsx`) |
| Mostrar um dado novo que já está no banco | Consulta em `src-tauri/src/database/repo/`, comando em `src-tauri/src/commands/`, registro em `src-tauri/src/lib.rs`, chamada em `src/services/` |
| Guardar um dado novo da Riot | Nova migration em `src-tauri/migrations/` (+ lista em `database/migrations.rs`), campo em `services/riot/dto.rs`, conversão em `services/sync.rs`, gravação em `database/repo/` |
| Chamar um endpoint novo da Riot | `RiotClient::get` em `services/riot/mod.rs` (já respeita os limites e trata 429); roteamento em `services/riot/routing.rs` |
| Mudar cores, espaçamentos ou o tema | `src/styles/global.css` (variáveis no topo do arquivo) |
| Mudar um cálculo (KDA, CS/min, win rate) | `src/lib/stats.ts` e `src/lib/format.ts` (interface); `database/repo/matches.rs` (participação em abates) |
| Mudar mensagens de erro | `src-tauri/src/error.rs` |
| Mudar o instalador, a janela ou a segurança | `src-tauri/tauri.conf.json` |
| Mudar o CI ou a publicação | `.github/workflows/ci.yml` e `.github/workflows/release.yml` |

### Raiz do projeto

| Arquivo | Responsabilidade |
|---|---|
| `package.json` | Dependências e scripts do frontend (`dev`, `build`, `tauri`) |
| `vite.config.ts` | Configuração do Vite (porta 1420 usada pelo Tauri, injeção da versão do app) |
| `tsconfig.json`, `tsconfig.node.json` | Configuração do TypeScript |
| `index.html` | Página HTML que carrega o React |
| `assets/app-icon.svg` | Ícone original do app. Para regerar os ícones: `npx tauri icon assets/app-icon.svg` |
| `LICENSE` | Licença MIT |
| `.gitignore`, `.gitattributes` | Arquivos ignorados (inclui `.env` e chaves) e padronização de quebras de linha (LF) |
| `.github/workflows/ci.yml` | CI: checagem de tipos, build, `cargo fmt`, `clippy` e testes em cada PR |
| `.github/workflows/release.yml` | Publicação: compila e anexa os instaladores ao GitHub Release ao criar uma tag `vX.Y.Z` |
| `.vscode/extensions.json` | Extensões recomendadas do VS Code |
| `.claude/launch.json` | Configuração do servidor de desenvolvimento usada pelo assistente de código |
| `docs/` | Requisitos (SRS), arquitetura e modelo do banco de dados |

### Backend em Rust: `src-tauri/`

| Arquivo | Responsabilidade |
|---|---|
| `Cargo.toml` | Dependências do Rust (Tauri, rusqlite, reqwest, keyring, tokio...) |
| `tauri.conf.json` | Nome, versão, janela, política de segurança (CSP) e configuração dos instaladores |
| `capabilities/default.json` | Permissões que a interface tem dentro do Tauri |
| `build.rs` | Script de build do Tauri (não precisa mexer) |
| `migrations/0001_initial.sql` | Cria as tabelas: jogadores, partidas, participantes, estatísticas, elo, campeões, sincronizações, configurações |
| `migrations/0002_match_timelines.sql` | Cria o cache da linha do tempo das partidas |
| `src/main.rs` | Ponto de entrada do executável; apenas chama `lib.rs` |
| `src/lib.rs` | Inicializa o app: abre o banco, cria o cliente da Riot e **registra todos os comandos** |
| `src/error.rs` | Tipo de erro único (`AppError`) e as mensagens exibidas ao usuário |

**Comandos** (`src/commands/`): a "porta de entrada" chamada pela interface. Ficam finos: validam a entrada e delegam para `services/` ou `database/repo/`.

| Arquivo | Comandos |
|---|---|
| `commands/mod.rs` | Lista os módulos de comandos |
| `commands/app.rs` | `app_info`: nome e versão do app |
| `commands/api_key.rs` | `get_api_key_status`, `set_api_key` (valida, testa na Riot e salva), `remove_api_key` |
| `commands/player.rs` | `search_player` (Riot → banco), `get_player_profile`, `list_players` |
| `commands/sync.rs` | `sync_player_matches`: baixa as partidas que faltam e emite o evento `sync-progress` |
| `commands/matches.rs` | `get_match_details` (10 participantes) e `get_match_timeline` (ouro por minuto) |
| `commands/database.rs` | `db_status`, `get_setting`/`set_setting`, `get_recent_matches`, `get_rank_history`; também `find_player` e `get_player_ranks` (disponíveis, ainda não usados pela interface) |

**Serviços** (`src/services/`): regras que combinam a Riot API com o banco local.

| Arquivo | Responsabilidade |
|---|---|
| `services/mod.rs` | Lista os serviços |
| `services/player.rs` | Pesquisa por Riot ID: conta → invocador → elo; grava no banco; sem internet, devolve o perfil salvo com aviso |
| `services/sync.rs` | Sincronização de partidas: lista os IDs, ignora as já salvas, baixa e grava as novas; converte o JSON da Riot para o formato do banco |
| `services/timeline.rs` | Linha do tempo da partida: busca uma vez na Riot, resume em ouro por minuto e guarda em cache |
| `services/ddragon.rs` | Data Dragon: nomes (pt-BR) e ícones dos campeões, baixados só quando sai um patch novo |
| `services/riot/mod.rs` | `RiotClient`: requisições HTTP com a chave do usuário, controle de ritmo e tratamento de 401/403/404/429/5xx |
| `services/riot/api_key.rs` | Chave do usuário no Gerenciador de Credenciais do Windows: ler, validar formato, mascarar, salvar, remover |
| `services/riot/rate_limit.rs` | Janelas de limite da chave (20/s e 100/2 min) por roteamento |
| `services/riot/routing.rs` | Plataformas (`br1`, `euw1`...) e roteamento regional (`americas`, `europe`, `asia`, `sea`) |
| `services/riot/dto.rs` | Formatos das respostas da Riot (conta, invocador, elo, partida) |

**Banco de dados** (`src/database/`): acesso ao SQLite. Os repositórios são funções simples que recebem a conexão.

| Arquivo | Responsabilidade |
|---|---|
| `database/mod.rs` | Abre o banco (WAL, chaves estrangeiras) e expõe `Database::with` para acesso exclusivo à conexão |
| `database/migrations.rs` | Aplica as migrations em ordem, usando `PRAGMA user_version` |
| `database/models.rs` | Estruturas gravadas e lidas (`PlayerRecord`, `NewMatch`, `MatchSummary`, `MatchDetails`...) |
| `database/repo/mod.rs` | Lista os repositórios |
| `database/repo/players.rs` | Jogadores: inserir/atualizar, buscar por PUUID ou Riot ID, listar recentes, marcar sincronização |
| `database/repo/matches.rs` | Partidas: gravar (uma vez, com 10 participantes), IDs já salvos, resumo por jogador, detalhes completos |
| `database/repo/ranks.rs` | Histórico de elo: grava só quando muda; último elo por fila; série para o gráfico de PDL |
| `database/repo/champions.rs` | Tabela de campeões do Data Dragon |
| `database/repo/timelines.rs` | Cache da linha do tempo (ouro por participante por minuto) |
| `database/repo/settings.rs` | Configurações chave/valor (ex.: `active_player`) |
| `database/repo/sync.rs` | Histórico de sincronizações (início, fim, status, erro) |
| `database/repo/status.rs` | Resumo do banco para a tela de Configurações |
| `database/repo/fixtures.rs` | Dados de exemplo usados só nos testes |

> Os testes de cada módulo ficam no próprio arquivo, no bloco `#[cfg(test)]`.

### Interface em React: `src/`

| Arquivo | Responsabilidade |
|---|---|
| `main.tsx` | Ponto de entrada: monta o React e carrega o CSS global |
| `vite-env.d.ts` | Tipos globais do Vite e a constante `__APP_VERSION__` |
| `styles/global.css` | Tema escuro inteiro: variáveis de cor, layout, cards, tabelas, gráficos e componentes |

**App** (`src/app/`): estrutura geral.

| Arquivo | Responsabilidade |
|---|---|
| `app/App.tsx` | Rotas do app (incluindo `/player/:puuid` e `/match-analysis/:matchId`) |
| `app/navigation.tsx` | Itens da sidebar: caminho, nome, ícone, seção e etiqueta "em breve" |
| `app/AppLayout.tsx` | Layout com sidebar, barra superior e área de conteúdo |
| `app/Topbar.tsx` | Busca por Riot ID, seleção de região e indicador online/offline |
| `app/ActivePlayer.tsx` | Contexto do **jogador principal** (salvo nas configurações do banco) |

**Telas** (`src/features/`): uma pasta por módulo do SRS.

| Arquivo | Tela |
|---|---|
| `features/dashboard/DashboardPage.tsx` | Dashboard do jogador principal |
| `features/player/PlayerPage.tsx` | Perfil de qualquer jogador e lista de pesquisas recentes |
| `features/matches/MatchesPage.tsx` | Histórico de partidas com filtros |
| `features/match-analysis/MatchAnalysisPage.tsx` | Análise de uma partida e seleção de partida |
| `features/champions/ChampionsPage.tsx` | Estatísticas por campeão |
| `features/settings/SettingsPage.tsx` | Configurações e estado do banco local |
| `features/settings/ApiKeyCard.tsx` | Cadastro e teste da chave da Riot API |
| `features/performance/`, `features/rankings/`, `features/comparison/` | Telas provisórias ("em breve") |

**Componentes reutilizáveis** (`src/components/`).

| Arquivo | Responsabilidade |
|---|---|
| `Card.tsx`, `PageHeader.tsx` | Cartão com título e cabeçalho de página |
| `StatCard.tsx` | Indicador numérico com variação (↑/↓) |
| `Badge.tsx` | Etiquetas, incluindo Vitória/Derrota |
| `ProfileCard.tsx` | Identificação do jogador + elo de cada fila |
| `RankBadge.tsx` | Emblema do elo |
| `WinLossBar.tsx` | Barra de vitórias/derrotas |
| `ChampionIcon.tsx` | Ícone do campeão (Data Dragon), com iniciais quando offline |
| `MatchRow.tsx` | Linha de partida; clicar abre a análise |
| `TopChampions.tsx` | Lista de campeões mais jogados |
| `Segmented.tsx` | Botões de filtro (ex.: fila, resultado) |
| `AsyncView.tsx` | Mostra carregamento, erro ou conteúdo |
| `RequireActivePlayer.tsx` | Exige jogador principal; senão, mostra o passo a passo inicial |
| `charts/ChartTooltip.tsx` | Tooltip e estilos compartilhados dos gráficos |
| `charts/LpHistoryChart.tsx` | Gráfico de evolução de PDL |
| `charts/WinRateTrendChart.tsx` | Taxa de vitória móvel (10 partidas) |
| `charts/GoldDiffChart.tsx` | Vantagem de ouro entre os times por minuto |

**Serviços da interface** (`src/services/`): única camada que chama o Rust.

| Arquivo | Responsabilidade |
|---|---|
| `services/tauri.ts` | `call()`: `invoke` com erro amigável fora do app desktop |
| `services/playerApi.ts` | Jogadores, partidas, sincronização, elo e análise de partida |
| `services/apiKeyService.ts` | Chave da Riot API |
| `services/databaseService.ts` | Estado do banco e configurações |

**Lógica e tipos**.

| Arquivo | Responsabilidade |
|---|---|
| `hooks/useAsync.ts` | Carrega dados assíncronos com estados de carregamento e erro |
| `hooks/usePlayerRefresh.ts` | Lógica do botão **Atualizar** (perfil, elo e partidas, com progresso) |
| `lib/stats.ts` | Agregações: win rate, KDA, CS/min, visão, estatísticas por campeão |
| `lib/format.ts` | Formatação em pt-BR (números, datas, duração) e nomes de elo, posição e fila |
| `lib/ladder.ts` | Converte elo em escala contínua para o gráfico de PDL |
| `lib/regions.ts` | Regiões disponíveis na busca |
| `types/models.ts` | Tipos de domínio compartilhados (partida, elo, campeão...) |
| `types/riot.ts` | Plataformas e Riot ID |

---

## Licença

[MIT](LICENSE): livre para usar, modificar e distribuir.

## Aviso legal

League Analytics não é endossado pela Riot Games e não reflete as opiniões da Riot Games ou de qualquer
pessoa oficialmente envolvida na produção ou gerenciamento de propriedades da Riot Games. Riot Games e
todas as propriedades associadas são marcas comerciais ou marcas registradas da Riot Games, Inc.
