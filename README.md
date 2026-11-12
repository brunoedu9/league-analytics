# League Analytics

Aplicativo desktop para Windows que consulta, armazena e analisa estatísticas de
jogadores de League of Legends usando as APIs oficiais da Riot Games.

> Status: em desenvolvimento (pré-MVP).

## Stack

Tauri 2 · React · TypeScript · Rust · SQLite · Recharts

## Requisitos de desenvolvimento

- Node.js
- Rust (rustup, toolchain `stable-x86_64-pc-windows-msvc`)
- Microsoft C++ Build Tools
- WebView2 Runtime
- VS Code com as extensões Tauri e rust-analyzer (recomendado)

## Chave da Riot API

O app é livre: cada usuário usa a **própria chave**. Gere a sua no [Riot Developer Portal](https://developer.riotgames.com/) e cadastre em **Configurações → Chave da Riot API**. Ela fica guardada no Gerenciador de Credenciais do Windows. Sem chave, o app continua mostrando os dados já salvos.

Para desenvolvimento, também é possível usar `RIOT_API_KEY=...` em um arquivo `.env` na raiz (ignorado pelo Git).

## Executar

```bash
npm install
npm run tauri dev
```

## Documentação

- [Requisitos (SRS)](docs/SRS.md)
- [Arquitetura](docs/ARCHITECTURE.md)
- [Banco de dados](docs/DATABASE.md)

## Aviso legal

League Analytics não é endossado pela Riot Games e não reflete as opiniões da
Riot Games ou de qualquer pessoa oficialmente envolvida na produção ou
gerenciamento de propriedades da Riot Games. Riot Games e todas as propriedades
associadas são marcas comerciais ou marcas registradas da Riot Games, Inc.
