# New Bridge Entertainment

Minimal Raspberry Pi + Arduino online claw machine web app.

## Features
- Live camera feed panel (`CAMERA_STREAM_URL`)
- Controls for **left/right/forward/back/drop**
- Single active player lock to prevent multiple people from controlling at once
- Node.js backend that relays movement commands over USB serial to an Arduino

## Setup and startup guide

### 1. Prerequisites
Before starting the app, make sure you have:

- **Node.js 18 or newer**
- **npm** (bundled with Node.js)
- An **Arduino connected over USB** if you want live machine control
- An optional **camera stream URL** if you want the live video panel enabled

You can verify Node.js on the target machine with:

```bash
node -v
npm -v
```

### 2. Install dependencies
From the project root, install the required packages:

```bash
npm install
```

This installs:

- `express` for the web server and API
- `serialport` for USB serial communication with the Arduino

### 3. Connect hardware
If you are running against a real claw machine setup:

1. Connect the Arduino to the host machine over USB.
2. Confirm which serial device it appears as.
   - Common Linux/Raspberry Pi examples:
     - `/dev/ttyACM0`
     - `/dev/ttyUSB0`
3. Make sure the Arduino firmware is ready to receive newline-delimited commands from the backend.

If the app starts without the correct device connected, the site will still load, but movement commands will fail until the serial connection is available.

### 4. Configure environment variables
The server reads its configuration from environment variables at startup.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port for the Express server |
| `SERIAL_PORT` | `/dev/ttyACM0` | USB serial device path used for the Arduino |
| `SERIAL_BAUD_RATE` | `9600` | Baud rate for the serial connection |
| `CAMERA_STREAM_URL` | empty | URL shown in the camera panel on the web page |
| `SESSION_SECONDS` | `45` | Length of each player turn |

Example startup with custom values:

```bash
PORT=3000 \
SERIAL_PORT=/dev/ttyUSB0 \
SERIAL_BAUD_RATE=9600 \
CAMERA_STREAM_URL=http://192.168.1.50:8080/stream \
SESSION_SECONDS=60 \
npm start
```

### 5. Start the server
Run:

```bash
npm start
```

On a successful startup, the server prints:

```text
New Bridge Entertainment server running on http://localhost:3000
```

If the configured serial device is missing or unavailable, you may also see a serial error in the console. That usually means the server is up, but the Arduino connection needs to be fixed before machine commands will work.

### 6. Open the app
In a browser, visit:

```text
http://localhost:3000
```

The interface includes:

- A camera panel that loads when `CAMERA_STREAM_URL` is set
- A player name field
- A **Start Turn** button
- Directional controls and a **DROP** button
- Session status text showing whether the machine is available or in use

### 7. First-use flow
Typical operator or player flow:

1. Start the server.
2. Open the browser UI.
3. Enter a player name.
4. Select **Start Turn**.
5. Use the directional and **DROP** controls during the active session.
6. End the turn manually or wait for the session to expire.

Only one player session can be active at a time. While one player is active, other users can view status but cannot take control.

## Troubleshooting

### Server starts, but controls say serial is offline
- Confirm the Arduino is plugged in.
- Check that `SERIAL_PORT` matches the real device path.
- Verify the serial baud rate matches the Arduino firmware.
- Restart the server after changing environment variables or reconnecting hardware.

### Camera panel stays empty
- Confirm `CAMERA_STREAM_URL` is set before starting the server.
- Make sure the URL is reachable from the browser.
- Image URLs such as `.jpg`, `.jpeg`, `.png`, or `.mjpeg` are embedded as images; other URLs are loaded in an iframe.

### Another player is already using the machine
- Wait for the current session to expire, or
- Use the **End** button from the active session

### Commands fail after a session starts
- Confirm the server console is not reporting serial connection errors.
- Check that the Arduino is still connected.
- Reload the page to refresh status if the session token has expired.

## Arduino command protocol
The backend sends one-line serial commands:
- `MOVE_LEFT`
- `MOVE_RIGHT`
- `MOVE_FORWARD`
- `MOVE_BACK`
- `DROP`