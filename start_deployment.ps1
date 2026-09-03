Write-Host "========================================="
Write-Host "SENTINELFUSION DEPLOYMENT SCRIPT"
Write-Host "========================================="

Write-Host "Step 1: Launching Docker Desktop..."
$exe = "C:\Users\Krishna\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe"
Start-Process -FilePath $exe

Write-Host "Step 2: Waiting for Docker Engine readiness..."
$ready = $false
for ($i = 1; $i -le 15; $i++) {
    Start-Sleep -Seconds 5
    $ver = docker version 2>&1 | Out-String
    if ($ver -like "*Server:*") {
        Write-Host "Docker Engine Server is READY! (Check #$i)"
        $ready = $true
        break
    } else {
        Write-Host "Waiting for Docker Engine... (Check #$i)"
    }
}

if (-not $ready) {
    Write-Host "Docker Engine failed to respond within timeframe."
    exit 1
}

Write-Host "Step 3: Building and launching containers with Docker Compose..."
docker compose up -d --build

Write-Host "Step 4: Checking container status..."
Start-Sleep -Seconds 5
docker compose ps

Write-Host "Step 5: Inspecting container logs..."
Write-Host "--- POSTGRES LOGS ---"
docker compose logs postgres --tail=15
Write-Host "--- MQTT LOGS ---"
docker compose logs mqtt --tail=15
Write-Host "--- BACKEND LOGS ---"
docker compose logs backend --tail=30
Write-Host "--- FRONTEND LOGS ---"
docker compose logs frontend --tail=20

Write-Host "Deployment script step completed."
