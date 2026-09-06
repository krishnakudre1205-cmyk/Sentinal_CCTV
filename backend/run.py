import uvicorn
import os
import sys
import socket

# Ensure current directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.config import settings


def is_port_in_use(host: str, port: int) -> bool:
    """Check if the target port is already in use by another process."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        try:
            s.bind((host, port))
            return False
        except socket.error:
            return True


if __name__ == "__main__":
    host = settings.HOST
    port = settings.PORT

    # Check for CLI port override (e.g. python run.py 8001)
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])

    if is_port_in_use(host, port):
        print(f"\n[!] WARNING: Port {port} is already in use by another running instance of SentinelFusion AI or another process.")
        print(f"[*] Solution Options:")
        print(f"    1. Stop the existing process using port {port}")
        print(f"    2. Run with an alternate port: python run.py {port + 1}\n")
        sys.exit(1)

    print(f"[*] Starting {settings.PROJECT_NAME} Backend on http://{host}:{port}")
    print(f"[*] Swagger Documentation: http://{host}:{port}/docs")
    print(f"[*] Health Check Endpoint: http://{host}:{port}/health")

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=settings.DEBUG
    )
