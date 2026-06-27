let sessionToken = null;
const IMAGE_URL_PATTERN = /\.(jpg|jpeg|png|mjpeg)(\?|$)/i;

const statusText = document.getElementById("statusText");
const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const playerNameInput = document.getElementById("playerName");
const cameraWrap = document.getElementById("cameraWrap");

const commandButtons = [...document.querySelectorAll("[data-command]")];

const setControlsEnabled = (enabled) => {
  commandButtons.forEach((button) => {
    button.disabled = !enabled;
  });
  endBtn.disabled = !enabled;
  startBtn.disabled = enabled;
  playerNameInput.disabled = enabled;
};

const headers = () => ({
  "Content-Type": "application/json",
  ...(sessionToken ? { "x-session-token": sessionToken } : {})
});

const updateStatus = async () => {
  const response = await fetch("/api/status");
  const status = await response.json();
  const active = status.active;

  if (status.cameraStreamUrl && !cameraWrap.dataset.loaded) {
    cameraWrap.dataset.loaded = "true";
    cameraWrap.innerHTML = "";
    if (IMAGE_URL_PATTERN.test(status.cameraStreamUrl)) {
      const img = document.createElement("img");
      img.src = status.cameraStreamUrl;
      img.alt = "Live claw machine feed";
      cameraWrap.appendChild(img);
    } else {
      const frame = document.createElement("iframe");
      frame.src = status.cameraStreamUrl;
      frame.allow = "autoplay; fullscreen";
      frame.title = "Live claw machine feed";
      cameraWrap.appendChild(frame);
    }
  }

  if (sessionToken && !active) {
    sessionToken = null;
  }

  if (sessionToken && active) {
    statusText.textContent = `Your turn (${active.remainingSeconds}s left). Serial: ${
      status.serialReady ? "connected" : "offline"
    }`;
    setControlsEnabled(true);
    return;
  }

  if (active) {
    statusText.textContent = `${active.playerName} is playing (${active.remainingSeconds}s left).`;
    setControlsEnabled(false);
  } else {
    statusText.textContent = `Machine available. Session length: ${status.sessionSeconds}s.`;
    setControlsEnabled(false);
    startBtn.disabled = false;
    playerNameInput.disabled = false;
  }
};

startBtn.addEventListener("click", async () => {
  const playerName = playerNameInput.value.trim();
  const response = await fetch("/api/session/start", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ playerName })
  });
  const payload = await response.json();
  if (!response.ok) {
    alert(payload.error || "Unable to start session");
    await updateStatus();
    return;
  }
  sessionToken = payload.token;
  await updateStatus();
});

endBtn.addEventListener("click", async () => {
  if (!sessionToken) {
    return;
  }
  await fetch("/api/session/end", {
    method: "POST",
    headers: headers()
  });
  sessionToken = null;
  await updateStatus();
});

commandButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    if (!sessionToken) {
      return;
    }
    const response = await fetch("/api/command", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ command: button.dataset.command })
    });
    if (!response.ok) {
      const payload = await response
        .json()
        .catch(() => ({ error: "Command failed: Unable to parse server response" }));
      alert(payload.error || "Command failed");
      if (response.status === 403) {
        sessionToken = null;
      }
      await updateStatus();
    }
  });
});

setControlsEnabled(false);
updateStatus();
setInterval(updateStatus, 1000);
