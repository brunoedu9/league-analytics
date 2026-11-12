# League Analytics — Software Requirements Specification (SRS)

| Campo | Valor |
|---|---|
| Versão | 1.0 |
| Status | Documento inicial de planejamento |
| Plataforma | Windows 10/11 |
| Tipo | Aplicativo desktop |
| Identidade visual | Dark / Esports |
| Nome comercial | A definir |

## 1. Visão geral

O League Analytics será uma aplicação desktop destinada à consulta, visualização, interpretação e comparação de estatísticas de jogadores de League of Legends.

O objetivo é centralizar informações disponíveis por meio das APIs oficiais da Riot Games e transformá-las em indicadores compreensíveis, permitindo que jogadores acompanhem seu desempenho individual e identifiquem oportunidades de evolução.

O sistema deverá atender jogadores de todos os níveis competitivos, de Ferro a Desafiante.

## 2. Objetivos do sistema

- Centralizar estatísticas do jogador em uma única plataforma.
- Disponibilizar histórico detalhado de partidas.
- Analisar desempenho individual e por campeão.
- Identificar padrões e tendências.
- Permitir comparação entre jogadores.
- Acompanhar evolução histórica.
- Oferecer uma interface intuitiva e visualmente organizada.
- Manter dados históricos localmente.
- Disponibilizar atualizações automáticas do aplicativo.

## 3. Público-alvo

Jogadores de League of Legends de todas as divisões e níveis competitivos. O sistema deverá apresentar informações de maneira acessível para jogadores casuais, mas oferecer profundidade suficiente para jogadores competitivos.

## 4. Requisitos funcionais

| ID | Requisito | Descrição |
|---|---|---|
| RF01 | Pesquisa de jogadores | Pesquisar por Riot ID (Game Name + Tag Line) e selecionar a região. |
| RF02 | Perfil do jogador | Nome e identificação, região, elo atual, histórico de ranqueadas, taxa de vitória, quantidade de partidas e estatísticas gerais. |
| RF03 | Histórico de partidas | Resultado, campeão, duração, KDA, ouro, farm, dano, estatísticas de visão e participação em objetivos. |
| RF04 | Análise individual de partidas | Detalhes da partida, comparação entre participantes e evolução de métricas quando disponíveis. |
| RF05 | Análise por campeão | Partidas, vitórias/derrotas, win rate, KDA médio, CS/min, desempenho por posição e histórico de utilização. |
| RF06 | Análise de desempenho | Calcular indicadores, identificar tendências e apresentar possíveis pontos de melhoria. |
| RF07 | Evolução histórica | Gráficos de evolução e comparação entre períodos selecionados. |
| RF08 | Comparação de jogadores | Comparar dois ou mais jogadores usando métricas compatíveis. |
| RF09 | Rankings | Informações de classificação competitiva disponíveis na Riot API. |
| RF10 | Persistência local | Armazenar dados consultados em banco local, evitando consultas desnecessárias. |
| RF11 | Sincronização | Atualização manual e sincronização automática em intervalos configuráveis. |
| RF12 | Configurações | Região, atualização de dados, aparência e preferências. |
| RF13 | Atualização do aplicativo | Verificar novas versões e atualizar automaticamente por distribuição assinada. |

## 5. Requisitos não funcionais

| ID | Requisito | Descrição |
|---|---|---|
| RNF01 | Desempenho | Navegação rápida, sem consultas externas desnecessárias. |
| RNF02 | Usabilidade | Informações claras, organizadas e consistentes. |
| RNF03 | Segurança | Credenciais e dados sensíveis nunca no código-fonte ou no executável. |
| RNF04 | Disponibilidade | Dados armazenados localmente acessíveis sem internet e sem a Riot API. |
| RNF05 | Manutenibilidade | Código em módulos independentes e documentados. |
| RNF06 | Escalabilidade | Novos módulos sem reestruturação completa. |
| RNF07 | Compatibilidade | Windows 10 e 11, respeitando os requisitos das dependências. |
| RNF08 | Custo | Ferramentas gratuitas e de código aberto; nenhum serviço pago para o funcionamento local. |
| RNF09 | Atualizações | Compilação, publicação e distribuição automatizadas por GitHub Actions. |

## 6. Tecnologias

| Componente | Tecnologia |
|---|---|
| Desktop | Tauri 2 |
| Frontend | React |
| Linguagem frontend | TypeScript |
| Backend nativo | Rust |
| Banco de dados | SQLite |
| Gráficos | Recharts |
| API externa | Riot Games API |
| Dados estáticos | Data Dragon |
| Versionamento | Git |
| Repositório | GitHub |
| CI/CD | GitHub Actions |
| Atualizações | Tauri Updater |

Java e Python não fazem parte do núcleo da primeira versão; podem ser usados em ferramentas auxiliares no futuro.

## 7. Estrutura de módulos

1. Dashboard
2. Perfil do jogador
3. Histórico de partidas
4. Análise de partidas
5. Desempenho
6. Campeões
7. Rankings
8. Comparação de jogadores
9. Configurações

## 8. Restrições

- O sistema depende da disponibilidade e dos limites da Riot Games API.
- O uso público depende do registro e da aprovação aplicável pela Riot.
- Nenhuma chave secreta da Riot pode ser distribuída no executável.
- Os dados disponíveis estão limitados aos endpoints e permissões autorizados.
- A aplicação não deve fornecer informações de sessão que violem as políticas da Riot.
- As funcionalidades essenciais devem permanecer gratuitas.

## 9. Fora do escopo inicial

- Relatórios semanais automáticos.
- Aplicativo mobile.
- Overlay durante partidas.
- Assistência que dite decisões durante o jogo.
- Inteligência artificial generativa dependente de serviços pagos.
- Funcionalidades que dependam de dados não disponibilizados oficialmente.

## 10. Critérios de conclusão do MVP

1. O aplicativo abre corretamente no Windows.
2. O usuário consegue pesquisar um Riot ID.
3. O sistema recupera o perfil e o elo.
4. O sistema recupera e armazena partidas.
5. O usuário consegue consultar estatísticas individuais.
6. O sistema apresenta análises por campeão.
7. O usuário consegue visualizar gráficos históricos.
8. O aplicativo continua apresentando dados armazenados sem internet.
9. O código está versionado no GitHub.
10. O processo de compilação e publicação está automatizado.
