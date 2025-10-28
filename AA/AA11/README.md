# Monitor de Mensagens TCP/UDP com WebSocket

* **Alunos:** Vitor Fernando da Silva e Bernardo Carlos Franceschina [Grupo 09]
* **Disciplina:** Programação para Web
* **Professor:** Wyllian Bezerra da Silva

## Arquitetura

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

3.  **Clientes (`tcp_client.py`, `udp_client.py`):**
    * Scripts python fornecidos para enviar mensagens TCP (porta 8080) e UDP (porta 8081) ao servidor.

## Requisitos de Instalação

* Python 3.7 ou superior.
* Bibliotecas descritas no arquivo requirements.txt

## Configuração

1.  **Clone ou Baixe os Arquivos:**
    * Certifique-se de ter todos os arquivos na estrutura correta.

2.  **Estrutura de Pastas Esperada:**
    ```
    /AA11/
    |-- server.py         (Servidor)
    |-- index.html        (Página web)
    |-- tcp_client.py     (Cliente TCP)
    |-- udp_client.py     (Cliente UDP)
    |-- requirements.txt  (Bibliotecas python)
    |-- /css/
    |   |-- ws.css        (css da página web)
    |-- /js/
    |   |-- ws.js         (Javascript da página web)
    ```

3.  **Instale as Dependências Python:**

    ```bash
    pip install -r requirements.txt
    ```

## Execução

1.  **Servidor Principal:**
    * Na pasta raiz do projeto, execute o arquivo do servidor python.
    
    ```bash
    python server.py
    ```
    
    * Você verá logs indicando que os servidores HTTP e WebSocket foram iniciados. O servidor HTTP deve ser acessado em `http://localhost:8000`.

2.  **Página web:**
    * Abra seu navegador e acesse **`http://localhost:8000`**
    * A página irá carregar e o status inicial do servidor será **offline**.

3.  **Listeners TCP/UDP:**
    * Na página web, clique no botão **"Iniciar Servidor"**.
    * O status deve mudar para "Iniciando servidor..." e depois para "Servidor Online".
    * No terminal onde o `server.py` está rodando, você verá logs indicando que os servidores TCP e UDP foram iniciados nas portas 8080 e 8081.


## Testes

1.  **Teste o Cliente TCP:**
    * Abra um **novo terminal** e navegue até a raiz do projeto.
    * Execute o cliente TCP:
    
    ```bash
    python tcp_client.py
    ```
    
    * Quando solicitado `URL do servidor`, apenas pressione **Enter** para usar o padrão (`http://localhost:8080`).
    * Digite uma mensagem e pressione **Enter**.    
        * No monitor web, uma nova mensagem com a flag **TCP** deve aparecer.
        * O contador "Mensagens TCP" deve incrementar.
        * No terminal do cliente TCP, você deve receber a resposta: "Resposta do servidor: [TCP] Ola TCP".

2.  **Teste o Cliente UDP:**
    * Abra um **terceiro terminal** e navegue até a raiz do projeto.
    * Execute o cliente UDP:

    ```bash
    python udp_client.py
    ```
    
    * Quando solicitado `URL do servidor`, apenas pressione **Enter** para usar o padrão (`http://localhost:8081`).
    * Digite uma mensagem e pressione **Enter**.
        * No monitor web, uma nova mensagem com a flag **UDP** deve aparecer.
        * O contador "Mensagens UDP" deve incrementar.
        * No terminal do cliente UDP, você deve receber a resposta: "Resposta do servidor: [UDP] Ola UDP".

3.  **Controles Adicionais:**
    * **Filtros (Tabs):** Clique nas abas "TCP" e "UDP" para filtrar as mensagens por protocolo
    
    * **Limpar Mensagens:** Clique em "Limpar Mensagens" para remover todas as mensagens.
    
    * **Parar Servidor:** Clique em "Parar Servidor". O status deve mudar para "Servidor Offline". Neste estado, enviar novas mensagens dos clientes TCP/UDP resultará em erro de conexão.