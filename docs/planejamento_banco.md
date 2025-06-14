# Planejamento do Banco de Dados

Este documento descreve uma possível estrutura relacional para substituir os arquivos JSON atualmente utilizados. O objetivo é garantir integração entre as funcionalidades existentes e facilitar futuras manutenções.

## Tabelas

### 1. `usuarios`
| Campo         | Tipo            | Restrições                         | Descrição                                |
|---------------|-----------------|-------------------------------------|---------------------------------------------|
| `id`          | INTEGER         | PK, auto incremento                 | Identificador interno                      |
| `username`    | VARCHAR(255)    | Único, não nulo                   | Nome de usuário ou e-mail                 |
| `senha_hash`  | VARCHAR(255)    | não nulo                           | Senha criptografada (bcrypt)               |
| `papel`       | VARCHAR(20)     | não nulo                           | `admin`, `medico` ou `paciente`            |
| `nome`        | VARCHAR(255)    | opcional                            | Nome completo                              |
| `cpf`         | VARCHAR(14)     | opcional, único                    | CPF normalizado apenas com dígitos         |
| `foto`        | VARCHAR(255)    | opcional                            | URL da foto do perfil                      |

### 2. `ecografias`
| Campo            | Tipo            | Restrições            | Descrição                              |
|------------------|-----------------|----------------------|-------------------------------------------|
| `id`             | INTEGER         | PK, auto incremento  | Identificador do exame                    |
| `patient_name`   | VARCHAR(255)    | não nulo            | Nome do paciente                          |
| `cpf`            | VARCHAR(14)     | opcional             | CPF do paciente (normalizado)             |
| `exam_date`      | DATE            | opcional             | Data da realização do exame               |
| `notes`          | TEXT            | opcional             | Observações adicionais                   |
| `original_name`  | VARCHAR(255)    | não nulo            | Nome do arquivo enviado originalmente     |
| `filename`       | VARCHAR(255)    | não nulo            | Nome do arquivo salvo no servidor         |
| `thumb_filename` | VARCHAR(255)    | opcional             | Nome da miniatura (quando imagem/PDF)     |
| `whatsapp`       | VARCHAR(20)     | opcional             | Número para envio do link                |
| `timestamp`      | TIMESTAMP       | não nulo            | Horário de cadastro                       |
| `shared`         | BOOLEAN         | não nulo, padrão false | Indica se o exame está compartilhado       |

### 3. `tokens_compartilhamento`
| Campo       | Tipo      | Restrições           | Descrição                                 |
|-------------|-----------|-----------------------|----------------------------------------------|
| `token`     | VARCHAR(50) | PK                  | Código alfanumérico para acesso             |
| `ecografia_id` | INTEGER   | FK `ecografias.id`  | Exame associado                              |
| `expira_em` | TIMESTAMP | não nulo            | Data/hora de expiração do token              |

### 4. `downloads`
| Campo          | Tipo      | Restrições            | Descrição                              |
|----------------|-----------|----------------------|-------------------------------------------|
| `id`           | INTEGER   | PK, auto incremento  | Identificador do registro                |
| `ecografia_id` | INTEGER   | FK `ecografias.id`   | Exame baixado                            |
| `timestamp`    | TIMESTAMP | não nulo            | Horário do download                      |

### 5. `logs`
| Campo       | Tipo      | Restrições           | Descrição                              |
|-------------|-----------|----------------------|-------------------------------------------|
| `id`        | INTEGER   | PK, auto incremento  | Identificador do log                     |
| `acao`      | TEXT      | não nulo            | Mensagem registrada                      |
| `registrado_em` | TIMESTAMP | não nulo        | Data/hora da ação                       |
| `usuario_id` | INTEGER   | FK `usuarios.id` opcional | Qual usuário realizou a ação (quando aplicável) |

### 6. `mensagens`
Tabela simples para armazenar o modelo de texto enviado por WhatsApp.
| Campo    | Tipo    | Restrições | Descrição                  |
|----------|---------|------------|-----------------------------|
| `id`     | INTEGER | PK         | Identificador (sempre 1)    |
| `texto`  | TEXT    | não nulo  | Conteúdo do modelo de mensagem |

## Relacionamentos
- `ecografias.cpf` pode referenciar opcionalmente `usuarios.cpf` quando o paciente estiver cadastrado.
- `tokens_compartilhamento.ecografia_id` referencia `ecografias.id` e permite controle de validade dos links.
- `downloads.ecografia_id` referencia `ecografias.id` para contabilizar acessos.
- `logs.usuario_id` referencia `usuarios.id` para identificar quem realizou cada ação.

## Considerações de Implementação
1. **Normalização de CPF**: armazenar apenas dígitos (sem pontos ou traço) para facilitar buscas e comparações.
2. **Miniaturas**: manter `thumb_filename` opcional para registros de PDF quando o utilitário de conversão não estiver disponível.
3. **Mensagens**: apesar de existir apenas um modelo global, usar tabela `mensagens` permite versões futuras ou múltiplos modelos.
4. **Auditoria**: a tabela `logs` substitui o arquivo de texto e possibilita consultas e filtros por data ou usuário.
5. **Chaves estrangeiras**: configurar `ON DELETE CASCADE` em `tokens_compartilhamento` e `downloads` para remover registros relacionados quando um exame for excluído.

Essa estrutura cobre as informações já presentes nos arquivos JSON (`users.json`, `ecografias.json`, `downloads.json`, `message.txt` e `logs`) e facilita expansões futuras sem alterar funcionalidades já implementadas.

