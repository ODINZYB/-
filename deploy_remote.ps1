$ip = "38.165.40.27"
$user = "Administrator"
$pass = "ww2W3FGy9Rd6"

$secpasswd = ConvertTo-SecureString $pass -AsPlainText -Force
$mycreds = New-Object System.Management.Automation.PSCredential ($user, $secpasswd)

Write-Host "Connecting to $ip..."
Invoke-Command -ComputerName $ip -Credential $mycreds -ScriptBlock {
    Write-Host "Connected successfully! Starting installation process..."

    # Create a temp directory for downloads
    $tempDir = "C:\temp_install"
    if (!(Test-Path $tempDir)) {
        New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
    }

    # 1. Download and Install Node.js
    Write-Host "Downloading Node.js..."
    $nodeUrl = "https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi"
    $nodeInstaller = "$tempDir\node.msi"
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller
    Write-Host "Installing Node.js..."
    Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$nodeInstaller`" /qn /norestart" -Wait -NoNewWindow
    Write-Host "Node.js installed."

    # 2. Download and Install Git
    Write-Host "Downloading Git..."
    $gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.44.0.windows.1/Git-2.44.0-64-bit.exe"
    $gitInstaller = "$tempDir\git.exe"
    Invoke-WebRequest -Uri $gitUrl -OutFile $gitInstaller
    Write-Host "Installing Git..."
    Start-Process -FilePath $gitInstaller -ArgumentList "/VERYSILENT /NORESTART /NOCANCEL /SP- /CLOSEAPPLICATIONS /RESTARTAPPLICATIONS" -Wait -NoNewWindow
    Write-Host "Git installed."

    # Update Path environment variable for current session to use node and git immediately
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

    # 3. Clone the repository
    Write-Host "Cloning repository..."
    $repoDir = "C:\marx"
    if (Test-Path $repoDir) {
        Write-Host "Directory exists, pulling latest..."
        Set-Location $repoDir
        & "C:\Program Files\Git\bin\git.exe" pull
    } else {
        Set-Location "C:\"
        & "C:\Program Files\Git\bin\git.exe" clone https://github.com/ODINZYB/-.git marx
        Set-Location $repoDir
    }

    # 4. Setup Backend
    Write-Host "Setting up Backend..."
    Set-Location "C:\marx\backend"
    npm install
    
    # Install PM2 globally to run background processes
    npm install -g pm2
    
    # Start backend with PM2
    pm2 start index.js --name "marx-backend"

    # 5. Setup Frontend
    Write-Host "Setting up Frontend..."
    Set-Location "C:\marx\frontend"
    npm install
    npm run build
    
    # Start frontend with PM2
    pm2 start npm --name "marx-frontend" -- start

    # Save PM2 process list
    pm2 save

    # Open firewall ports
    Write-Host "Opening firewall ports 3000 and 3001..."
    New-NetFirewallRule -DisplayName "Marx Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName "Marx Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue

    Write-Host "Deployment completed successfully!"
}
