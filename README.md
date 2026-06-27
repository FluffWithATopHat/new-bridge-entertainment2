# New Bridge Entertainment

Minimal Raspberry Pi + Arduino online claw machine web app.

## Features
- Live camera feed panel (`CAMERA_STREAM_URL`)
- Controls for **left/right/forward/back/drop**
- Single active player lock to prevent multiple people from controlling at once
- Node.js backend that relays movement commands over USB serial to an Arduino

## Quick start
1. Install:
   ```bash
   npm install
   ```
2. Run:
   ```bash
   npm start
   ```
3. Open:
   `http://localhost:3000`

## Environment variables
- `PORT` (default: `3000`)
- `SERIAL_PORT` (default: `/dev/ttyACM0`)
- `SERIAL_BAUD_RATE` (default: `9600`)
- `CAMERA_STREAM_URL` (default: empty)
- `SESSION_SECONDS` (default: `45`)

## Arduino command protocol
The backend sends one-line serial commands:
- `MOVE_LEFT`
- `MOVE_RIGHT`
- `MOVE_FORWARD`
- `MOVE_BACK`
- `DROP`