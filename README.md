# EcoShare

Sistema para disponibilizar ecografias online com upload, compartilhamento por WhatsApp e visualização de laudos em PDF.

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
- `POST /api/ecografias` - envia um novo laudo em PDF (campo `file`). O corpo também deve conter `patientName`, `cpf`, `whatsapp`, `examDate` e `notes`. Após o envio, um link de compartilhamento é enviado automaticamente para o WhatsApp informado.
- `GET /uploads/<arquivo>` - acessa o arquivo enviado.

## Interface Web

A interface web disponível em `/` permite enviar novas ecografias e visualizar a lista de imagens cadastradas.
Para que um paciente visualize seu laudo, um link de compartilhamento é gerado pelo administrador. O paciente precisa acessar esse link e informar o CPF cadastrado para liberar o PDF.

Ao iniciar o servidor é exibido um QR code no terminal para conectar o WhatsApp Web. A conta associada será utilizada para enviar automaticamente o link do laudo para o número informado no cadastro.
