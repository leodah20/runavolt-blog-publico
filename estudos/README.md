# Estudos: por dentro do assistente de chamados

Uma documentação didática para aprender programação usando este projeto real: entender o problema de negócio, localizar responsabilidades, seguir dados entre processos, ler requests de API e relacionar decisões do código aos fundamentos das linguagens.

**Revisão editorial:** 24/11/2026. Exemplos fictícios. Os capítulos distinguem implementação, piloto e planejamento. O repositório público pode estar à frente ou atrás de uma instalação específica.

## Trilha de leitura

| Ordem | Capítulo | O que você aprende |
| --- | --- | --- |
| 1 | [Negócio e arquitetura](01-negocio-e-arquitetura.md) | O que o sistema resolve, camadas, processos e mapa dos arquivos |
| 2 | [Linguagens e princípios](02-linguagens-e-principios.md) | JavaScript, Python, PowerShell, HTML, CSS, SQL e decisões de construção |
| 3 | [Fluxo dos dados e persistência](03-fluxo-de-dados.md) | Da mensagem à revisão, tabelas, transações, filas e datas |
| 4 | [HTTP, APIs e redes](04-http-apis-e-redes.md) | Requests, responses, portas, cookies, catálogo de rotas e DevTools |
| 5 | [Interface e experiência](05-interface-e-experiencia.md) | DOM, eventos, estado, chamadas assíncronas e revisão mensal |
| 6 | [IA, MCP e custos](06-ia-mcp-e-custos.md) | Extração literal, sugestões, ferramentas de leitura e cobrança por API |
| 7 | [Scripts, ferramentas e testes](07-scripts-ferramentas-e-testes.md) | Inicialização, supervisão, dependências, Git e verificações |
| 8 | [Laboratório e glossário](08-laboratorio-e-glossario.md) | Exercícios progressivos, respostas orientativas e vocabulário |
| 9 | [Acesso remoto e Android](09-acesso-remoto-e-android.md) | HTTPS, túnel, ponte e diferenças entre Web e APK |
| 10 | [Identidade e permissões](10-identidade-e-permissoes.md) | Login, sessão, autorização de ações e autoria |
| 11 | [Evidências multimídia](11-evidencias-multimidia.md) | Vínculo confiável, transcrição, mídia e anexos de e-mail |
| 12 | [Operações e segurança](12-operacoes-e-seguranca.md) | Origem, perfil, status, metadados HTTP e limites do inspetor |
| 13 | [Backup e continuidade](13-backup-e-continuidade.md) | Saúde do Ollama, backup, restauração e critérios para a nuvem |

### Como estudar cada capítulo

1. Leia a explicação e abra os links para o código.
2. Escolha uma função. Anote **entrada → validação → transformação → efeito → saída**.
3. Procure o teste correspondente e explique qual comportamento ele protege.
4. Desenhe o caminho de uma informação fictícia sem consultar dados de produção.
5. Registre dúvidas com o nome do arquivo e do símbolo, por exemplo: `CaseBoard.change` em `src/cases/board.mjs`.

O Markdown pode ser lido no GitHub ou na prévia do editor. Diagramas Mermaid têm também explicação textual; não é necessário executar o coletor para acompanhar a trilha.

## Matérias e pré-requisitos

- **Fundamentos:** 1 → 2 → 4 → 8. Faça os exercícios conforme completa os pré-requisitos de cada um.
- **Produto e dados:** 3 → 5 → 6 → 11. Comece após os capítulos 1–2. O 11 depende de entender fonte, persistência, interface e extração.
- **Redes e operação:** 7 → 9 → 10 → 12 → 13. Comece após os capítulos 3–4. Leia HTTP antes de túnel, e login e permissões antes de interpretar o inspetor.

Não precisa decorar sintaxe. A meta é conseguir explicar **por que** cada etapa existe e **onde** alterar um comportamento.

## Documentos que se complementam

- [README do produto](../README.md): instalação, uso e limites.
- [COMANDOS.md](../COMANDOS.md): referência operacional de comandos e cuidados.
- [Plano estratégico](../docs/PLANO-ESTRATEGICO.md): prioridades e critérios de entrega.
- [Estado](../docs/PROJECT_STATE.md) e [continuidade](../docs/HANDOFF.md): implementação e validações registradas.
- [Orientações do repositório](../AGENTS.md): limites de acesso e trabalho.

Esta pasta explica o código público. Conversas, imagens, configurações, sessão, chaves e modelos privados não são material de estudo compartilhável. O padrão de relatório de um cliente continua no contexto privado daquele projeto.
