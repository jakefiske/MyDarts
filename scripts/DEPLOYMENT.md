# MyDarts Raspberry Pi Deployment Guide

Complete guide for deploying MyDarts to a Raspberry Pi from a clean project package.

## Prerequisites

### Hardware
- Raspberry Pi 4 (4GB+ RAM recommended)
- MicroSD card (32GB+ recommended)
- Autodarts camera setup (optional)
- Bluetooth speaker (optional)

### Software (on Pi)
- Raspberry Pi OS Lite (64-bit) or Desktop
- Internet connection
- SSH access enabled

### Your Development Machine
- The MyDarts-Package.zip file

---

## Step 1: Prepare Raspberry Pi

### 1.1 Flash Raspberry Pi OS
1. Download Raspberry Pi Imager: https://www.raspberrypi.com/software/
2. Flash Raspberry Pi OS (64-bit) to SD card
3. In imager settings:
   - Set hostname: mydarts.local
   - Enable SSH (password authentication)
   - Set username: pi
   - Set password: (your choice)
   - Configure WiFi (optional)

### 1.2 Boot and Connect
From your dev machine, SSH to Pi:
  ssh pi@mydarts.local
Or use IP address if hostname doesn't work:
  ssh pi@192.168.x.x

---

## Step 2: Transfer Project to Pi

### 2.1 Upload Package
From your development machine (Windows PowerShell):
  scp MyDarts-Package.zip pi@mydarts.local:~/
Or with IP:
  scp MyDarts-Package.zip pi@192.168.x.x:~/

Or use WinSCP/FileZilla to transfer the zip file to /home/pi/

### 2.2 Extract on Pi
From Pi SSH session:
  cd ~
  unzip MyDarts-Package.zip
  cd MyDarts
  ls -la

---

## Step 3: Run Setup Script

The setup script will install ALL dependencies and configure services automatically.

  cd ~/MyDarts/scripts
  chmod +x setup-pi.sh
  sudo ./setup-pi.sh

This script installs:
- .NET 8 SDK
- Node.js 20 LTS
- SQLite
- Autodarts
- darts-caller
- All system dependencies
- Configures systemd services
- Builds and deploys the application

Setup takes 15-30 minutes on first run.

---

## Step 4: Configure Services via Web UI

### 4.1 Access MyDarts
Open browser and go to:
  http://mydarts.local:3000
Or:
  http://192.168.x.x:3000

### 4.2 Health Check
1. Click Settings (gear icon)
2. Go to Health Check
3. Verify core services are running (Database, MyDarts API should be green)

### 4.3 Configure Autodarts
1. Go to Settings → Autodarts → Autodarts Play
2. Follow on-screen instructions to get Board ID and API Key from https://play.autodarts.io
3. Click Test Connection to verify
4. Click Save Configuration
5. Go to Settings → System → Services
6. Click Start on Autodarts Service
7. Click Start on Darts-caller Service
8. Return to Health Check - Autodarts should now be green

### 4.4 Configure Spotify (Optional)
1. Go to Settings → Spotify
2. Follow on-screen instructions to create Spotify app at https://developer.spotify.com/dashboard
3. Add redirect URI: http://127.0.0.1:5025/api/spotify/callback (or your Pi IP)
4. Copy Client ID and Secret
5. Click Save Credentials
6. Click Login with Spotify
7. Authorize the app
8. Return to Health Check - Spotify should now be green

---

## Step 5: Enable Kiosk Mode (Optional)

For a dedicated darts scoring device:

  cd ~/MyDarts/scripts
  chmod +x setup-kiosk.sh
  sudo ./setup-kiosk.sh

This configures:
- Auto-login
- Chromium in kiosk mode (fullscreen)
- Auto-start MyDarts on boot
- Disable screen blanking

Reboot to activate kiosk mode:
  sudo reboot

---

## Step 6: Test Everything

### 6.1 System Health
Settings → Health Check - All items should be green

### 6.2 Game Play
1. Click Play on home screen
2. Add players
3. Start a game
4. Throw darts (if Autodarts connected, scores auto-detected)

### 6.3 Spotify (if configured)
Settings → Spotify - Control playback, change volume

---

## Troubleshooting

### Services Not Running

Check service status:
  sudo systemctl status mydarts
  sudo systemctl status autodarts
  sudo systemctl status darts-caller

View logs:
  journalctl -u mydarts -n 50 --no-pager
  journalctl -u autodarts -n 50 --no-pager
  journalctl -u darts-caller -n 50 --no-pager

Restart services via UI:
Settings → System → Services - Use Start/Stop/Restart buttons

### Can't Access Web UI

Check if services are running:
  sudo systemctl status mydarts

Check which ports are listening:
  sudo netstat -tlnp | grep -E '3000|5025'

### Autodarts Not Connecting

1. Verify credentials in Settings → Autodarts
2. Test connection with Test Connection button
3. Check autodarts service logs:
     journalctl -u autodarts -n 100 --no-pager
4. Verify cameras are detected:
     ls -la /dev/video*

### Spotify Not Working

1. Verify redirect URI in Spotify app settings matches exactly (use 127.0.0.1 not localhost)
2. Re-authenticate via Settings → Spotify → Login with Spotify
3. Check logs:
     journalctl -u mydarts -n 100 --no-pager

---

## Updating MyDarts

### Via Web UI (Recommended)
1. Settings → System → Software
2. Click Update from GitHub
3. Wait for update to complete
4. App restarts automatically

### Manual Update
  cd ~/MyDarts
  git pull origin main
  cd scripts
  sudo ./setup-pi.sh
  sudo systemctl restart mydarts

---

## Useful Commands

### Service Management
  sudo systemctl start mydarts
  sudo systemctl stop mydarts
  sudo systemctl restart mydarts
  journalctl -u mydarts -f

### System Info
  vcgencmd measure_temp
  df -h
  free -h
  htop

### Network
  hostname -I
  ping -c 4 google.com

---

## Performance Tips

1. Use Raspberry Pi 4 (4GB+) - Pi 3 will be slower
2. Use quality SD card - Class 10 or better
3. Keep system updated:
     sudo apt update && sudo apt upgrade -y
4. Monitor temperature - Add heatsink/fan if needed
5. Use wired Ethernet - More stable than WiFi

---

## Architecture Overview

MyDarts System:
- Frontend (React) - Port 3000
  - Built static files served by backend
- Backend (.NET 8 API) - Port 5025
  - SQLite database
- Autodarts Service
  - Camera integration
- darts-caller Service - Port 8079
  - Throw detection bridge
- Spotify Integration
  - Playback control

---

## File Locations

~/MyDarts/                          # Main application
~/.config/autodarts/config.toml     # Autodarts config
~/.config/mydarts/spotify.json      # Spotify config
~/.local/share/mydarts/mydarts.db   # SQLite database
/etc/systemd/system/mydarts.service # Systemd service

---

## Next Steps

- Configure game defaults in Settings → Game Defaults
- Add players in Settings → Players
- Customize theme in Settings → Theme
- Set up Bluetooth speakers in Settings → Bluetooth
- Enable auto-start games with Autodarts

Enjoy playing darts!