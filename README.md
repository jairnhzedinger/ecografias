# EcoShare

Sistema para disponibilizar ecografias online com upload, compartilhamento por WhatsApp e visualização de laudos em PDF.

## Requisitos

- Node.js 18 ou superior
- Git para clonar o repositório

## Como iniciar o projeto

### 1. Obter o código

```bash
git clone <url-do-repositorio>
cd ecografias
```

### 2. Instalar o Node.js

- **Windows**: baixe o instalador em [nodejs.org](https://nodejs.org/) e siga as instruções.
- **Linux**: instale via gerenciador de pacotes, por exemplo `sudo apt install nodejs npm`.
- **macOS**: use o [Homebrew](https://brew.sh/) (`brew install node`) ou o instalador do site oficial.

Verifique a instalação com `node -v`.

### 3. Instalar dependências

```bash
npm install
```

### 4. Iniciar o servidor

```bash
npm start
```

O servidor iniciará na porta `3000` por padrão e servirá arquivos estáticos do diretório `public`.

Para executar a suíte de testes utilize `npm test`.

## API

- `GET /api/ecografias` - lista todas as ecografias cadastradas.
- `POST /api/ecografias` - envia um novo laudo em PDF (campo `file`). O corpo também deve conter `patientName`, `cpf`, `whatsapp`, `examDate` e `notes`. Após o envio, um link de compartilhamento é enviado automaticamente para o WhatsApp informado.
- `GET /uploads/<arquivo>` - acessa o arquivo enviado (requer autenticação).
- `GET /api/message` - obtém o texto utilizado para envio via WhatsApp.
- `POST /api/message` - atualiza o texto da mensagem enviada.
- `GET /api/downloads` - lista registros de downloads.
- `GET /api/stats` - retorna estatísticas gerais.
- `GET /api/whatsapp/status` - informa se o WhatsApp está conectado.
- `POST /api/whatsapp/reset` - reinicia a sessão do WhatsApp.
- `GET /api/ecografias.csv` - exporta a lista de exames em CSV.
- `POST /api/ecografias/:id/unshare` - desativa o compartilhamento de um exame.
- `POST /api/users/:username/password` - altera a senha do usuário informado.

## Interface Web

A interface web disponível em `/` permite enviar novas ecografias e visualizar a lista de imagens cadastradas.
Os usuários possuem papéis de **admin**, **medico** ou **paciente**. Somente administradores conseguem gerenciar usuários.
Pacientes enxergam apenas seus próprios exames.
Para que um paciente visualize seu laudo, um link de compartilhamento é gerado pelo administrador. O paciente precisa acessar esse link e informar o CPF cadastrado para liberar o PDF.

Ao iniciar o servidor é exibido um QR code no terminal para conectar o WhatsApp Web. A conta associada será utilizada para enviar automaticamente o link do laudo para o número informado no cadastro.

## Login com Google

Para habilitar o login via Google é necessário criar credenciais OAuth 2.0 no Google Cloud.

1. Acesse [console.cloud.google.com](https://console.cloud.google.com/) e crie um projeto.
2. Ative a API **Google Identity** e crie um ID do cliente OAuth do tipo **Aplicativo da Web**.
3. Defina `http://localhost:3000/auth/google/callback` como URL de redirecionamento autorizada (para uso local).
4. Anote o **Client ID** e o **Client Secret** gerados.

Antes de iniciar o servidor defina as variáveis de ambiente abaixo com os valores obtidos:

```bash
export GOOGLE_CLIENT_ID="seu_id"
export GOOGLE_CLIENT_SECRET="sua_chave"
export GOOGLE_CALLBACK_URL="https://sua.url/auth/google/callback"
npm start
```

Essas chaves não devem ser versionadas.

Ao realizar o primeiro login via Google um novo usuário é criado automaticamente
com papel **paciente**. São armazenados nome, e-mail e foto do perfil fornecido
pelo Google. O serviço não informa CPF, portanto esse dado continua sendo
solicitado separadamente. Ao entrar com Google pela primeira vez uma página
solicitará o CPF. Após informar o número ele é salvo no cadastro e usado para
filtrar os exames exibidos ao paciente.
