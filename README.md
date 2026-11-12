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

## Licença

[MIT](LICENSE): livre para usar, modificar e distribuir.

## Aviso legal

League Analytics não é endossado pela Riot Games e não reflete as opiniões da Riot Games ou de qualquer
pessoa oficialmente envolvida na produção ou gerenciamento de propriedades da Riot Games. Riot Games e
todas as propriedades associadas são marcas comerciais ou marcas registradas da Riot Games, Inc.
