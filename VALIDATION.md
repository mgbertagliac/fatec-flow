# Validação — Fatec Flow 3.0.0 iPhone Edition

## Testes funcionais executados

- PASS: criação da senha local na primeira abertura.
- PASS: desbloqueio e exibição do aplicativo.
- PASS: semestre padrão 2026/2 disponível.
- PASS: 11 componentes acadêmicos iniciais.
- PASS: criação de avaliação dentro do semestre.
- PASS: avaliação aparece na lista imediatamente.
- PASS: atividade cadastrada vira variável do cálculo.
- PASS: fórmula manual com variável cadastrada é validada.
- PASS: navegação inferior do iPhone.
- PASS: aba Notas e área de cálculo.
- PASS: guia visual das três etapas do cálculo.
- PASS: painel “Mais” com semestres, professores, frequência, calendário oficial e configurações.
- PASS: formulário de atividade abre como folha inferior no iPhone.
- PASS: largura e áreas de toque adaptadas ao viewport de 430 × 932.
- PASS: sidebar tradicional permanece disponível em computador.
- PASS: navegação móvel fica oculta em computador.
- PASS: teste interno de fórmula: resultado 6,8.
- PASS: validação de data dentro e fora do semestre.
- PASS: sintaxe JavaScript validada por `node --check`.
- PASS: manifesto JSON válido.
- PASS: ausência de IDs HTML duplicados.
- PASS: nenhuma exceção JavaScript durante os fluxos automatizados.

## Observações

A sincronização real com o Google Calendar depende da autorização OAuth da conta do usuário e deve ser confirmada no endereço HTTPS publicado. Nenhum Client Secret é utilizado.

Notificações próprias do PWA dependem das permissões do iPhone e do estado do aplicativo. Os lembretes gravados no Google Calendar continuam sendo o mecanismo principal para alertas com o aplicativo fechado.
