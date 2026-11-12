# Arquitetura

## Camadas

```
┌──────────────────────────────────────────────────────────────┐
│ Apresentação    React · TypeScript · componentes · gráficos  │  src/app, src/components, src/features
├──────────────────────────────────────────────────────────────┤
│ Aplicação       serviços · casos de uso · validação · estado │  src/services, src/hooks, src/types
├──────────────────────────────────────────────────────────────┤
│ Infraestrutura  Rust · Riot API · SQLite · cache · sync      │  src-tauri/src
├──────────────────────────────────────────────────────────────┤
│ Fontes externas Riot Games API · Data Dragon · GitHub Rel.   │
└──────────────────────────────────────────────────────────────┘
```

Cada camada só conhece a camada imediatamente abaixo. Trocar a biblioteca de
gráficos ou adicionar uma fonte de dados não exige reescrever as demais.

## Regra offline-first (RNF04)

O aplicativo precisa continuar funcionando para consultar dados já armazenados,
mesmo com a Riot API indisponível ou sem internet. Por isso:

1. **Toda tela lê do SQLite local**, via comandos Tauri. Nenhuma tela chama a Riot API diretamente.
2. **A sincronização é um processo separado** (`services::sync`): busca na Riot,
   grava no SQLite e registra o resultado em `sync_history`.
3. Falha na sincronização nunca bloqueia a leitura: a interface mostra os dados
   salvos e indica a data da última sincronização bem-sucedida.

```
Tela ──invoke──▶ comando Rust ──▶ SQLite              (leitura: sempre funciona)
Botão "Atualizar" ──▶ sync ──▶ Riot API ──▶ SQLite    (escrita: pode falhar sem afetar a leitura)
```

## Estrutura de pastas

```
.github/workflows/   CI (ci.yml) e, futuramente, release.yml
docs/                SRS, arquitetura, banco de dados
src/
  app/               App, rotas e layout (sidebar)
  components/        componentes reutilizáveis
  features/          um diretório por módulo do SRS
  services/          chamadas invoke() aos comandos Rust
  hooks/             hooks React
  types/             tipos compartilhados
  styles/            tema e CSS global
src-tauri/
  src/commands/      comandos Tauri por domínio
  src/database/      SQLite e repositórios
  src/services/      Riot API, Data Dragon, sync
  migrations/        migrations SQL versionadas
```

## Chave da Riot API

| Fase | Arquitetura | Chave |
|---|---|---|
| Protótipo pessoal | App → Riot API | Chave de desenvolvimento em variável de ambiente local, fora do Git e do executável |
| Distribuição pública | App → backend seguro / API gateway → Riot API | Chave de produção somente no servidor |

A Riot não permite que a chave de produção seja embutida em executáveis
distribuídos, e o projeto público precisa estar registrado e aprovado. Isso
deve ser resolvido **antes** da primeira distribuição pública.

## Git e releases

| Branch | Uso |
|---|---|
| `main` | Versão estável |
| `develop` | Integração de funcionalidades |
| `feature/<nome>` | Novas funcionalidades |
| `fix/<nome>` | Correções |

| Evento | Ação |
|---|---|
| Pull request | CI: typecheck, build do frontend, `cargo check` |
| Merge em `main` | Validação de integração |
| Tag `vX.Y.Z` | Compilação e publicação no GitHub Releases (release.yml, a criar) |
| Nova release | Tauri Updater oferece a atualização no app |

As atualizações são assinadas. A chave privada de assinatura fica nos GitHub
Actions Secrets, nunca no repositório.
