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
