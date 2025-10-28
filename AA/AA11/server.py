#!/usr/bin/python3
# -*- coding: utf-8 -*-

# AA11 - Grupo 09 - Programação para Web

import asyncio
from aiohttp import web
from aiohttp.web import Response, Request
import websockets
from websockets.asyncio.server import ServerConnection
import json
import datetime
import logging
import os
from typing import Literal


HTTP_HOST = '0.0.0.0'
HTTP_PORT = 8000
WS_HOST = '0.0.0.0'
WS_PORT = 8082
TCP_HOST = '0.0.0.0'
TCP_PORT = 8080
UDP_HOST = '0.0.0.0'
UDP_PORT = 8081


ws_clients = set()
tcp_client_tasks = set()
tcp_server = None
tcp_server_task = None
udp_endpoint_transport = None
server_state: Literal["stopped", "running", "starting", "stopping"] = "stopped"


# Configuração de logging
logging.basicConfig(level=logging.INFO, format='[SERVER_LOG] %(asctime)s - %(message)s')


def log_info(message):
    logging.info(message)


# WebSocket 8082
async def ws_register(websocket: ServerConnection):
    log_info(f"[SERVER] [NOVO WEBSOCKET] [{websocket.remote_address}]")
    ws_clients.add(websocket)
    try:
        await websocket.wait_closed()
    finally:
        log_info(f"[SERVER] [DESCONEXÃO WEBSOCKET] [{websocket.remote_address}]")
        ws_clients.remove(websocket)


async def ws_broadcast(message_json):
    if ws_clients:
        await asyncio.gather(
            *[client.send(message_json) for client in ws_clients],
            return_exceptions=True
        )


async def start_ws_server():
    log_info(f"[SERVER] [SERVIDOR WEBSOCKET INICIADO EM {WS_HOST}:{WS_PORT}]")
    async with websockets.serve(ws_register, WS_HOST, WS_PORT):
        await asyncio.Future()


# TCP 8080
async def handle_tcp_client(reader, writer):
    
    # Task atual
    task = asyncio.current_task()
    tcp_client_tasks.add(task)
    
    addr = writer.get_extra_info('peername')
    log_info(f"[SERVER] [CONEXÃO TCP RECEBIDA] [{addr}]")
    try:
        while True:
            data = await reader.read(1024)
            if not data:
                log_info(f"[SERVER] [CONEXÃO TCP FECHADA PELO CLIENTE] [{addr}]")
                break
            
            message_str = data.decode().strip()
            log_info(f"[MENSAGEM] [TCP] {addr}: {message_str}")
                        
            ws_msg = json.dumps({
                "protocol": "TCP",
                "ip": addr[0],
                "port": addr[1],
                "timestamp": datetime.datetime.now().isoformat(),
                "data": message_str
            })
                        
            asyncio.create_task(ws_broadcast(ws_msg))
                        
            reply = f"[TCP] {message_str}"
            writer.write(reply.encode())
            await writer.drain()

            if message_str.lower() in ['exit', 'quit']:
                log_info(f"[EXIT] [TCP] [{addr}]")
                break
    
    # Captura o cancelamento
    except asyncio.CancelledError:
        log_info(f"[CANCELADO] [TCP] [{addr}] Conexão forçada a fechar.")
    
    except Exception as e:
        log_info(f"[ERROR] [SERVER] [TCP] [{addr}] [{e}]")
    
    finally:
        log_info(f"[FECHANDO CONEXÃO TCP COM {addr}]")
        writer.close()
        await writer.wait_closed()
        # Remove a tarefa do set
        tcp_client_tasks.remove(task)


# UDP 8081
class UDPProtocol(asyncio.DatagramProtocol):
    
    def connection_made(self, transport):
        self.transport = transport
        log_info(f"[UPD] [INICIADO EM ] {UDP_HOST}:{UDP_PORT}")

    def datagram_received(self, data, addr):
        message_str = data.decode().strip()
        log_info(f"[MENSAGEM] [UDP] {addr}: {message_str}")
        
        ws_msg = json.dumps({
            "protocol": "UDP",
            "ip": addr[0],
            "port": addr[1],
            "timestamp": datetime.datetime.now().isoformat(),
            "data": message_str
        })
        
        asyncio.create_task(ws_broadcast(ws_msg))        
        reply = f"[UDP] {message_str}"
        self.transport.sendto(reply.encode(), addr)

    def error_received(self, e):
        log_info(f"[ERROR] [SERVER] [UDP] {e}")

    def connection_lost(self, e):
        log_info(f"[CONECTION LOST] [UDP] {e}")


async def handle_status(request: Request):    
    global server_state
    log_info(f"[API] [STATUS REQUISITADO, RETORNO: {server_state}]")
    return web.json_response({"status": server_state})


async def handle_start(request: Request) -> Response:
    global server_state, tcp_server, tcp_server_task, udp_endpoint_transport
    log_info("[API] [Comando de START recebido]")

    if server_state == "stopped":
        log_info("[SERVER] [INICIANDO SERVIDORES TCP/UDP]")
        server_state = "starting"
        try:
            loop = asyncio.get_running_loop()
            
            # TCP
            tcp_server = await asyncio.start_server(handle_tcp_client, TCP_HOST, TCP_PORT) 
            tcp_server_task = asyncio.create_task(tcp_server.serve_forever())
            log_info(f"[SERVER] [SERVIDOR TCP ESTÁ OUVINDO EM {TCP_HOST}:{TCP_PORT}]")
            
            # UDP
            transport, protocol = await loop.create_datagram_endpoint(
                lambda: UDPProtocol(),
                local_addr=(UDP_HOST, UDP_PORT)
            )
            udp_endpoint_transport = transport
            log_info(f"[SERVER] [SERVIDOR UDP ESTÁ OUVINDO EM {UDP_HOST}:{UDP_PORT}]")
            server_state = "running"
            
            log_info(f"[SERVER] [SERVIDORES TCP/UDP INICIADOS COM SUCESSO]")
            return web.json_response({"status": "running", "message": "Servidores iniciados."})
        
        except Exception as e:
            log_info(f"[ERROR] [SERVER] [FALHA AO INICIAR SERVIDORES] [{e}]")
            # Limpa tcp e volta para o estado stopped
            if tcp_server:
                tcp_server.close()
                await tcp_server.wait_closed()
            tcp_server = None
            tcp_server_task = None
            server_state = "stopped"
            return web.json_response(
                { "status": "error",  "message": str(e) }, 
                status=500
            )
    
    log_info(f"[SERVER] [SERVIDOR JÁ ESTÁ EM EXECUÇÃO, IGNORANDO REQUISIÇÃO]")
    return web.json_response({"status": server_state, "message": "Servidor já está em execução"})


async def handle_stop(request: Request) -> Response:
    global server_state, tcp_server, tcp_server_task, udp_endpoint_transport
    log_info("[API] [Comando de STOP recebido]")
    if server_state == "running":
        log_info("[SERVER] [EXECUTANDO COMANDO DE STOP]")
        server_state = "stopping"
        try:

            # UDP
            if udp_endpoint_transport:
                udp_endpoint_transport.close()
                udp_endpoint_transport = None
                log_info("[SERVER] [SERVIDOR UDP PARADO]")
                
            # Cancela todas as conexões TCP registradas no tcp_client_tasks
            if tcp_client_tasks:
                log_info(f"[SERVER] [FECHANDO {len(tcp_client_tasks)} CONEXÕES TCP ATIVAS]")
                tasks_to_cancel = list(tcp_client_tasks)
                for task in tasks_to_cancel:
                    task.cancel()
                # Espera todas cancelarem
                await asyncio.gather(*tasks_to_cancel, return_exceptions=True)
                log_info("[SERVER] [CONEXÕES TCP ATIVAS FECHADAS]")

            # Para de aceitar novas conexões
            if tcp_server_task:
                tcp_server_task.cancel()
            
            # Fecha o socket principal
            if tcp_server:
                tcp_server.close()
                await tcp_server.wait_closed() 
                tcp_server = None
                tcp_server_task = None
                log_info("[SERVER] [SERVIDOR TCP PARADO]")
                
            server_state = "stopped"
            log_info("[SERVER] [ESTADO: stopped]")
            return web.json_response({"status": "stopped", "message": "Servidores parados."})
        
        except Exception as e:
            log_info(f"[ERROR] [SERVER] [ERROR AO PARAR SERVIDORES] {e}")
            server_state = "running"
            return web.json_response({"status": "error", "message": str(e)}, status=500)
    
    log_info(f"[SERVER] [SERVIDOR JÁ ESTÁ PARADO, IGNORANDO REQUISIÇÃO DE STOP] [ESTADO ATUAL: {server_state}]")
    return web.json_response({
        "status": "stopped", 
        "message": "Servidor não está rodando."
    })


async def init_http_server():    
    http_app = web.Application()
    
    static_dir = os.path.dirname(os.path.abspath(__file__))

    # Mostra o index.html automaticamente
    async def handle_index(request: Request):
        index_path = os.path.join(static_dir, 'index.html')
        return web.FileResponse(index_path)

    # Rotas da API
    http_app.router.add_get('/status', handle_status)
    http_app.router.add_post('/start', handle_start)
    http_app.router.add_post('/stop', handle_stop)    
    http_app.router.add_get('/', handle_index)    
    http_app.router.add_static('/', path=static_dir, show_index=False, follow_symlinks=True)
    
    log_info(f"[SERVER] [Servidor HTTP (API e arquivos) iniciando em {HTTP_HOST}:{HTTP_PORT}]")
    log_info(f"[SERVER] [RODANDO EM http://localhost:{HTTP_PORT}]")
    
    runner = web.AppRunner(http_app)
    await runner.setup()
    site = web.TCPSite(runner, HTTP_HOST, HTTP_PORT)
    await site.start()


async def main():
    http_task = asyncio.create_task(init_http_server())
    ws_task = asyncio.create_task(start_ws_server())    
    await asyncio.gather(http_task, ws_task)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        log_info("\n[SERVIDOR ENCERRADO PELO USUÁRIO]")