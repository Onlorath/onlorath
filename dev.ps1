# Starts the whole local stack with one command: PostgreSQL -> Go API (:8080) -> Next.js (:3000).
# Usage:  .\dev.ps1            (Ctrl+C stops API + web; Postgres keeps running)
#         .\dev.ps1 -StopDb    (also stops Postgres on exit, if this script started it)
#
# Postgres lookup order: already listening on :5432 -> native install (pg_ctl) -> docker compose.
# Override native paths with $env:PG_BIN / $env:PG_DATA.
param([switch]$StopDb)

$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
$PgBin = if ($env:PG_BIN) { $env:PG_BIN } else { 'C:\Program Files\PostgreSQL\16\bin' }
$PgData = if ($env:PG_DATA) { $env:PG_DATA } else { Join-Path $env:LOCALAPPDATA 'onlorath-pgdata' }

function Write-Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }

function Resolve-Exe($name, $fallback) {
    $cmd = Get-Command $name -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    if (Test-Path $fallback) { return $fallback }
    throw "$name not found (looked in PATH and $fallback)"
}

function Test-Port($port) {
    $client = New-Object Net.Sockets.TcpClient
    try { $client.Connect('127.0.0.1', $port); return $true } catch { return $false } finally { $client.Close() }
}

function Get-EnvValue($file, $key) {
    if (-not (Test-Path $file)) { return $null }
    $line = Get-Content $file | Where-Object { $_ -match "^\s*$key\s*=" } | Select-Object -First 1
    if ($line) { return ($line -split '=', 2)[1].Trim() }
    return $null
}

$EnvFile = "$Root\backend\.env"

function Get-SuperPassword {
    $pw = Get-EnvValue $EnvFile 'PG_SUPERUSER_PASSWORD'
    if (-not $pw) {
        $pw = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 24 | ForEach-Object { [char]$_ })
        Add-Content -Path $EnvFile -Encoding ascii -Value "`n# Local PostgreSQL superuser (native install, dev only)`nPG_SUPERUSER_PASSWORD=$pw"
    }
    return $pw
}

# pg_ctl must NOT be piped (| Out-Null): the postmaster inherits the pipe and the script hangs forever.
function Start-NativePg {
    & "$PgBin\pg_ctl.exe" -D $PgData -l "$PgData\server.log" -o '-p 5432' -w start
    if ($LASTEXITCODE -ne 0) { throw "pg_ctl start failed, see $PgData\server.log" }
}

# One-time cluster setup. --locale=C is required: initdb rejects Windows locale
# names with non-ASCII characters (e.g. the Turkish "Turkish_T?rkiye.1254").
function Initialize-NativeCluster {
    Write-Step "Initializing PostgreSQL cluster at $PgData (first run)"
    $pwFile = [IO.Path]::GetTempFileName()
    try {
        [IO.File]::WriteAllText($pwFile, (Get-SuperPassword))
        & "$PgBin\initdb.exe" --pgdata="$PgData" --username=postgres --encoding=UTF8 --locale=C --pwfile="$pwFile" --auth=scram-sha-256 | Out-Null
        if ($LASTEXITCODE -ne 0) { throw 'initdb failed' }
    } finally { Remove-Item $pwFile -Force -ErrorAction SilentlyContinue }
}

# Creates the app role/database and loads init.sql if the database doesn't exist yet.
function Initialize-AppDatabase {
    $dbUser = Get-EnvValue $EnvFile 'DB_USER'
    $dbPw = Get-EnvValue $EnvFile 'DB_PASSWORD'
    $dbName = Get-EnvValue $EnvFile 'DB_NAME'
    $psql = "$PgBin\psql.exe"
    try {
        $env:PGPASSWORD = Get-SuperPassword
        $exists = & $psql -h localhost -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$dbName'"
        if ($LASTEXITCODE -ne 0) { throw 'Cannot connect as postgres superuser (check PG_SUPERUSER_PASSWORD in backend/.env)' }
        if ($exists -eq '1') { return }

        Write-Step "Creating database $dbName and loading init.sql"
        $roleExists = & $psql -h localhost -U postgres -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname = '$dbUser'"
        if ($roleExists -ne '1') {
            & $psql -h localhost -U postgres -d postgres -q -v ON_ERROR_STOP=1 -c "CREATE ROLE $dbUser LOGIN PASSWORD '$dbPw';"
            if ($LASTEXITCODE -ne 0) { throw 'CREATE ROLE failed' }
        }
        & $psql -h localhost -U postgres -d postgres -q -v ON_ERROR_STOP=1 -c "CREATE DATABASE $dbName OWNER $dbUser ENCODING 'UTF8';"
        if ($LASTEXITCODE -ne 0) { throw 'CREATE DATABASE failed' }

        $env:PGPASSWORD = $dbPw
        $env:PGOPTIONS = '-c client_min_messages=warning'  # hide init.sql's "trigger does not exist" NOTICEs
        & $psql -h localhost -U $dbUser -d $dbName -q -v ON_ERROR_STOP=1 -f "$Root\onlorath\infra\init.sql"
        if ($LASTEXITCODE -ne 0) { throw 'Loading init.sql failed' }
    } finally {
        Remove-Item Env:PGPASSWORD, Env:PGOPTIONS -ErrorAction SilentlyContinue
    }
}

foreach ($port in 8080, 3000) {
    if (Test-Port $port) { throw "Port $port is already in use. Stop whatever is running there first." }
}
if (-not (Test-Path $EnvFile)) {
    Write-Step 'Creating backend/.env from .env.example'
    Copy-Item "$Root\backend\.env.example" $EnvFile
}

# --- PostgreSQL ---
$startedDb = $null
if (Test-Port 5432) {
    Write-Step 'PostgreSQL already running on :5432'
} elseif (Test-Path "$PgBin\pg_ctl.exe") {
    if (-not (Test-Path "$PgData\PG_VERSION")) { Initialize-NativeCluster }
    Write-Step "Starting native PostgreSQL ($PgData)"
    Start-NativePg
    $startedDb = 'native'
} elseif (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Step 'Starting PostgreSQL via docker compose'
    docker compose -f "$Root\onlorath\infra\docker-compose.yml" up -d
    if ($LASTEXITCODE -ne 0) { throw 'docker compose up failed' }
    $startedDb = 'docker'
} else {
    throw "No PostgreSQL found: nothing on :5432, no pg_ctl in $PgBin, and no docker."
}

$deadline = (Get-Date).AddSeconds(30)
while (-not (Test-Port 5432)) {
    if ((Get-Date) -gt $deadline) { throw 'PostgreSQL did not come up on :5432 within 30s' }
    Start-Sleep -Milliseconds 500
}
# Docker's postgres image runs init.sql itself; for a native install we do it here.
if ($startedDb -ne 'docker' -and (Test-Path "$PgBin\psql.exe") -and (Test-Path "$PgData\PG_VERSION")) {
    Initialize-AppDatabase
}

# --- Dependencies ---
$web = Join-Path $Root 'frontend\web'
$node = Resolve-Exe 'node' 'C:\Program Files\nodejs\node.exe'
$go = Resolve-Exe 'go' 'C:\Program Files\Go\bin\go.exe'

if (-not (Test-Path "$web\node_modules")) {
    Write-Step 'Installing frontend dependencies'
    Push-Location $web
    try { & npm.cmd ci --no-audit --no-fund --legacy-peer-deps } finally { Pop-Location }
    if ($LASTEXITCODE -ne 0) { throw 'npm ci failed' }
}

# --- API + web ---
$procs = @()
try {
    Write-Step 'Starting Go API on http://localhost:8080'
    $procs += Start-Process -FilePath $go -ArgumentList 'run', './cmd/api' -WorkingDirectory "$Root\backend" -NoNewWindow -PassThru

    # next is launched through node directly so Ctrl+C doesn't hit npm.cmd's "Terminate batch job?" prompt
    Write-Step 'Starting Next.js on http://localhost:3000'
    $procs += Start-Process -FilePath $node -ArgumentList 'node_modules/next/dist/bin/next', 'dev' -WorkingDirectory $web -NoNewWindow -PassThru

    Write-Step 'All up. Press Ctrl+C to stop.'
    while ($true) {
        $dead = $procs | Where-Object { $_.HasExited }
        if ($dead) { Write-Host "A process exited (PID $($dead[0].Id)), shutting down." -ForegroundColor Yellow; break }
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Step 'Stopping API + web'
    foreach ($p in $procs) {
        # taskkill /T also ends children (go run's compiled binary, next's worker)
        if (-not $p.HasExited) { cmd.exe /c "taskkill /T /F /PID $($p.Id) >nul 2>&1" }
    }
    if ($StopDb -and $startedDb -eq 'native') {
        Write-Step 'Stopping PostgreSQL'
        & "$PgBin\pg_ctl.exe" -D $PgData stop | Out-Null
    } elseif ($StopDb -and $startedDb -eq 'docker') {
        Write-Step 'Stopping PostgreSQL container'
        docker compose -f "$Root\onlorath\infra\docker-compose.yml" down
    }
}
