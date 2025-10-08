BackOffice Operacional C.Bank
Este é o repositório do BackOffice Operacional para o C.Bank, uma instituição financeira fictícia. A plataforma é uma aplicação web de página única (SPA) projetada para que funcionários internos gerenciem operações de clientes, usuários da plataforma e auditem ações do sistema.

Tabela de Conteúdos
Visão Geral

Diagrama da Arquitetura

Tecnologias Utilizadas

Estrutura de Arquivos

Setup e Instalação

Funcionalidades Implementadas

Próximos Passos

Visão Geral
O BackOffice C.Bank é uma ferramenta interna que centraliza as operações do dia a dia. A autenticação é feita via Google SSO para garantir a segurança e facilitar o acesso dos funcionários. A interface permite, com base em um robusto sistema de perfis e permissões (RBAC), que diferentes níveis de operadores executem ações como consultar dados de clientes, visualizar logs de auditoria e gerenciar outros usuários da plataforma.

Diagrama da Arquitetura
O sistema é construído sobre uma arquitetura de microserviços, orquestrada com Docker Compose. O API Gateway atua como um ponto de entrada único (Single Point of Entry), centralizando autenticação, autorização e roteamento para os serviços de negócio.

Snippet de código

graph TD
    subgraph "Usuário (Funcionário)"
        A[Navegador Web]
    end

    subgraph "Servidor (AWS EC2)"
        B[Nginx / Reverse Proxy]
        C[API Gateway (Flask)]
        
        subgraph "Microserviços (Flask)"
            D[service-clients]
            E[service-accounts]
            F[service-passwords]
            G[service-remittance]
        end

        subgraph "Banco de Dados & Cache"
            H[(MySQL)]
            I[(Redis)]
        end

        subgraph "Assistente Virtual"
            J[Rasa Server]
            K[Rasa Action Server]
        end
    end

    A -- HTTPS --> B
    B -- Roteamento de API --> C
    C -- Roteamento Interno --> D
    C -- Roteamento Interno --> E
    C -- Roteamento Interno --> F
    C -- Roteamento Interno --> G
    
    C --- H
    D --- H
    E --- H
    F --- H
    G --- H
    
    C --- I

    K -- Chamadas HTTP --> C
Tecnologias Utilizadas
Frontend:

HTML5, CSS3, JavaScript (ES6+)

Bootstrap 5.3

Nginx (servidor web e proxy reverso)

Backend (API Gateway & Microserviços):

Python 3.10

Flask (framework web)

Flask-SQLAlchemy (ORM)

Flask-JWT-Extended (Autenticação JWT)

Banco de Dados & Cache:

MySQL 8.0

Redis

Assistente Virtual:

Rasa Open Source

Infraestrutura & DevOps:

Docker & Docker Compose

Certbot (para certificados SSL/TLS)

Estrutura de Arquivos
digital-bank-project/
├── api-gateway/         # Ponto de entrada: autenticação, autorização e roteamento
├── certbot/             # Configuração e certificados SSL
├── frontend/            # Contém a SPA (HTML/CSS/JS) e a configuração do Nginx
├── mysql-init/
│   └── init.sql         # Script de inicialização do banco de dados (schema e seed)
├── service-clients/     # Microserviço para gerenciar os clientes do banco
├── service-accounts/    # Microserviço para gerenciar contas
├── service-passwords/   # Microserviço para gerenciar senhas
├── ... (outros serviços)
├── rasa-bot/            # Configuração do chatbot
├── .gitignore           # Arquivos e pastas a serem ignorados pelo Git
├── docker-compose.yml   # Orquestrador de todos os contêineres da aplicação
└── README.md            # Este arquivo
Setup e Instalação
Siga os passos abaixo para configurar o ambiente de desenvolvimento.

Pré-requisitos
Docker e Docker Compose instalados.

Git instalado.

Um domínio válido apontando para o IP público do servidor.

Portas 80, 443 e 8443 abertas no firewall/security group.

Credenciais OAuth 2.0 (Client ID) do Google Cloud Platform.

Passos para Instalação
Clonar o Repositório:

Bash

git clone https://github.com/seu-usuario/digital-bank-backoffice.git
cd digital-bank-backoffice
Configurar Variáveis de Ambiente:

Copie o arquivo de exemplo .env.example para criar seu próprio arquivo .env.

Bash

cp api-gateway/.env.example api-gateway/.env
Abra o arquivo api-gateway/.env e preencha todas as variáveis, especialmente MYSQL_PASSWORD, MYSQL_ROOT_PASSWORD, JWT_SECRET_KEY e VUE_APP_GOOGLE_CLIENT_ID.

Geração do Certificado SSL (Apenas na primeira vez):
Este projeto usa Certbot para gerar certificados SSL. Na primeira execução, é necessário um "ritual" de 3 passos:

a. Comente temporariamente os serviços: Abra o docker-compose.yml e comente todos os serviços, exceto frontend e certbot.

b. Gere o certificado: Execute o comando abaixo, substituindo seu-email@dominio.com e seu.dominio.com.br pelos seus dados.

Bash

docker-compose run --rm certbot certonly --webroot --webroot-path /var/www/certbot --email seu-email@dominio.com -d seu.dominio.com.br --agree-tos -n
c. Descomente os serviços: Volte ao docker-compose.yml e descomente todos os serviços que você havia comentado.

Subir a Aplicação Completa:

Após configurar o .env e gerar o certificado, suba todos os contêineres. O comando --build é importante na primeira vez para construir todas as imagens.

Bash

docker-compose up -d --build
A aplicação estará disponível no seu domínio (https://seu.dominio.com.br).

(Opcional) Popular o Banco com Dados de Teste:

Para criar clientes fakes, execute o script de seeding:

Bash

docker exec -it service_clients python seed.py
Funcionalidades Implementadas
[x] Autenticação de funcionários via Google SSO.

[x] Arquitetura de Microserviços orquestrada com Docker.

[x] API Gateway centralizando a comunicação.

[x] Gestão de Usuários do Backoffice (CRUD completo).

[x] Sistema de Perfis e Permissões (RBAC).

[x] Log de Auditoria robusto (registra login, acesso a funcionalidades e modificações).

[x] Filtros avançados na tela de Logs (por usuário, data e tipo de ação) com busca via POST.

[x] Painel para Gestão de Clientes (CRUD).

[x] Funcionalidade de Consulta de Cliente por CPF.

[x] Visualização de Extrato de Transações do Cliente.

Próximos Passos
[ ] Evoluir a busca de cliente para um sistema de "autocomplete" por nome.

[ ] Finalizar o service-remittance para envio de documentos via S3.

[ ] Conectar o Rasa a um canal (ex: WhatsApp) para atendimento ao cliente.

[ ] Implementar sistema de Migrations com Flask-Migrate para gerenciar alterações no banco de dados sem perda de dados.

Observação: Este projeto é para fins de estudo e demonstração. As chaves e senhas no .env devem ser tratadas com segurança.
