const express = require("express");
const path = require("path");
const crypto = require("crypto");
const { SerialPort } = require("serialport");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = Number(process.env.PORT || 3000);
const CAMERA_STREAM_URL = process.env.CAMERA_STREAM_URL || "";
const SERIAL_PORT = process.env.SERIAL_PORT || "/dev/ttyACM0";
const SERIAL_BAUD_RATE = Number(process.env.SERIAL_BAUD_RATE || 9600);
const SESSION_SECONDS = Number(process.env.SESSION_SECONDS || 45);

const COMMANDS = {
  left: "MOVE_LEFT",
  right: "MOVE_RIGHT",
  forward: "MOVE_FORWARD",
  back: "MOVE_BACK",
  drop: "DROP"
};

let serial;
let serialReady = false;
try {
  serial = new SerialPort({ path: SERIAL_PORT, baudRate: SERIAL_BAUD_RATE });
  serial.on("open", () => {
    serialReady = true;
    console.log(`Serial connected: ${SERIAL_PORT} @ ${SERIAL_BAUD_RATE}`);
  });
  serial.on("close", () => {
    serialReady = false;
  });
  serial.on("error", (error) => {
    serialReady = false;
    console.error("Serial error:", error.message);
  });
} catch (error) {
  console.error("Failed to initialize serial:", error.message);
}

let activeSession = null;

const now = () => Date.now();
const clearExpiredSession = () => {
  if (activeSession && now() >= activeSession.expiresAt) {
    activeSession = null;
  }
};

const statusPayload = () => {
  clearExpiredSession();
  return {
    serialReady,
    cameraStreamUrl: CAMERA_STREAM_URL,
    sessionSeconds: SESSION_SECONDS,
    active: activeSession
      ? {
          playerName: activeSession.playerName,
          expiresAt: activeSession.expiresAt,
          remainingSeconds: Math.max(0, Math.ceil((activeSession.expiresAt - now()) / 1000))
        }
      : null
  };
};

const requireActiveSession = (req, res, next) => {
  clearExpiredSession();
  const token = req.get("x-session-token");
  if (!activeSession || !token || token !== activeSession.token) {
    return res.status(403).json({ error: "No active player session" });
  }
  next();
};

app.get("/api/status", (req, res) => {
  res.json(statusPayload());
});

app.post("/api/session/start", (req, res) => {
  clearExpiredSession();
  if (activeSession) {
    return res.status(409).json({
      error: "Machine already in use",
      active: statusPayload().active
    });
  }

  const playerName = String(req.body?.playerName || "Player").trim().slice(0, 40) || "Player";
  activeSession = {
    playerName,
    token: crypto.randomUUID(),
    expiresAt: now() + SESSION_SECONDS * 1000
  };

  res.json({
    token: activeSession.token,
    active: statusPayload().active
  });
});

app.post("/api/session/end", requireActiveSession, (req, res) => {
  activeSession = null;
  res.json({ ok: true });
});

app.post("/api/command", requireActiveSession, (req, res) => {
  const command = COMMANDS[req.body?.command];
  if (!command) {
    return res.status(400).json({ error: "Unknown command" });
  }
  if (!serial || !serialReady) {
    return res.status(503).json({ error: "Serial connection not ready" });
  }

  serial.write(`${command}\n`, (error) => {
    if (error) {
      return res.status(500).json({ error: "Failed to send command" });
    }
    return res.json({ ok: true, command });
  });
});

app.listen(PORT, () => {
  console.log(`New Bridge Entertainment server running on http://localhost:${PORT}`);
});
