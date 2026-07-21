# Publicar no GitHub Pages

## Atualização da versão existente

1. Exporte um backup JSON da versão atual.
2. Extraia o ZIP da versão 3.0.0.
3. No repositório do GitHub, substitua todos os arquivos antigos.
4. Confirme que `index.html`, `app.js`, `styles.css`, `manifest.webmanifest` e `service-worker.js` estão na raiz.
5. Abra **Settings → Pages**.
6. Use `Deploy from a branch`, branch `main`, pasta `/(root)`.
7. Aguarde **pages build and deployment** ficar verde.
8. Abra o site e use `Ctrl + F5`.

## Atualização no iPhone

1. Remova o Fatec Flow antigo da Tela de Início.
2. Abra o endereço publicado no Safari.
3. Atualize a página.
4. Adicione novamente à Tela de Início.

## Google OAuth

A origem JavaScript autorizada continua sendo apenas:

```text
https://mgbertagliac.github.io
```

Não use Client Secret, API Key ou faturamento no PWA.
