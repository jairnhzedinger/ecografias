# ecografias

Sistema para disponibilizar ecografias online com upload e visualização de laudos em PDF.

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
- `POST /api/ecografias` - envia um novo laudo em PDF (campo `file`). O corpo também deve conter `patientName`, `cpf`, `examDate` e `notes`.
- `GET /uploads/<arquivo>` - acessa o arquivo enviado.

## Interface Web

A interface web disponível em `/` permite enviar novas ecografias e visualizar a lista de imagens cadastradas.
Para que um paciente visualize seu laudo, um link de compartilhamento é gerado pelo administrador. O paciente precisa acessar esse link e informar o CPF cadastrado para liberar o PDF.
