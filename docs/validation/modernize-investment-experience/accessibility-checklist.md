# Checklist de acessibilidade — modernize-investment-experience

Tecnologia assistiva disponível: Narrador do Windows `10.0.22621.5983`. Navegador de validação automatizada: Chromium fornecido pelo Playwright.

## Evidência já comprovada por ferramenta

- [x] Landmarks, um `h1` por rota, hierarquia de títulos, link de salto e `aria-current` inspecionados pela árvore de acessibilidade.
- [x] Tabelas desktop com cabeçalhos e cartões mobile com rótulos equivalentes.
- [x] Labels, associações de erro, `aria-invalid`, regiões `status`/`alert` e nomes acessíveis.
- [x] Jornada completa somente por teclado, foco visível e ausência de armadilha.
- [x] Mensagens de carregamento, erro, parcial, stale, conflito e resultado desconhecido presentes em regiões anunciáveis.
- [x] Axe WCAG 2.2 A/AA sem violações detectáveis nas cinco rotas e nos estados principais.
- [x] Reflow sem overflow de página em 1440, 768, 720, 390 e 320 CSS px; zoom 200%, espaçamento de texto, cores forçadas e movimento reduzido.

## Narrador — confirmação humana

Use a pilha local em `http://127.0.0.1:4210` e registre `aprovado` ou a primeira divergência para cada linha:

- [x] O Narrador identifica banner, navegação, conteúdo principal, rodapé, título da rota e item atual nas cinco páginas e na 404.
- [x] Em Carteira, anuncia os cabeçalhos da tabela desktop e, em 390 px, ticker, corretora, quantidade, moeda, cotação e estado de cada cartão.
- [x] Em Operações, anuncia rótulos e erros associados ao campo inválido sem perder o valor digitado.
- [x] Anuncia distintamente envio pendente, sucesso simulado, recusa/erro, conflito 409 e resultado desconhecido.
- [x] Após conflito ou resultado desconhecido, anuncia a reconciliação e não sugere que a operação foi reenviada ou concluída.
- [x] O foco permanece perceptível e não é coberto pela navegação durante a jornada.

Resultado humano em 6 de setembro de 2026: **APROVADO**, sem divergência funcional bloqueante nos critérios atuais da tarefa 9.3.

Uma revisão estética e de experiência será realizada posteriormente. Ela é um refinamento não bloqueante e não altera o aceite funcional desta mudança.
