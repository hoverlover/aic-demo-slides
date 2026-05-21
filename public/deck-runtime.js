(function () {
  "use strict";

  var script = document.currentScript;
  var config = {
    accent: readData("accent", "#38bdf8"),
    badgeBg: readData("badgeBg", "#111827"),
    badgeBorder: readData("badgeBorder", "#374151"),
    badgeColor: readData("badgeColor", readData("accent", "#38bdf8")),
    badgeFont: readData("badgeFont", "ui-monospace, SFMono-Regular, Menlo, monospace"),
    pollMs: parseInteger(readData("pollMs", "500"), 500),
    remote: readData("remote", "true") !== "false",
  };

  var current = 0;
  var roomCode = null;
  var lastRemoteSlide = 1;
  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var currentCounter = document.getElementById("counter-current");
  var totalCounter = document.getElementById("counter-total");

  if (slides.length === 0) {
    return;
  }

  initializeActiveSlide();
  updateCounters();
  bindNavigation();

  if (config.remote) {
    initializeRemote();
  }

  window.RemoteDeck = {
    next: function () {
      return goTo(current + 1);
    },
    prev: function () {
      return goTo(current - 1);
    },
    goTo: goTo,
    getState: function () {
      return {
        current: current + 1,
        total: slides.length,
        room: roomCode,
      };
    },
  };

  function readData(key, fallback) {
    if (!script || !script.dataset || script.dataset[key] === undefined) {
      return fallback;
    }

    return script.dataset[key];
  }

  function parseInteger(value, fallback) {
    var parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function initializeActiveSlide() {
    var activeIndex = slides.findIndex(function (slide) {
      return slide.classList.contains("active");
    });

    current = activeIndex >= 0 ? activeIndex : 0;

    slides.forEach(function (slide, index) {
      slide.classList.toggle("active", index === current);
      slide.setAttribute("aria-hidden", index === current ? "false" : "true");
    });
  }

  function updateCounters() {
    setText(currentCounter, String(current + 1));
    setText(totalCounter, String(slides.length));
  }

  function setText(element, value) {
    if (element) {
      element.textContent = value;
    }
  }

  function bindNavigation() {
    document.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight" || event.key === "ArrowDown" || event.key === " ") {
        event.preventDefault();
        goTo(current + 1);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        goTo(current - 1);
      }
    });

    document.addEventListener("click", function (event) {
      if (isInteractiveElement(event.target)) {
        return;
      }

      if (event.clientX > window.innerWidth / 2) {
        goTo(current + 1);
      } else {
        goTo(current - 1);
      }
    });
  }

  function isInteractiveElement(target) {
    if (!(target instanceof Element)) {
      return false;
    }

    return Boolean(target.closest("a, button, input, textarea, select, [data-no-slide-nav]"));
  }

  function goTo(index, options) {
    if (index < 0 || index >= slides.length || index === current) {
      return false;
    }

    slides[current].classList.remove("active");
    slides[current].setAttribute("aria-hidden", "true");
    current = index;
    slides[current].classList.add("active");
    slides[current].setAttribute("aria-hidden", "false");
    updateCounters();

    lastRemoteSlide = current + 1;

    if (!options || options.sync !== false) {
      syncRemoteState();
    }

    window.dispatchEvent(
      new CustomEvent("deck:slidechange", {
        detail: {
          current: current + 1,
          total: slides.length,
          room: roomCode,
        },
      }),
    );

    return true;
  }

  function initializeRemote() {
    if (new URLSearchParams(window.location.search).has("remote")) {
      window.location.href = "/remote";
      return;
    }

    var roomBadge = document.createElement("div");
    roomBadge.id = "room-badge";
    roomBadge.style.cssText = [
      "position:fixed",
      "top:2vh",
      "left:3vw",
      "z-index:200",
      "background:" + config.badgeBg,
      "border:1px solid " + config.badgeBorder,
      "border-radius:8px",
      "padding:0.6vh 1.2vw",
      "font-family:" + config.badgeFont,
      "font-size:0.85rem",
      "color:" + config.badgeColor,
      "opacity:0.9",
      "pointer-events:none",
    ].join(";");
    roomBadge.textContent = "Remote: connecting";
    document.body.appendChild(roomBadge);

    fetch("/api/room", { method: "POST" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("room create failed");
        }

        return response.json();
      })
      .then(function (data) {
        roomCode = data.room;
        lastRemoteSlide = current + 1;
        roomBadge.textContent = "Remote: " + roomCode;
        syncRemoteState();
        window.setInterval(pollRemoteState, config.pollMs);
      })
      .catch(function () {
        roomBadge.textContent = "Remote: offline";
      });
  }

  function syncRemoteState() {
    if (!roomCode) {
      return;
    }

    fetch("/api/nav", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room: roomCode,
        action: "goto",
        slide: current + 1,
        total: slides.length,
      }),
    }).catch(function () {});
  }

  function pollRemoteState() {
    if (!roomCode) {
      return;
    }

    fetch("/api/state?room=" + encodeURIComponent(roomCode))
      .then(function (response) {
        if (!response.ok) {
          throw new Error("state fetch failed");
        }

        return response.json();
      })
      .then(function (data) {
        if (
          data.current !== undefined &&
          data.current !== current + 1 &&
          data.current !== lastRemoteSlide
        ) {
          lastRemoteSlide = data.current;
          goTo(data.current - 1, { sync: false });
        }
      })
      .catch(function () {});
  }
})();
