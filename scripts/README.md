# 🎯 MyDarts - Autodarts Integration

A modern darts scoring application with automatic throw detection via Autodarts cameras.

## ✨ Features

- **Automatic Throw Detection**: Integrates with Autodarts camera system
- **Auto-Confirm Turns**: Automatically advances when darts are pulled out
- **Real-time Scoring**: Instant score updates via SignalR
- **Zero Configuration**: Works on any network without hardcoded IPs
- **Easy Deployment**: One script setup for Raspberry Pi

## 🚀 Quick Start (Raspberry Pi)

### Prerequisites

1. Raspberry Pi with Raspbian/Ubuntu
2. Autodarts camera system and account
3. Board ID from [play.autodarts.io](https://play.autodarts.io)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/MyDarts.git
   cd MyDarts
   ```

2. **Run the setup script**
   ```bash
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

3. **Configure your Autodarts credentials**
   - Edit `.env` file with your Autodarts email, password, and board ID
   - Re-run `./scripts/setup.sh` to apply changes

4. **Access MyDarts**
   - Open browser on any device on your network
   - Go to `http://[YOUR_PI_IP]:3000`
   - The script will show you the exact URL at the end

That's it! No IP configuration needed. The app automatically detects your network setup.

## 🔄 Updating After Git Pull

After pulling new changes from git:

```bash
./scripts/update.sh
```

This will:
- Rebuild the backend
- Rebuild the frontend
- Restart all services

**No more manual fixes needed!** The build process is now bulletproof.

## 🎮 How to Use

1. **Start a game on Autodarts**
   - Go to [play.autodarts.io](https://play.autodarts.io)
   - Start an X01 game (501, 301, etc.)

2. **Open MyDarts**
   - Access via `http://[YOUR_PI_IP]:3000`
   - Click the camera toggle to connect to Autodarts

3. **Start playing**
   - Throw darts - they auto-score
   - Pull darts - turn auto-confirms

## 🛠️ Architecture

```
Autodarts Camera → Autodarts Cloud
                        ↓
darts-caller (Python, Port 8079)
                        ↓
MyDarts Backend (.NET, Port 5025)
                        ↓
MyDarts Frontend (React, Port 3000)
```

**Key Design Principle**: Everything uses `localhost` or relative URLs. No hardcoded IPs!

- Frontend detects its hostname automatically
- Backend connects to darts-caller via `localhost:8079` (same machine)
- No configuration needed when moving between networks or devices

## 📁 Project Structure

```
MyDarts/
├── MyDarts.Api/           # .NET backend
│   ├── appsettings.json   # Config (localhost only)
│   └── Services/
│       └── DartsCallerService.cs
├── my-darts-ui/           # React frontend
│   ├── src/
│   │   ├── config.ts      # Auto-detecting config
│   │   └── components/
│   └── package.json
├── scripts/
│   ├── setup.sh           # One-time setup
│   └── update.sh          # Post-git-pull updates
├── .env.template          # Environment variables
└── README.md
```

## 🔧 Manual Service Control

```bash
# Check status
sudo systemctl status mydarts-api
sudo systemctl status darts-caller

# View logs
sudo journalctl -u mydarts-api -f
sudo journalctl -u darts-caller -f

# Restart services
sudo systemctl restart mydarts-api
sudo systemctl restart mydarts-ui
sudo systemctl restart darts-caller

# Stop services
sudo systemctl stop mydarts-api
```

## 🐛 Troubleshooting

### Throws not detected

1. Make sure a game is running on [play.autodarts.io](https://play.autodarts.io)
2. Check darts-caller is connected: `sudo systemctl status darts-caller`
3. Check camera toggle is ON in MyDarts UI

### Can't access from other devices

1. Check Pi's IP: `hostname -I`
2. Make sure devices are on same network
3. Try accessing `http://[PI_IP]:3000`

### Build failures after git pull

Just run `./scripts/update.sh` - it handles everything!

## 🎁 Giving to Friends

Share the entire `MyDarts` folder. They just need to:

1. Copy to their Pi
2. Run `./scripts/setup.sh`
3. Edit `.env` with their Autodarts credentials
4. Done!

No IP configuration, no network setup - it just works.

## 📝 Environment Variables

All optional, can be configured via UI instead:

- `AUTODARTS_EMAIL` - Your Autodarts account email
- `AUTODARTS_PASSWORD` - Your Autodarts password
- `AUTODARTS_BOARD_ID` - Your board ID from Autodarts
- `SPOTIFY_CLIENT_ID` - Spotify integration (optional)
- `SPOTIFY_CLIENT_SECRET` - Spotify integration (optional)

## 🤝 Contributing

Pull requests welcome! The deployment process is now rock solid:

1. Make changes on your desktop
2. Test locally
3. Commit and push
4. On Pi: `git pull && ./scripts/update.sh`
5. **It just works!**

## 📜 License

MIT License - see LICENSE file

## 🙏 Credits

- [Autodarts](https://autodarts.io) - Camera system
- [darts-caller](https://github.com/lbormann/darts-caller) - Event bridge

---

Built with ❤️ for the darts community