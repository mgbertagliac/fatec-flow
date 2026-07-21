# Fatec Flow 3.0 — iPhone Edition

Sistema acadêmico pessoal em formato PWA, reconstruído com interface mobile-first para iPhone 13 Pro Max e outros tamanhos de iPhone.

## Arquitetura

- HTML, CSS e JavaScript estáticos.
- Sem Apache, PHP, MySQL ou banco de dados remoto.
- Sem computador ligado para funcionar.
- Dados acadêmicos salvos localmente no navegador do aparelho.
- Google Calendar acessado diretamente por OAuth após autorização do usuário.
- Funciona no GitHub Pages e pode ser instalado pela Tela de Início do iPhone.

## Recursos mantidos

- Vários semestres, com datas, status e validação contra sobreposição.
- Bloqueio de cadastros acadêmicos quando não existe semestre válido.
- Validação de provas, atividades, eventos e presenças dentro do período do semestre.
- 11 componentes acadêmicos iniciais.
- Professores por disciplina e semestre.
- Provas, atividades, entregas, seminários, projetos, apresentações, listas, substitutivas e exames.
- Notas, nota máxima, peso, status e simulações.
- Fórmula manual por disciplina e professor usando `+`, `-`, `*`, `/` e parênteses.
- Variáveis criadas automaticamente a partir das avaliações cadastradas, como `P1`, `P2`, `TRAB` e `SEM`.
- Média atual, nota necessária, arredondamento e política para notas pendentes.
- Presença, ausência, atraso, saída antecipada, falta justificada e aula cancelada.
- Controle por períodos, frequência mínima e alertas de risco.
- AACC e estágio por carga horária.
- Senha local e bloqueio automático.
- Alertas personalizados em minutos, horas, dias ou semanas.
- Google Calendar: importar, criar, editar, excluir, vincular ao semestre e atualizar títulos.
- Importação e exportação `.ics`.
- Backup e restauração JSON.
- Lixeira local.
- Calendário oficial da Fatec Bauru.
- Tema claro, escuro ou automático.

## Interface do iPhone

A navegação principal fica no rodapé:

1. **Hoje** — resumo, próximos compromissos e atalhos.
2. **Agenda** — todos os eventos e avaliações.
3. **Disciplinas** — desempenho e botão de cálculo em cada disciplina.
4. **Notas** — avaliações, cálculo e simulador.
5. **Mais** — semestres, professores, frequência, calendário oficial e configurações.

O botão flutuante `＋` abre rapidamente o cadastro de uma atividade acadêmica.

## Onde montar o cálculo

1. Abra **Notas** no rodapé.
2. Em **1. Avaliações**, cadastre P1, P2, trabalhos e demais itens.
3. Lance as notas quando forem divulgadas.
4. Abra **2. Cálculo**.
5. Escolha a disciplina.
6. Toque nas variáveis e operadores para montar a fórmula.
7. Salve o método do professor.

Também é possível abrir o cálculo pelo botão **Cálculo** no cartão de cada disciplina.

## Atualizar no GitHub Pages

Substitua todos os arquivos antigos pelos arquivos desta versão, mantendo `index.html` na raiz do repositório. Aguarde a publicação do GitHub Pages e atualize com `Ctrl + F5` no computador.

No iPhone, remova a instalação anterior da Tela de Início e instale novamente pelo Safari para garantir a atualização do cache.

## Segurança

A senha é local e não existe recuperação por e-mail. Exporte backups JSON regularmente. O Client Secret do Google nunca deve ser colocado no aplicativo.
