# ecografias

Sistema para disponibilizar ecografias online com upload e visualização de imagens.

## Como iniciar o projeto

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o servidor:
   ```bash
   npm start
   ```
O servidor iniciará na porta `3000` por padrão e servirá arquivos estáticos do diretório `public`.

## API

- `GET /api/ecografias` - lista todas as ecografias cadastradas.
- `POST /api/ecografias` - envia uma nova ecografia (campo `file`).
- `GET /uploads/<arquivo>` - acessa o arquivo enviado.

## Interface Web

A interface web disponível em `/` permite enviar novas ecografias e visualizar a lista de imagens cadastradas.
