# Monitor de Mensagens TCP/UDP com WebSocket

Este projeto implementa um monitor web que exibe, em tempo real, mensagens recebidas por um servidor Python através de sockets TCP e UDP. O servidor encaminha essas mensagens para a interface web usando WebSockets.

## Autoria

* **Autor(es):** [Insira seu Nome/Matrícula aqui]
* **Disciplina:** Programação para Web
* **Professor:** [Nome do Professor]

## Arquitetura

O sistema é composto por três partes principais:

1.  **Servidor Python (`server.py`):**
    * Um servidor `asyncio` que executa quatro serviços concorrentemente:
    * **Servidor HTTP (Porta 8000):** Serve os arquivos estáticos (`index.html`, `ws.css`, `ws.js`) e fornece uma API REST (`/start`, `/stop`, `/status`) para controlar os listeners TCP/UDP.
    * **Servidor WebSocket (Porta 8082):** Recebe conexões dos clientes (navegadores) e transmite as mensagens recebidas (TCP/UDP) para eles em formato JSON.
    * **Listener TCP (Porta 8080):** Ouve conexões TCP, recebe dados e os encaminha para o servidor WebSocket.
    * **Listener UDP (Porta 8081):** Ouve datagramas UDP, recebe dados e os encaminha para o servidor WebSocket.

2.  **Frontend (`index.html`, `ws.css`, `ws.js`):**
    * A interface web que o usuário acessa (`http://localhost:8000`).
    * Usa JavaScript para se conectar ao servidor WebSocket (porta 8082) e à API HTTP (porta 8000).
    * Exibe os botões de controle (Iniciar, Parar, Limpar).
    * Mostra o status do servidor (Online/Offline).
    * Renderiza as mensagens recebidas, atualiza contadores e permite a filtragem.

3.  **Clientes de Teste (`tcp_client.py`, `udp_client.py`):**
    * Scripts Python fornecidos para enviar mensagens TCP (porta 8080) e UDP (porta 8081) ao servidor e verificar o funcionamento.

## Requisitos de Instalação

* Python 3.7 ou superior.
* Bibliotecas Python: `aiohttp` e `websockets`.

## Roteiro de Instalação e Configuração

1.  **Clone ou Baixe os Arquivos:**
    * Certifique-se de ter todos os arquivos na estrutura correta.

2.  **Estrutura de Pastas Esperada:**
    ```
    /seu-projeto/
    |-- server.py         (O servidor principal)
    |-- index.html        (A página web)
    |-- tcp_client.py     (Cliente de teste)
    |-- udp_client.py     (Cliente de teste)
    |-- /css/
    |   |-- ws.css        (O CSS fornecido)
    |-- /js/
    |   |-- ws.js         (O JavaScript do cliente)
    ```

3.  **Instale as Dependências Python:**
    * Abra um terminal ou prompt de comando.
    * Execute o seguinte comando para instalar as bibliotecas necessárias:
    ```bash
    pip install aiohttp websockets
    ```

## Roteiro de Execução e Teste

1.  **Inicie o Servidor Principal:**
    * No terminal, navegue até a pasta do projeto.
    * Execute o servidor Python:
    ```bash
    python server.py
    ```
    * Você verá logs indicando que os servidores HTTP e WebSocket foram iniciados. O servidor HTTP estará acessível em `http://localhost:8000`.

2.  **Acesse o Monitor Web:**
    * Abra seu navegador (Chrome, Firefox, etc.) e acesse a URL:
    * **`http://localhost:8000`**
    * A página deve carregar. O status inicial será "Servidor Offline" (pois os listeners TCP/UDP ainda não estão rodando).

3.  **Inicie os Listeners TCP/UDP:**
    * No monitor web, clique no botão **"Iniciar Servidor"**.
    * O status deve mudar para "Iniciando servidor..." e depois para "Servidor Online" (com o ícone verde).
    * No terminal onde o `server.py` está rodando, você verá logs indicando que os servidores TCP e UDP foram iniciados nas portas 8080 e 8081.

4.  **Teste o Cliente TCP:**
    * Abra um **novo terminal**.
    * Execute o cliente TCP:
    ```bash
    python tcp_client.py
    ```
    * Quando solicitado `URL do servidor`, apenas pressione **Enter** para usar o padrão (`http://localhost:8080`).
    * Digite uma mensagem (ex: "Ola TCP") e pressione **Enter**.
    * **Verificação:**
        * No monitor web, uma nova mensagem com a flag **TCP** deve aparecer.
        * O contador "Mensagens TCP" deve incrementar.
        * No terminal do cliente TCP, você deve receber a resposta: "Resposta do servidor: TCP MENSAGEM RECEBIDA: Ola TCP".

5.  **Teste o Cliente UDP:**
    * Abra um **terceiro terminal**.
    * Execute o cliente UDP:
    ```bash
    python udp_client.py
    ```
    * Quando solicitado `URL do servidor`, apenas pressione **Enter** para usar o padrão (`http://localhost:8081`).
    * Digite uma mensagem (ex: "Ola UDP") e pressione **Enter**.
    * **Verificação:**
        * No monitor web, uma nova mensagem com a flag **UDP** deve aparecer.
        * O contador "Mensagens UDP" deve incrementar.
        * No terminal do cliente UDP, você deve receber a resposta: "Resposta do servidor: UDP MENSAGEM RECEBIDA: Ola UDP".

6.  **Teste os Controles Adicionais:**
    * **Filtros (Tabs):** Clique nas abas "TCP" e "UDP" para verificar se as mensagens são filtradas corretamente.
    * **Limpar Mensagens:** Clique em "Limpar Mensagens" para remover todas as mensagens e zerar os contadores.
    * **Parar Servidor:** Clique em "Parar Servidor". O status deve mudar para "Servidor Offline". Tentar enviar novas mensagens dos clientes TCP/UDP resultará em erro de conexão, provando que os listeners foram desligados.