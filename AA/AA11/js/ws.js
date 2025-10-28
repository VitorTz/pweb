

const apiUrl = `${window.location.origin}`; 
const websocketUrl = `ws://${window.location.hostname}:8082`; 


document.addEventListener('DOMContentLoaded', () => {
    
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const startServerBtn = document.getElementById('startServer');
    const stopServerBtn = document.getElementById('stopServer');
    const clearMessagesBtn = document.getElementById('clearMessages');
    
    const tcpCountEl = document.getElementById('tcpCount');
    const udpCountEl = document.getElementById('udpCount');
    const totalCountEl = document.getElementById('totalCount');
    
    const messageList = document.getElementById('messageList');
    const noMessagesEl = document.getElementById('noMessages');
    
    const tabs = document.querySelectorAll('.tab');
    
    const debugInfo = document.getElementById('debugInfo');
    const debugToggle = document.getElementById('debugToggle');
    const currentYear = document.getElementById('currentYear');
    
    let ws = null;
    let debugMode = false;
    let messageCount = { 
        tcp: 0, 
        udp: 0, 
        total: 0 
    };
    
    debugToggle.addEventListener('click', () => {
        debugMode = !debugMode;
        debugInfo.style.display = debugMode ? 'block' : 'none';
        debugToggle.textContent = debugMode ? 'Ocultar Informações de Depuração' : 'Exibir Informações de Depuração';
    });

    function logDebug(message) {
        const now = new Date().toISOString();
        const logLine = `[${now}] ${message}\n`;
        debugInfo.innerHTML += logLine;
        debugInfo.scrollTop = debugInfo.scrollHeight;
        console.log(`[DEBUG] ${message}`);
    }

    function updateServerStatus(status, text) {
        logDebug(`Atualizando status da UI: ${status}, Texto: ${text}`);
        statusDot.className = 'status-dot';
        statusText.textContent = text;
        
        startServerBtn.disabled = true;
        stopServerBtn.disabled = true;

        switch (status) {
            case 'running':
                statusDot.classList.add('status-online');
                stopServerBtn.disabled = false;
                break;
            case 'stopped':
                statusDot.classList.add('status-offline');
                startServerBtn.disabled = false;
                break;
            case 'starting':
                statusText.textContent = 'Iniciando servidor...';
                break;
            case 'stopping':
                statusText.textContent = 'Parando servidor...';
                break;
            case 'checking':
                statusText.textContent = 'Verificando status do servidor...';
                break;
            case 'ws_disconnected':
                statusDot.classList.add('status-offline');
                statusText.textContent = "Desconectado do WebSocket. Tentando reconectar...";
                startServerBtn.disabled = true;
                stopServerBtn.disabled = false;
                break;
            case 'error':
                 statusDot.classList.add('status-offline');
                 statusText.textContent = text;
                 startServerBtn.disabled = false;
                 break;
        }
    }

    async function checkServerStatus() {
        updateServerStatus('checking');
        try {
            const response = await fetch(`${apiUrl}/status`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            
            logDebug(`Status recebido do servidor: ${JSON.stringify(data)}`);
            updateServerStatus(data.status, data.status === 'running' ? 'Servidor Online' : 'Servidor Offline');
            
            if (data.status === 'running' && (ws === null || ws.readyState === WebSocket.CLOSED)) {
                connectWebSocket();
            } else if (data.status === 'stopped' && ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        } catch (error) {
            logDebug(`Erro ao verificar status: ${error}`);
            updateServerStatus('stopped', 'Servidor Offline (falha ao conectar na API)');
        }
    }

    startServerBtn.addEventListener('click', async () => {
        updateServerStatus('starting');
        logDebug('Solicitando início do servidor...');
        try {
            const response = await fetch(`${apiUrl}/start`, { method: 'POST' });
            const data = await response.json();
            logDebug(`Resposta do início: ${JSON.stringify(data)}`);
            if (data.status === 'running') {
                updateServerStatus('running', 'Servidor Online');
                connectWebSocket();
            } else {
                updateServerStatus('error', `Falha ao iniciar: ${data.message || 'Erro desconhecido'}`);
            }
        } catch (error) {
            logDebug(`Erro ao iniciar servidor: ${error}`);
            updateServerStatus('error', 'Erro ao contatar API para iniciar.');
        }
    });

    stopServerBtn.addEventListener('click', async () => {
        updateServerStatus('stopping');
        logDebug('Solicitando parada do servidor...');
        try {
            const response = await fetch(`${apiUrl}/stop`, { method: 'POST' });
            const data = await response.json();
            logDebug(`Resposta da parada: ${JSON.stringify(data)}`);
            updateServerStatus('stopped', 'Servidor Offline');
            if (ws) {
                ws.close();
            }
        } catch (error) {
            logDebug(`Erro ao parar servidor: ${error}`);
            updateServerStatus('running', 'Erro ao parar servidor.');
        }
    });

    // [WebSocket] 
    function connectWebSocket() {
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
            logDebug('Conexão WebSocket já existe ou está conectando.');
            return;
        }

        logDebug(`Conectando ao WebSocket: ${websocketUrl}`);
        ws = new WebSocket(websocketUrl);

        ws.onopen = () => {
            logDebug('WebSocket conectado');
            if (statusText.textContent !== 'Servidor Online') {
                 updateServerStatus('running', 'Servidor Online');
            }
        };

        ws.onmessage = (event) => {
            logDebug(`Mensagem WS recebida: ${event.data}`);
            try {
                const msg = JSON.parse(event.data);
                addMessage(msg);
                updateMessageCount(msg.protocol);
            } catch (e) {
                logDebug(`Erro ao processar mensagem JSON: ${e}`);
            }
        };

        ws.onclose = () => {
            logDebug('WebSocket desconectado.');
            ws = null;
            if (statusText.textContent === 'Servidor Online') {
                updateServerStatus('ws_disconnected');
                setTimeout(connectWebSocket, 3000);
            } else {
                 updateServerStatus('stopped', 'Servidor Offline');
            }
        };

        ws.onerror = (error) => {
            logDebug(`Erro no WebSocket: ${JSON.stringify(error)}`);
            ws = null;
        };
    }
    
    function addMessage(msg) {
        if (noMessagesEl) {
            noMessagesEl.style.display = 'none';
        }

        const msgEl = document.createElement('div');
        const protocol = msg.protocol.toLowerCase();
        msgEl.className = `message ${protocol}`;
        
        const timestamp = new Date(msg.timestamp);
        const timeString = timestamp.toLocaleTimeString('pt-BR');
        const dateString = timestamp.toLocaleDateString('pt-BR');

        msgEl.innerHTML = `
            <div class="message-header">
                <span class="protocol-badge ${protocol}-badge">${msg.protocol}</span>
                <span>Origem: ${msg.ip}:${msg.port}</span>
                <span>${dateString} ${timeString}</span>
            </div>
            <div class="message-content">
                ${escapeHTML(msg.data)}
            </div>
        `;
                
        messageList.insertBefore(msgEl, messageList.firstChild);
                
        const activeTab = document.querySelector('.tab.active');
        if (activeTab) {
            filterMessages(activeTab.getAttribute('data-filter'), msgEl);
        }
    }

    function updateMessageCount(protocol) {
        if (protocol === 'TCP') {
            messageCount.tcp++;
        } else if (protocol === 'UDP') {
            messageCount.udp++;
        }
        messageCount.total++;
        tcpCountEl.textContent = messageCount.tcp;
        udpCountEl.textContent = messageCount.udp;
        totalCountEl.textContent = messageCount.total;
    }

    clearMessagesBtn.addEventListener('click', () => {
        logDebug('Limpando mensagens...');
        messageList.innerHTML = '';
        const noMessagesDiv = document.createElement('div');
        noMessagesDiv.className = 'no-messages';
        noMessagesDiv.id = 'noMessages';
        noMessagesDiv.textContent = 'Nenhuma mensagem recebida ainda.';
        messageList.appendChild(noMessagesDiv);
        messageCount = { tcp: 0, udp: 0, total: 0 };
        tcpCountEl.textContent = 0;
        udpCountEl.textContent = 0;
        totalCountEl.textContent = 0;
    });

    // Para as abas Todas, TCP, UDP
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const filter = tab.getAttribute('data-filter');
            filterMessages(filter);
        });
    });

    function filterMessages(filter, singleElement = null) {
        const messages = singleElement ? [singleElement] : messageList.querySelectorAll('.message');
        
        messages.forEach(msg => {
            if (filter === 'all') {
                msg.style.display = 'block';
            } else if (msg.classList.contains(filter)) {
                msg.style.display = 'block';
            } else {
                msg.style.display = 'none';
            }
        });
    }

    
    function escapeHTML(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[&<>"']/g, function(m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[m];
        });
    }
        
    function init() {
        logDebug('Inicializando monitor de mensagens...');
        currentYear.textContent = new Date().getFullYear();
        checkServerStatus();
    }

    init();
});