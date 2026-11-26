# 13. Backup e continuidade

[Índice](README.md) · Pré-requisitos: [SQLite e filas](03-fluxo-de-dados.md), [testes](07-scripts-ferramentas-e-testes.md) e [Operações](12-operacoes-e-seguranca.md).

## Três sinais que não se substituem

| Sinal | Teste | O que não prova |
| --- | --- | --- |
| Serviço responde | Processo e leitura de um sinal local recente | Que todas as filas esvaziaram |
| Ollama e modelo disponíveis | Cadastro do modelo no catálogo, sem inferência | Que a análise interpreta cada caso corretamente |
| Cópia verificada | Cópia íntegra feita em condição consistente | Que alguém conseguiu restaurar e abrir evidências |

Consultar o [catálogo do Ollama](https://docs.ollama.com/api/tags) não precisa gerar texto. Use uma análise sintética, separada e sob demanda, para confirmar que a inferência realmente funciona. Latência e qualidade de extração são duas medidas distintas.

## Ensaio de restauração com dados fictícios

1. Prepare uma base descartável com um chamado, uma atualização e uma evidência fictícia, usando chaves exclusivas do laboratório.
2. Crie uma cópia consistente com um mecanismo que entenda SQLite. Em WAL, copiar só o arquivo principal enquanto há gravações pode perder conteúdo recente.
3. Restaure numa pasta isolada. Confira integridade, contagem, vínculos e a abertura de uma mídia. Nenhum passo deve apontar ao coletor ou ao arquivo ativo.
4. Registre horário, resultado e escopo. “Passou no laboratório” não vira selo de backup real nem prova que existe um agendamento de produção.

A [documentação do WAL](https://www.sqlite.org/wal.html) esclarece por que arquivo principal, estado de gravação e checkpoints importam. Use [o capítulo de persistência](03-fluxo-de-dados.md) para entender o que as colunas em claro e as chaves afetam na recuperação.

## O que ainda falta para ficar independente do PC

A documentação no GitHub Pages não é uma implantação da Central. Uma VM de laboratório, se disponível, pode validar arquitetura da CPU, navegador do coletor, sessão, SQLite, mídia, desempenho do modelo e custo medido, com dados inventados. A decisão de produção vem depois: volume persistente, restauração, controle de acesso, custódia das chaves, proteção de dados, monitoramento e retorno ao ambiente anterior se houver falha. Isso também exige definir quem guarda e consegue recuperar cada segredo com autorização.

## Exercício: backup verde, restauração “sem dados”

O arquivo foi criado hoje, mas não existe relatório de recuperação. Qual status você apresentaria?

**Resposta esperada:** cópia recente; restauração não comprovada. Planeje ensaio isolado antes de declarar a recuperação validada. Não teste sobrescrevendo o ambiente ativo.
