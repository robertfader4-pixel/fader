(function () {
  const STORAGE_KEY = "fader_global_player_state_v2";

  const defaults = {
    queue: [],
    currentIndex: -1,
    currentTime: 0,
    isPlaying: false,
    volume: 1
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
    } catch (e) {
      return { ...defaults };
    }
  }

  let state = loadState();

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function $(id) {
    return document.getElementById(id);
  }

  function fmt(seconds) {
    if (!isFinite(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m + ":" + String(s).padStart(2, "0");
  }

  function currentTrack() {
    return state.queue[state.currentIndex] || null;
  }

  function injectShell() {
    if ($("globalPlayerBar")) return;
    const shell = document.createElement("div");
    shell.id = "globalPlayerBar";
    shell.className = "global-player-bar";
    shell.innerHTML = `
      <div class="global-player-inner">
        <div class="global-player-track">
          <div class="global-player-label">🎧 Banda sonora</div>
          <div id="globalPlayerNowTitle" class="global-player-title">Nada en reproducción</div>
        </div>

        <div class="global-player-controls">
          <button type="button" id="gpPrev" class="gp-btn" aria-label="Anterior">⏮</button>
          <button type="button" id="gpPlayPause" class="gp-btn gp-main" aria-label="Reproducir o pausar">▶️</button>
          <button type="button" id="gpNext" class="gp-btn" aria-label="Siguiente">⏭</button>
        </div>

        <div class="global-player-progress">
          <span id="gpCurrentTime" class="gp-time">0:00</span>
          <input type="range" id="gpSeek" min="0" max="100" value="0" step="0.1">
          <span id="gpDuration" class="gp-time">0:00</span>
        </div>

        <div class="global-player-volume">
          <span>🔊</span>
          <input type="range" id="gpVolume" min="0" max="1" value="1" step="0.01">
        </div>

        <button type="button" id="gpToggleQueue" class="gp-btn gp-queue-btn" aria-label="Mostrar cola">☰</button>
      </div>

      <div id="globalPlayerQueue" class="global-player-queue hidden">
        <div class="queue-header">Lista de reproducción</div>
        <ul id="globalPlayerQueueList" class="queue-list"></ul>
      </div>

      <audio id="globalPlayerAudio" preload="metadata"></audio>
    `;
    document.body.appendChild(shell);
  }

  function renderQueue() {
    const list = $("globalPlayerQueueList");
    if (!list) return;
    list.innerHTML = "";

    if (!state.queue.length) {
      const li = document.createElement("li");
      li.className = "queue-empty";
      li.textContent = "Todavía no hay pistas en la lista.";
      list.appendChild(li);
      return;
    }

    state.queue.forEach((track, index) => {
      const li = document.createElement("li");
      li.className = "queue-item" + (index === state.currentIndex ? " active" : "");
      li.innerHTML = `
        <button type="button" class="queue-track-btn">
          <span class="queue-track-title">${track.title}</span>
          <span class="queue-track-source">${track.source || ""}</span>
        </button>
        <button type="button" class="queue-remove-btn" aria-label="Quitar">✕</button>
      `;
      li.querySelector(".queue-track-btn").addEventListener("click", () => {
        state.currentIndex = index;
        state.currentTime = 0;
        playCurrent(true);
      });
      li.querySelector(".queue-remove-btn").addEventListener("click", () => {
        removeTrack(index);
      });
      list.appendChild(li);
    });
  }

  function updateNow() {
    const track = currentTrack();
    $("globalPlayerNowTitle").textContent = track ? track.title : "Nada en reproducción";
    $("gpPlayPause").textContent = state.isPlaying ? "⏸" : "▶️";
    renderQueue();
  }

  function ensureSourceLoaded() {
    const audio = $("globalPlayerAudio");
    const track = currentTrack();
    if (!audio || !track) return;
    if (audio.dataset.src !== track.src) {
      audio.src = track.src;
      audio.dataset.src = track.src;
    }
    audio.volume = state.volume;
  }

  function playCurrent(autoplay) {
    const audio = $("globalPlayerAudio");
    const track = currentTrack();
    if (!audio || !track) return;
    ensureSourceLoaded();

    const syncTime = () => {
      try {
        if (state.currentTime > 0 && Math.abs(audio.currentTime - state.currentTime) > 0.3) {
          audio.currentTime = state.currentTime;
        }
      } catch (e) {}
      audio.removeEventListener("loadedmetadata", syncTime);
    };

    audio.addEventListener("loadedmetadata", syncTime);
    updateNow();
    saveState();

    if (autoplay) {
      audio.play().then(() => {
        state.isPlaying = true;
        saveState();
        updateNow();
      }).catch(() => {
        state.isPlaying = false;
        saveState();
        updateNow();
      });
    }
  }

  function nextTrack(autoplay) {
    if (!state.queue.length) return;
    state.currentIndex = state.currentIndex < state.queue.length - 1 ? state.currentIndex + 1 : 0;
    state.currentTime = 0;
    playCurrent(autoplay);
  }

  function prevTrack() {
    const audio = $("globalPlayerAudio");
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      state.currentTime = 0;
      saveState();
      return;
    }
    if (!state.queue.length) return;
    state.currentIndex = state.currentIndex > 0 ? state.currentIndex - 1 : state.queue.length - 1;
    state.currentTime = 0;
    playCurrent(true);
  }

  function removeTrack(index) {
    if (index < 0 || index >= state.queue.length) return;
    const removingCurrent = index === state.currentIndex;

    state.queue.splice(index, 1);

    if (!state.queue.length) {
      state.currentIndex = -1;
      state.currentTime = 0;
      state.isPlaying = false;
      const audio = $("globalPlayerAudio");
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    } else {
      if (index < state.currentIndex) state.currentIndex -= 1;
      if (removingCurrent) {
        if (state.currentIndex >= state.queue.length) state.currentIndex = state.queue.length - 1;
        state.currentTime = 0;
        playCurrent(state.isPlaying);
      }
    }

    saveState();
    updateNow();
  }

  function addTrack(track, playNow) {
    const existing = state.queue.findIndex(t => t.src === track.src);
    const idx = existing >= 0 ? existing : state.queue.push(track) - 1;
    if (state.currentIndex === -1) state.currentIndex = idx;

    if (playNow) {
      state.currentIndex = idx;
      state.currentTime = 0;
      playCurrent(true);
    } else {
      saveState();
      updateNow();
    }
  }

  function bindUI() {
    const audio = $("globalPlayerAudio");

    $("gpPlayPause").addEventListener("click", () => {
      if (!currentTrack()) return;
      if (audio.paused) {
        audio.play().then(() => {
          state.isPlaying = true;
          saveState();
          updateNow();
        }).catch(() => {});
      } else {
        audio.pause();
      }
    });

    $("gpPrev").addEventListener("click", prevTrack);
    $("gpNext").addEventListener("click", () => nextTrack(true));

    $("gpSeek").addEventListener("input", (e) => {
      if (!audio.duration) return;
      const pct = Number(e.target.value) / 100;
      audio.currentTime = audio.duration * pct;
      state.currentTime = audio.currentTime;
      saveState();
    });

    $("gpVolume").addEventListener("input", (e) => {
      audio.volume = Number(e.target.value);
      state.volume = audio.volume;
      saveState();
    });

    $("gpToggleQueue").addEventListener("click", () => {
      $("globalPlayerQueue").classList.toggle("hidden");
    });

    audio.addEventListener("timeupdate", () => {
      $("gpCurrentTime").textContent = fmt(audio.currentTime);
      $("gpDuration").textContent = fmt(audio.duration || 0);
      $("gpSeek").value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      state.currentTime = audio.currentTime || 0;
      saveState();
    });

    audio.addEventListener("loadedmetadata", () => {
      $("gpDuration").textContent = fmt(audio.duration || 0);
      $("gpVolume").value = state.volume;
    });

    audio.addEventListener("play", () => {
      state.isPlaying = true;
      saveState();
      updateNow();
    });

    audio.addEventListener("pause", () => {
      state.isPlaying = false;
      saveState();
      updateNow();
    });

    audio.addEventListener("ended", () => nextTrack(true));
  }

  function bindTrackButtons() {
    document.querySelectorAll("[data-audio-src]").forEach(btn => {
      if (btn.dataset.gpBound === "1") return;
      btn.dataset.gpBound = "1";
      btn.addEventListener("click", () => {
        addTrack({
          src: btn.dataset.audioSrc,
          title: btn.dataset.audioTitle || "Pista sin título",
          source: btn.dataset.audioSource || ""
        }, true);
      });
    });
  }

  function restore() {
    if (state.currentIndex >= state.queue.length) {
      state.currentIndex = state.queue.length - 1;
    }
    updateNow();
    const audio = $("globalPlayerAudio");
    if (currentTrack()) {
      ensureSourceLoaded();
      $("gpVolume").value = state.volume;
      audio.currentTime = state.currentTime || 0;
      if (state.isPlaying) {
        audio.play().catch(() => {
          state.isPlaying = false;
          saveState();
          updateNow();
        });
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    injectShell();
    bindUI();
    bindTrackButtons();
    restore();
  });

  window.FaderPlayer = { addTrack };
})();