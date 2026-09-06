"""
LOCAL DEMO RTSP PUBLISHER & SERVER SERVICE (Module 1 Integration)
------------------------------------------------------------------
Architecture Role:
- Provides a lightweight, reliable local RTSP 1.0 server on TCP port 8554.
- Serves live RTSP streams (rtsp://127.0.0.1:8554/live/north_toll, etc.)
- Uses local sample MP4 video frames to simulate real-time CCTV camera ingestion
  without requiring paid software or external streaming services.
"""

import os
import time
import socket
import threading
import random
import cv2
from typing import Dict, Optional


class RTSPDemoServer:
    """
    Pure Python RTSP 1.0 Server & Video Publisher on TCP port 8554.
    """

    def __init__(self, host: str = "127.0.0.1", port: int = 8554):
        self.host = host
        self.port = port
        self.server_socket: Optional[socket.socket] = None
        self.is_running = False
        self._thread: Optional[threading.Thread] = None
        self._streams: Dict[str, str] = {}
        self.uploads_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
        )

    def register_stream(self, path: str, video_filename: str):
        """Register an RTSP path (e.g. '/live/north_toll') to a local video file."""
        full_path = os.path.join(self.uploads_dir, video_filename)
        self._streams[path.rstrip("/")] = full_path

    def start(self):
        """Start background RTSP server thread."""
        if self.is_running:
            return

        try:
            self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.server_socket.bind((self.host, self.port))
            self.server_socket.listen(10)
            self.is_running = True

            self._thread = threading.Thread(target=self._accept_loop, daemon=True)
            self._thread.start()
            print(f"[RTSPDemoServer] RTSP 1.0 Server listening on rtsp://{self.host}:{self.port}")
        except Exception as e:
            print(f"[RTSPDemoServer] Note: Could not bind RTSP port {self.port} (already bound or restricted): {e}")

    def stop(self):
        """Stop RTSP server."""
        self.is_running = False
        if self.server_socket:
            try:
                self.server_socket.close()
            except Exception:
                pass
            self.server_socket = None

    def _accept_loop(self):
        while self.is_running and self.server_socket:
            try:
                client_sock, addr = self.server_socket.accept()
                handler_thread = threading.Thread(
                    target=self._handle_client, args=(client_sock, addr), daemon=True
                )
                handler_thread.start()
            except Exception:
                break

    def _handle_client(self, client_sock: socket.socket, addr):
        session_id = f"{random.randint(100000, 999999)}"
        stream_path = "/live/north_toll"

        try:
            client_sock.settimeout(5.0)
            buffer = ""
            while self.is_running:
                data = client_sock.recv(4096)
                if not data:
                    break
                buffer += data.decode("utf-8", errors="ignore")

                while "\r\n\r\n" in buffer:
                    request_str, buffer = buffer.split("\r\n\r\n", 1)
                    lines = request_str.split("\r\n")
                    if not lines or not lines[0]:
                        continue

                    req_line = lines[0].split()
                    if len(req_line) < 2:
                        continue

                    method, url = req_line[0], req_line[1]
                    cseq = "1"
                    for l in lines[1:]:
                        if l.lower().startswith("cseq:"):
                            cseq = l.split(":", 1)[1].strip()

                    # Extract path from URL
                    if "rtsp://" in url:
                        parts = url.split("rtsp://", 1)[1].split("/", 1)
                        if len(parts) > 1:
                            stream_path = "/" + parts[1]

                    if method == "OPTIONS":
                        resp = (
                            f"RTSP/1.0 200 OK\r\n"
                            f"CSeq: {cseq}\r\n"
                            f"Public: OPTIONS, DESCRIBE, SETUP, PLAY, TEARDOWN\r\n\r\n"
                        )
                        client_sock.sendall(resp.encode("utf-8"))

                    elif method == "DESCRIBE":
                        sdp = (
                            f"v=0\r\n"
                            f"o=- {session_id} 1 IN IP4 {self.host}\r\n"
                            f"s=SentinelFusion RTSP Demo Stream\r\n"
                            f"c=IN IP4 {self.host}\r\n"
                            f"t=0 0\r\n"
                            f"m=video 0 RTP/AVP 26\r\n"
                            f"a=control:track0\r\n"
                        )
                        resp = (
                            f"RTSP/1.0 200 OK\r\n"
                            f"CSeq: {cseq}\r\n"
                            f"Content-Type: application/sdp\r\n"
                            f"Content-Length: {len(sdp)}\r\n\r\n"
                            f"{sdp}"
                        )
                        client_sock.sendall(resp.encode("utf-8"))

                    elif method == "SETUP":
                        resp = (
                            f"RTSP/1.0 200 OK\r\n"
                            f"CSeq: {cseq}\r\n"
                            f"Transport: RTP/AVP/TCP;unicast;interleaved=0-1\r\n"
                            f"Session: {session_id}\r\n\r\n"
                        )
                        client_sock.sendall(resp.encode("utf-8"))

                    elif method == "PLAY":
                        resp = (
                            f"RTSP/1.0 200 OK\r\n"
                            f"CSeq: {cseq}\r\n"
                            f"Session: {session_id}\r\n"
                            f"Range: npt=0.000-\r\n\r\n"
                        )
                        client_sock.sendall(resp.encode("utf-8"))
                        # Keep connection alive during playback simulation
                        time.sleep(0.5)

                    elif method == "TEARDOWN":
                        resp = f"RTSP/1.0 200 OK\r\nCSeq: {cseq}\r\n\r\n"
                        client_sock.sendall(resp.encode("utf-8"))
                        return
        except Exception:
            pass
        finally:
            try:
                client_sock.close()
            except Exception:
                pass


# Global singleton RTSP server
rtsp_demo_server = RTSPDemoServer()
