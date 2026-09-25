// Router de pantallas + perfil (dinámico) + menú + selector de nivel.
(function () {
  const screens = {
    profile: document.getElementById("screen-profile"),
    addProfile: document.getElementById("screen-add-profile"),
    menu: document.getElementById("screen-menu"),
    level: document.getElementById("screen-level"),
    memorama: document.getElementById("screen-memorama"),
    sumas: document.getElementById("screen-sumas"),
    colores: document.getElementById("screen-colores"),
    carrera: document.getElementById("screen-carrera"),
    frutas: document.getElementById("screen-frutas"),
    laberinto: document.getElementById("screen-laberinto"),
    ingles: document.getElementById("screen-ingles"),
    rompecabezas: document.getElementById("screen-rompecabezas"),
    abecedario: document.getElementById("screen-abecedario"),
    buencorazon: document.getElementById("screen-buencorazon"),
    sonidos: document.getElementById("screen-sonidos"),
    culturavial: document.getElementById("screen-culturavial")
  };

  const GAME_TITLES = {
    memorama: "🃏 Memorama",
    sumas: "➕ Sumas y Restas",
    colores: "🎨 Colores",
    carrera: "🚗 Esquiva Autos",
    frutas: "🍎 Atrapa Frutas",
    laberinto: "🌀 Laberinto",
    ingles: "🌎 Inglés",
    rompecabezas: "🧩 Rompecabezas",
    abecedario: "🔤 Abecedario",
    buencorazon: "💛 Buen Corazón",
    sonidos: "🔊 Sonidos",
    culturavial: "🚦 Cultura Vial"
  };

  const AVATAR_OPTIONS = ["🐣", "🦁", "🐰", "🐼", "🦄", "🐯", "🐸", "🐵", "🐶", "🐱"];

  const memoramaEls = {
    board: document.getElementById("memorama-board"),
    win: document.getElementById("memorama-win")
  };

  const sumasEls = {
    progress: document.getElementById("sumas-progress"),
    problem: document.getElementById("sumas-problem"),
    choices: document.getElementById("sumas-choices"),
    win: document.getElementById("sumas-win"),
    winStars: document.getElementById("sumas-win-stars")
  };

  const coloresEls = {
    dropzones: document.getElementById("colores-dropzones"),
    tray: document.getElementById("colores-tray"),
    win: document.getElementById("colores-win"),
    winStars: document.getElementById("colores-win-stars")
  };

  const carreraEls = {
    canvas: document.getElementById("carrera-canvas"),
    progress: document.getElementById("carrera-progress"),
    win: document.getElementById("carrera-win"),
    winStars: document.getElementById("carrera-win-stars"),
    btnLeft: document.getElementById("btn-carrera-left"),
    btnRight: document.getElementById("btn-carrera-right")
  };

  const frutasEls = {
    canvas: document.getElementById("frutas-canvas"),
    progress: document.getElementById("frutas-progress"),
    win: document.getElementById("frutas-win"),
    winStars: document.getElementById("frutas-win-stars"),
    btnLeft: document.getElementById("btn-frutas-left"),
    btnRight: document.getElementById("btn-frutas-right")
  };

  const laberintoEls = {
    grid: document.getElementById("laberinto-grid"),
    win: document.getElementById("laberinto-win"),
    winStars: document.getElementById("laberinto-win-stars"),
    btnUp: document.getElementById("btn-laberinto-up"),
    btnDown: document.getElementById("btn-laberinto-down"),
    btnLeft: document.getElementById("btn-laberinto-left"),
    btnRight: document.getElementById("btn-laberinto-right"),
    btnHint: document.getElementById("btn-laberinto-hint"),
    playerEmoji: "🙂"
  };

  const inglesEls = {
    progress: document.getElementById("ingles-progress"),
    prompt: document.getElementById("ingles-prompt"),
    choices: document.getElementById("ingles-choices"),
    win: document.getElementById("ingles-win"),
    winStars: document.getElementById("ingles-win-stars")
  };

  const rompecabezasEls = {
    grid: document.getElementById("rompecabezas-grid"),
    win: document.getElementById("rompecabezas-win"),
    winStars: document.getElementById("rompecabezas-win-stars")
  };

  const abecedarioEls = {
    progress: document.getElementById("abecedario-progress"),
    prompt: document.getElementById("abecedario-prompt"),
    choices: document.getElementById("abecedario-choices"),
    win: document.getElementById("abecedario-win"),
    winStars: document.getElementById("abecedario-win-stars")
  };

  const buencorazonEls = {
    progress: document.getElementById("buencorazon-progress"),
    prompt: document.getElementById("buencorazon-prompt"),
    choices: document.getElementById("buencorazon-choices"),
    win: document.getElementById("buencorazon-win"),
    winStars: document.getElementById("buencorazon-win-stars")
  };

  const sonidosEls = {
    progress: document.getElementById("sonidos-progress"),
    prompt: document.getElementById("sonidos-prompt"),
    choices: document.getElementById("sonidos-choices"),
    win: document.getElementById("sonidos-win"),
    winStars: document.getElementById("sonidos-win-stars")
  };

  const culturavialEls = {
    progress: document.getElementById("culturavial-progress"),
    prompt: document.getElementById("culturavial-prompt"),
    choices: document.getElementById("culturavial-choices"),
    win: document.getElementById("culturavial-win"),
    winStars: document.getElementById("culturavial-win-stars")
  };

  let pendingGame = null;
  let currentGame = null;
  let currentLevel = null;

  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    screens[name].classList.add("active");
  }

  function refreshMenu() {
    const data = Storage.getProfileData();
    document.getElementById("menu-profile-emoji").textContent = data ? data.emoji : "🙂";
    document.getElementById("menu-stars").textContent = `⭐ ${data ? data.stars : 0}`;
  }

  function stopAnyRunningGame() {
    CarreraGame.stop();
    FrutasGame.stop();
    LaberintoGame.stop();
  }

  function backToMenu() {
    GameAudio.playClick();
    stopAnyRunningGame();
    refreshMenu();
    showScreen("menu");
  }

  // ---- Selector de perfil (dinámico) ----
  function renderProfileGrid() {
    const grid = document.getElementById("profile-grid");
    grid.innerHTML = "";
    Storage.listProfiles().forEach((profile) => {
      const btn = document.createElement("button");
      btn.className = "profile-card";
      btn.innerHTML = `<span class="profile-emoji">${profile.emoji}</span><span class="profile-label">${profile.name}</span>`;
      btn.addEventListener("click", () => {
        GameAudio.playClick();
        Storage.setActiveProfile(profile.id);
        refreshMenu();
        showScreen("menu");
      });
      grid.appendChild(btn);
    });

    const addBtn = document.createElement("button");
    addBtn.className = "profile-card profile-card-add";
    addBtn.innerHTML = `<span class="profile-emoji">➕</span><span class="profile-label">Agregar</span>`;
    addBtn.addEventListener("click", () => {
      GameAudio.playClick();
      openAddProfile();
    });
    grid.appendChild(addBtn);
  }

  // ---- Crear jugador nuevo ----
  let selectedAvatar = null;
  let selectedAge = null;

  function openAddProfile() {
    selectedAvatar = null;
    selectedAge = null;
    document.getElementById("addprofile-name").value = "";

    const avatarGrid = document.getElementById("addprofile-avatars");
    avatarGrid.innerHTML = "";
    AVATAR_OPTIONS.forEach((emoji) => {
      const btn = document.createElement("button");
      btn.className = "avatar-btn";
      btn.textContent = emoji;
      btn.addEventListener("click", () => {
        GameAudio.playClick();
        avatarGrid.querySelectorAll(".avatar-btn").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        selectedAvatar = emoji;
      });
      avatarGrid.appendChild(btn);
    });

    document.querySelectorAll(".archetype-card").forEach((c) => c.classList.remove("selected"));
    showScreen("addProfile");
  }

  document.getElementById("btn-addprofile-back").addEventListener("click", () => {
    GameAudio.playClick();
    showScreen("profile");
  });

  document.querySelectorAll(".archetype-card").forEach((card) => {
    card.addEventListener("click", () => {
      GameAudio.playClick();
      document.querySelectorAll(".archetype-card").forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      selectedAge = card.dataset.age;
    });
  });

  document.getElementById("btn-addprofile-create").addEventListener("click", () => {
    const name = document.getElementById("addprofile-name").value.trim();
    if (!name || !selectedAvatar || !selectedAge) {
      Speech.speak("Falta el nombre, el avatar, o el tamaño");
      return;
    }
    GameAudio.playCelebration();
    const id = Storage.createProfile(name, selectedAvatar, selectedAge);
    Storage.setActiveProfile(id);
    refreshMenu();
    showScreen("menu");
  });

  // ---- Menú principal ----
  document.getElementById("btn-change-profile").addEventListener("click", () => {
    GameAudio.playClick();
    Storage.clearProfile();
    renderProfileGrid();
    showScreen("profile");
  });

  document.getElementById("btn-speak-menu").addEventListener("click", () => {
    Speech.speak("Elige un juego");
  });

  document.querySelectorAll(".game-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      GameAudio.playClick();
      openLevelSelect(btn.dataset.game);
    });
  });

  // ---- Selector de nivel ----
  function openLevelSelect(game) {
    pendingGame = game;
    document.getElementById("level-game-title").textContent = GAME_TITLES[game] || "Elige el nivel";
    showScreen("level");
  }

  document.getElementById("btn-level-back").addEventListener("click", () => {
    GameAudio.playClick();
    showScreen("menu");
  });

  document.getElementById("btn-level-speak").addEventListener("click", () => {
    Speech.speak("¿Fácil, medio o difícil?");
  });

  document.querySelectorAll(".level-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      GameAudio.playClick();
      const level = btn.dataset.level;
      Storage.setLevel(pendingGame, level);
      startGame(pendingGame, level);
    });
  });

  function startGame(game, level) {
    currentGame = game;
    currentLevel = level;
    const profile = Storage.getProfileData();
    const ageGroup = profile ? profile.ageGroup : "5";
    laberintoEls.playerEmoji = profile ? profile.emoji : "🙂";
    showScreen(game);
    if (game === "memorama") MemoramaGame.start(ageGroup, level, memoramaEls);
    else if (game === "sumas") SumasGame.start(ageGroup, level, sumasEls);
    else if (game === "colores") ColoresGame.start(ageGroup, level, coloresEls);
    else if (game === "carrera") CarreraGame.start(ageGroup, level, carreraEls);
    else if (game === "frutas") FrutasGame.start(ageGroup, level, frutasEls);
    else if (game === "laberinto") LaberintoGame.start(ageGroup, level, laberintoEls);
    else if (game === "ingles") InglesGame.start(ageGroup, level, inglesEls);
    else if (game === "rompecabezas") RompecabezasGame.start(ageGroup, level, rompecabezasEls);
    else if (game === "abecedario") AbecedarioGame.start(ageGroup, level, abecedarioEls);
    else if (game === "buencorazon") BuenCorazonGame.start(ageGroup, level, buencorazonEls);
    else if (game === "sonidos") SonidosGame.start(ageGroup, level, sonidosEls);
    else if (game === "culturavial") CulturaVialGame.start(ageGroup, level, culturavialEls);
  }

  function replayCurrent() {
    GameAudio.playClick();
    startGame(currentGame, currentLevel);
  }

  // ---- Pantalla memorama ----
  document.getElementById("btn-memorama-back").addEventListener("click", backToMenu);
  document.getElementById("btn-memorama-restart").addEventListener("click", replayCurrent);
  document.getElementById("btn-memorama-again").addEventListener("click", replayCurrent);
  document.getElementById("btn-memorama-menu").addEventListener("click", backToMenu);

  // ---- Pantalla sumas y restas ----
  document.getElementById("btn-sumas-back").addEventListener("click", backToMenu);
  document.getElementById("btn-sumas-speak").addEventListener("click", () => {
    SumasGame.speakCurrent();
  });
  document.getElementById("btn-sumas-again").addEventListener("click", replayCurrent);
  document.getElementById("btn-sumas-menu").addEventListener("click", backToMenu);

  // ---- Pantalla colores ----
  document.getElementById("btn-colores-back").addEventListener("click", backToMenu);
  document.getElementById("btn-colores-speak").addEventListener("click", () => {
    ColoresGame.speakCurrent();
  });
  document.getElementById("btn-colores-again").addEventListener("click", replayCurrent);
  document.getElementById("btn-colores-menu").addEventListener("click", backToMenu);

  // ---- Pantalla esquiva autos ----
  document.getElementById("btn-carrera-back").addEventListener("click", backToMenu);
  document.getElementById("btn-carrera-speak").addEventListener("click", () => {
    CarreraGame.speakCurrent();
  });
  document.getElementById("btn-carrera-again").addEventListener("click", replayCurrent);
  document.getElementById("btn-carrera-menu").addEventListener("click", backToMenu);

  // ---- Pantalla atrapa frutas ----
  document.getElementById("btn-frutas-back").addEventListener("click", backToMenu);
  document.getElementById("btn-frutas-speak").addEventListener("click", () => {
    FrutasGame.speakCurrent();
  });
  document.getElementById("btn-frutas-again").addEventListener("click", replayCurrent);
  document.getElementById("btn-frutas-menu").addEventListener("click", backToMenu);

  // ---- Pantalla laberinto ----
  document.getElementById("btn-laberinto-back").addEventListener("click", backToMenu);
  document.getElementById("btn-laberinto-again").addEventListener("click", replayCurrent);
  document.getElementById("btn-laberinto-menu").addEventListener("click", backToMenu);

  // ---- Pantalla inglés ----
  document.getElementById("btn-ingles-back").addEventListener("click", backToMenu);
  document.getElementById("btn-ingles-speak").addEventListener("click", () => {
    InglesGame.speakCurrent();
  });
  document.getElementById("btn-ingles-again").addEventListener("click", replayCurrent);
  document.getElementById("btn-ingles-menu").addEventListener("click", backToMenu);

  // ---- Pantalla rompecabezas ----
  document.getElementById("btn-rompecabezas-back").addEventListener("click", backToMenu);
  document.getElementById("btn-rompecabezas-restart").addEventListener("click", replayCurrent);
  document.getElementById("btn-rompecabezas-again").addEventListener("click", replayCurrent);
  document.getElementById("btn-rompecabezas-menu").addEventListener("click", backToMenu);

  // ---- Pantalla abecedario ----
  document.getElementById("btn-abecedario-back").addEventListener("click", backToMenu);
  document.getElementById("btn-abecedario-speak").addEventListener("click", () => {
    AbecedarioGame.speakCurrent();
  });
  document.getElementById("btn-abecedario-again").addEventListener("click", replayCurrent);
  document.getElementById("btn-abecedario-menu").addEventListener("click", backToMenu);

  // ---- Pantalla buen corazón ----
  document.getElementById("btn-buencorazon-back").addEventListener("click", backToMenu);
  document.getElementById("btn-buencorazon-speak").addEventListener("click", () => {
    BuenCorazonGame.speakCurrent();
  });
  document.getElementById("btn-buencorazon-again").addEventListener("click", replayCurrent);
  document.getElementById("btn-buencorazon-menu").addEventListener("click", backToMenu);

  // ---- Pantalla sonidos ----
  document.getElementById("btn-sonidos-back").addEventListener("click", backToMenu);
  document.getElementById("btn-sonidos-speak").addEventListener("click", () => {
    SonidosGame.speakCurrent();
  });
  document.getElementById("btn-sonidos-again").addEventListener("click", replayCurrent);
  document.getElementById("btn-sonidos-menu").addEventListener("click", backToMenu);

  // ---- Pantalla cultura vial ----
  document.getElementById("btn-culturavial-back").addEventListener("click", backToMenu);
  document.getElementById("btn-culturavial-speak").addEventListener("click", () => {
    CulturaVialGame.speakCurrent();
  });
  document.getElementById("btn-culturavial-again").addEventListener("click", replayCurrent);
  document.getElementById("btn-culturavial-menu").addEventListener("click", backToMenu);

  // ---- Arranque ----
  renderProfileGrid();
  const savedProfile = Storage.getActiveProfile();
  if (savedProfile && Storage.getProfileData(savedProfile)) {
    refreshMenu();
    showScreen("menu");
  } else {
    showScreen("profile");
  }
})();
