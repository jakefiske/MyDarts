#!/bin/bash
# MyDarts Kiosk Mode - runs on Pi boot

# Wait for API to be ready
echo "Waiting for MyDarts API..."
until curl -s http://localhost:5025/api/game/types > /dev/null 2>&1; do
    sleep 2
done
echo "API ready!"

# Disable screen blanking
xset s off
xset -dpms
xset s noblank

# Hide cursor after 0.5 seconds of inactivity
unclutter -idle 0.5 -root &

# Start Chromium in kiosk mode
chromium-browser \
    --kiosk \
    --noerrdialogs \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --disable-restore-session-state \
    --no-first-run \
    --start-fullscreen \
    --autoplay-policy=no-user-gesture-required \
    http://localhost:5025