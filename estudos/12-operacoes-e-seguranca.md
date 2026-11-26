# 12. Operações e segurança

[Índice](README.md) · Pré-requisitos: [HTTP](04-http-apis-e-redes.md), [acesso remoto](09-acesso-remoto-e-android.md) e [permissões](10-identidade-e-permissoes.md).

## Leia uma linha do inspetor

Use a linha fictícia a seguir. A rota não é a da Central e o IP vem de uma faixa reservada para documentação; não representa um aparelho da Runavolt.

| Campo | Exemplo | O que você consegue concluir |
| --- | --- | --- |
| Camada | Ponte HTTPS | A troca foi observada na entrada remota |
| Origem | 198.51.100.24 | É o IP externo observado pelo encaminhamento confiável, não o nome da pessoa |
| Par local | Loopback | É o vizinho TCP que falou com o serviço local |
| Método, rota e status | GET /api/exemplo/cases → 200 | Uma leitura daquele recurso recebeu resposta |
| Perfil | Edição | A sessão tinha esse perfil quando a troca foi registrada |
| Entrada, saída e tempo | 0 B, 2,4 KiB, 18 ms | São medidas da troca HTTP observada, não do tráfego total na rede |

Um proxy pode repassar a origem, mas o aplicativo só deve usar esse dado se souber que veio do caminho configurado. Quando não for possível determinar a origem com confiança, marque como indisponível e mostre o par local separadamente. Classificação Android ou Web é um indício de cliente, não credencial.

## Por que isso não é Wireshark

Uma troca HTTP pode ocupar vários pacotes; um pacote com ACK não corresponde a uma página. A mesma troca pode ser vista na ponte e no coletor. O inspetor de aplicação não capta quadros Ethernet, tráfego do restante da rede ou conteúdo das mensagens, e não precisa disso para explicar a maioria dos problemas da Central. Filtros de camada, rota e status ajudam a comparar sinais sem misturar medições de pontos diferentes.

## Antes de bloquear, verifique o sinal

Um 401 isolado pode ser sessão expirada; um 403 pode ser uma permissão aplicada corretamente; 429 indica limite alcançado, não necessariamente ataque. Observe a sequência, a rota, o perfil quando disponível e o funcionamento esperado. Falhas repetidas podem justificar revisão e intervenção, mas IP compartilhado e automações legítimas tornam bloqueio automático por ocorrência isolada um risco operacional.

Separe inventário local de portas da exposição real: escutar em loopback não é escutar na LAN, e um túnel pode publicar um caminho sem publicar todas as portas. O console não substitui firewall, não deve ser acessível remotamente e não inclui senhas, parâmetros sensíveis ou corpos. Oriente a revisão de controles com o [OWASP Top 10](https://owasp.org/projects/top-ten) e compare os conceitos com o [catálogo de rotas](04-http-apis-e-redes.md).

## Investigue conexões por fluxo

Na versão local com o console administrativo habilitado, é possível comparar **última tentativa**, **última leitura bem-sucedida** e **próxima execução**. Um fluxo sem conversa vinculada está inativo; um fluxo sem primeira leitura está sem confirmação. Nenhum dos dois deve aparecer como falha confirmada. Uma consulta bem-sucedida pode ler zero mensagens.

Em um exemplo fictício de laboratório, o fluxo de tickets falha porque a credencial do conector está indisponível, mas o fluxo de conversas permanece operante. O resumo sinaliza atenção e o detalhe orienta conferir o cofre local. A linha do tempo registra resultado e categoria de erro, sem registrar a credencial, a mensagem ou a resposta bruta do provedor. O administrador pode solicitar outra leitura com limite de frequência, sem ampliar o escopo ou enviar mensagens.

Esses recursos descrevem a versão local avaliada em laboratório. O código-fonte publicado no GitHub pode estar em uma versão anterior e não conter essa implementação.

## Exercício: 200, 401 e 502 no mesmo minuto

Uma checagem recebe 200 na tela de login, 401 na lista sem sessão, e depois um acesso autorizado recebe 502 na ponte. O que olhar primeiro?

**Resposta:** os dois primeiros podem estar corretos. O 502 aponta para o caminho entre ponte e servidor local; verifique saúde, horário e camada antes de resetar senha ou bloquear IP.
