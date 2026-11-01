// director.js: Professional Remotion-Grade Motion Graphics + Solo Male Presenter (Ren) + Consistent Karaoke
(function () {
  const DATA = window.SCENE_DATA || {
    duration: 72,
    title: "Makhluk yang Bisa Hidup Selamanya!",
    words: [],
    scenes: [],
  };

  // ---------------------------------------------------------------------------
  // REMOTION SPRING PHYSICS ENGINE
  // ---------------------------------------------------------------------------
  function remotionSpring(t, t0, config = {}) {
    if (t < t0) return 0;
    const elapsed = t - t0;
    const damping = config.damping || 14;
    const stiffness = config.stiffness || 120;
    const mass = config.mass || 1;
    const w0 = Math.sqrt(stiffness / mass);
    const zeta = damping / (2 * Math.sqrt(stiffness * mass));

    if (zeta < 1) {
      const wd = w0 * Math.sqrt(1 - zeta * zeta);
      return 1 - Math.exp(-zeta * w0 * elapsed) * (Math.cos(wd * elapsed) + (zeta * w0 / wd) * Math.sin(wd * elapsed));
    }
    return 1 - Math.exp(-w0 * elapsed) * (1 + w0 * elapsed);
  }

  // Group words into 3-4 word karaoke phrases
  const GROUPS = [];
  (function buildWordGroups() {
    const words = DATA.words || [];
    let cur = [];
    for (let i = 0; i < words.length; i++) {
      cur.push(words[i]);
      const txt = words[i].text || "";
      const isPunct = /[.!?,;:]$/.test(txt);
      const nextPause = i + 1 < words.length ? words[i + 1].start - words[i].end > 0.22 : true;
      if (cur.length >= 4 || (cur.length >= 2 && (isPunct || nextPause)) || i === words.length - 1) {
        GROUPS.push({
          start: cur[0].start,
          end: cur[cur.length - 1].end + 0.14,
          words: cur,
        });
        cur = [];
      }
    }
  })();

  function isSpeakingAt(t) {
    const words = DATA.words || [];
    for (let i = 0; i < words.length; i++) {
      if (t >= words[i].start - 0.04 && t <= words[i].end + 0.04) {
        return 0.35 + 0.65 * Math.abs(Math.sin((t - words[i].start) * 26));
      }
    }
    return 0;
  }

  function wrapLines(ctx, text, maxW) {
    const words = String(text || "").split(/\s+/);
    const lines = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (ctx.measureText(test).width > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  // Remotion-style Dynamic KPI Stat Badge
  function drawRemotionKpi(c, lt, kpi) {
    if (!kpi) return;
    const t0 = 0.45;
    if (lt < t0) return;
    const scale = remotionSpring(lt, t0, { damping: 13, stiffness: 130 });
    const bx = kpi.x || 540;
    const by = kpi.y || 420;

    c.save();
    c.translate(bx, by);
    c.scale(scale, scale);

    const w = 460, h = 104;
    c.fillStyle = "rgba(6, 14, 32, 0.88)";
    c.strokeStyle = "#00F5D4";
    c.lineWidth = 3.5;
    c.shadowColor = "rgba(0, 245, 212, 0.45)";
    c.shadowBlur = 20;
    c.beginPath();
    c.roundRect(-w / 2, -h / 2, w, h, 20);
    c.fill();
    c.stroke();
    c.shadowBlur = 0;

    c.fillStyle = "#00F5D4";
    c.font = '800 22px "Segoe UI", system-ui, sans-serif';
    c.textAlign = "center";
    c.fillText(kpi.label || "DATA RISET", 0, -14);

    c.fillStyle = "#FFE600";
    c.font = '900 32px "Segoe UI", system-ui, sans-serif';
    c.fillText(kpi.value || "AKTIF", 0, 26);

    c.restore();
  }

  // Remotion-style Audio Visualizer Waveform Bar
  function drawRemotionAudioWave(c, t) {
    const mouth = isSpeakingAt(t);
    const baseY = 1175;
    const barCount = 36;
    const totalW = 680;
    const barW = 10;
    const gap = (totalW - barCount * barW) / (barCount - 1);

    c.save();
    const startX = (W - totalW) / 2;
    for (let i = 0; i < barCount; i++) {
      const freq = Math.sin(t * 14 + i * 0.45) * 0.5 + 0.5;
      const h = Math.max(6, (mouth * 42 + 8) * freq);
      const x = startX + i * (barW + gap);
      c.fillStyle = i % 2 === 0 ? "rgba(0, 245, 212, 0.75)" : "rgba(255, 230, 0, 0.75)";
      c.beginPath();
      c.roundRect(x, baseY - h / 2, barW, h, 4);
      c.fill();
    }
    c.restore();
  }

  // Register Scenes
  const sceneList = DATA.scenes && DATA.scenes.length ? DATA.scenes : [];

  const shotDefs = sceneList.map((sc, sIdx) => {
    return [
      sc.start,
      function (t, lt, dur) {
        setTOD("night");

        // 1. Render 3D WebGL Simulation viewport (top stage 1080x1180)
        const isPredatorAttack = sc.mode3d === "predator_attack";
        const isDisease = sc.mode3d === "disease_infection";
        const [sx, sy] = isPredatorAttack ? shakeXY(t, 12) : [0, 0];

        const simCanvas = window.renderThreeAt(t, lt, dur, sc.mode3d);
        if (simCanvas) {
          G.save();
          const z3d = 1 + 0.04 * Math.sin(lt * 0.5);
          G.translate(W / 2 + sx, 590 + sy);
          G.scale(z3d, z3d);
          G.drawImage(simCanvas, -W / 2, -590, 1080, 1180);
          G.restore();
        }

        // 2. Cinematic Gradient Bridge to Lower Stage
        const grad = G.createLinearGradient(0, 960, 0, 1920);
        grad.addColorStop(0, "rgba(4, 8, 22, 0)");
        grad.addColorStop(0.25, isPredatorAttack ? "rgba(28, 6, 16, 0.95)" : isDisease ? "rgba(22, 6, 28, 0.95)" : "rgba(4, 10, 26, 0.95)");
        grad.addColorStop(1, "#040714");
        G.fillStyle = grad;
        G.fillRect(0, 960, W, 960);

        // Remotion Glowing Accent Divider
        G.save();
        G.strokeStyle = "#00F5D4";
        G.lineWidth = 3.5;
        G.shadowColor = "#00F5D4";
        G.shadowBlur = 18;
        G.beginPath();
        G.moveTo(40, 1150);
        G.lineTo(W - 40, 1150);
        G.stroke();
        G.restore();

        // 3. Remotion Audio Visualizer Waveform Bar
        drawRemotionAudioWave(G, t);

        // 4. Remotion KPI Stat Card
        if (sc.kpi) {
          drawRemotionKpi(G, lt, sc.kpi);
        }

        // 5. SOLO MALE PRESENTER (REN) WITH REALISTIC HUMAN ACTING
        // Ren is framed as a high-end YouTube Educator / Science Host
        setTOD("day");
        const mouthOpen = isSpeakingAt(t);
        const blinkVal = autoBlink(t, sIdx + 3);

        // Realistic human breathing and micro posture movement
        const breathY = Math.sin(t * 2.8) * 4;
        const breathLean = Math.sin(t * 1.5) * 1.8;
        const headGlance = Math.sin(t * 1.2) * 0.12 - 0.1;

        // Contextual Human Gestures matching the scene content
        let renFace = sc.face || "neutral";
        let renLook = [0, -0.4];
        let renArmL = [30, 40, "open"];
        let renArmR = [-20, 30, "open"];
        let renBlush = 0;
        let renFx = [];

        if (sc.action === "hook_question") {
          renFace = "surprised";
          renLook = [0, -0.15]; // looking directly at viewer's eyes
          renArmL = [25 + Math.sin(t * 3) * 8, 70, "open"];
          renArmR = [-18, 45, "open"];
        } else if (sc.action === "explain_science") {
          renFace = "determined";
          renLook = [0.15, -0.55]; // glancing up at 3D simulation
          renArmL = [45 + Math.sin(t * 2.5) * 10, 85, "point"]; // pointing up to 3D
          renArmR = [-22, 50, "open"];
        } else if (sc.action === "predator_recoil") {
          renFace = "shocked";
          renLook = [0.2, -0.4];
          renArmL = [15, 100, "fist"];
          renArmR = [-35, 90, "spread"];
          renFx = ["sweat"];
        } else if (sc.action === "disease_concern") {
          renFace = "sad";
          renLook = [-0.1, -0.4];
          renArmL = [20, 85, "hold"];
          renArmR = [-15, 60, "open"];
          renFx = ["gloom"];
        } else if (sc.action === "solution_future") {
          renFace = "smile";
          renLook = [0, -0.15];
          renArmL = [30 + Math.sin(t * 2.5) * 8, 65, "open"];
          renArmR = [-25 - Math.sin(t * 2) * 8, 65, "open"];
          renBlush = 0.35;
          sparkles(t, 540, 1530, 380, 8, "s" + sIdx, 0.7);
        } else if (sc.action === "cta_comment") {
          renFace = "happy";
          renLook = [0, -0.1];
          renArmL = [35, 75, "open"];
          renArmR = [-35, 75, "open"];
          renBlush = 0.45;
          sparkles(t, 540, 1530, 380, 10, "cta", 0.85);
        }

        G.save();
        // Host Ren standing centered with realistic bust framing
        bust(DESIGNS.ren, 540 + sx * 0.4, 1540 + breathY, 440, {
          t: t,
          turn: headGlance,
          lean: breathLean,
          face: renFace,
          blink: blinkVal,
          talk: mouthOpen,
          look: renLook,
          armL: renArmL,
          armR: renArmR,
          blush: renBlush,
          fx: renFx,
          sway: [0.015 * Math.sin(t * 2.2), 0.01 * Math.cos(t * 1.8)],
        });
        G.restore();

        // 6. Transition Effects
        if (sIdx > 0 && lt < 0.2) {
          flash(1 - lt / 0.2, "#00F5D4");
        }
        if (isPredatorAttack && lt > 0.4 && lt < 0.55) {
          impactFrame(1, "invert", { x: 540, y: 580, t });
        }
        if (lt > dur - 0.25 && sIdx < sceneList.length - 1) {
          slashWipe(seg(lt, dur - 0.25, dur) * 0.5);
        }
      },
    ];
  });

  shots(shotDefs);

  // ===========================================================================
  // OVERLAY HOOK: REMOTION PROGRESS BAR + SCENE BADGE + CONSISTENT KARAOKE
  // ===========================================================================
  window.overlayHook = function (c, t) {
    let sc = sceneList[0];
    for (let i = 0; i < sceneList.length; i++) {
      if (t >= sceneList[i].start) sc = sceneList[i];
    }
    const lt = Math.max(0, t - (sc ? sc.start : 0));

    c.save();

    // 1. Remotion Top Progress Bar (0..W) with percentage count
    const totalDur = Math.max(1, DATA.duration);
    const prog = clamp(t / totalDur, 0, 1);
    c.fillStyle = "rgba(255, 255, 255, 0.12)";
    c.fillRect(0, 0, W, 12);
    // Gradient progress fill: Hijau Neon ke Kuning Emas
    const pGrad = c.createLinearGradient(0, 0, W * prog, 0);
    pGrad.addColorStop(0, "#00F5D4");
    pGrad.addColorStop(1, "#FFE600");
    c.fillStyle = pGrad;
    c.fillRect(0, 0, W * prog, 12);

    // 2. Remotion Top Scene Badge Pill with spring pop
    const badgeScale = remotionSpring(lt, 0.05, { damping: 13, stiffness: 120 });
    c.save();
    c.translate(W / 2, 74);
    c.scale(badgeScale, badgeScale);
    c.font = '900 24px "Segoe UI", system-ui, sans-serif';
    const bTxt = sc ? sc.badge || "EDUKASI SAINS 3D" : "EDUKASI SAINS 3D";
    const bW = Math.min(940, c.measureText(bTxt).width + 68);
    c.fillStyle = "rgba(4, 10, 26, 0.88)";
    c.strokeStyle = "#00F5D4";
    c.lineWidth = 3;
    c.shadowColor = "rgba(0, 245, 212, 0.35)";
    c.shadowBlur = 14;
    c.beginPath();
    c.roundRect(-bW / 2, -26, bW, 52, 26);
    c.fill();
    c.stroke();
    c.shadowBlur = 0;

    c.fillStyle = "#00F5D4";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(bTxt, 0, 1);
    c.restore();

    // 3. Scene Dynamic Headline Card (y = 168)
    if (sc && sc.headline) {
      const hScale = remotionSpring(lt, 0.15, { damping: 14, stiffness: 130 });
      c.save();
      c.translate(W / 2, 168);
      c.scale(hScale, hScale);
      c.font = '900 36px "Segoe UI", system-ui, sans-serif';
      c.textAlign = "center";
      c.textBaseline = "middle";
      const lines = wrapLines(c, sc.headline, 920);
      const boxH = lines.length * 48 + 24;
      c.fillStyle = "rgba(4, 9, 24, 0.82)";
      c.strokeStyle = "rgba(255, 255, 255, 0.18)";
      c.lineWidth = 2;
      c.beginPath();
      c.roundRect(-480, -boxH / 2, 960, boxH, 18);
      c.fill();
      c.stroke();

      for (let i = 0; i < lines.length; i++) {
        const ly = (i - (lines.length - 1) / 2) * 48;
        c.lineWidth = 8;
        c.strokeStyle = "#000000";
        c.strokeText(lines[i], 0, ly);
        c.fillStyle = "#FFFFFF";
        c.fillText(lines[i], 0, ly);
      }
      c.restore();
    }

    // 4. CONSISTENT KARAOKE SUBTITLES (Uniform Styling across ALL Scenes)
    // Positioned cleanly at y = 1270 (between 3D simulation & Host Ren)
    let activeGroup = null;
    for (let i = 0; i < GROUPS.length; i++) {
      if (t >= GROUPS[i].start - 0.05 && t <= GROUPS[i].end) {
        activeGroup = GROUPS[i];
        break;
      }
    }

    if (activeGroup) {
      const gWords = activeGroup.words;
      const baseFont = 52;
      c.font = `900 ${baseFont}px "Segoe UI", "Arial Black", sans-serif`;

      const gap = 24;
      const widths = gWords.map((w) => c.measureText(w.text).width);
      let totalW = widths.reduce((a, b) => a + b, 0) + gap * (gWords.length - 1);

      const scaleFit = totalW > 920 ? 920 / totalW : 1;
      const finalFont = Math.round(baseFont * scaleFit);
      c.font = `900 ${finalFont}px "Segoe UI", "Arial Black", sans-serif`;
      const scaledWidths = gWords.map((w) => c.measureText(w.text).width);
      const scaledGap = gap * scaleFit;
      totalW = scaledWidths.reduce((a, b) => a + b, 0) + scaledGap * (gWords.length - 1);

      const subY = 1260;
      const padX = 36, padY = 22;

      // Dark Glass Pill Backdrop
      c.fillStyle = "rgba(3, 7, 18, 0.88)";
      c.strokeStyle = "rgba(0, 245, 212, 0.4)";
      c.lineWidth = 2.5;
      c.shadowColor = "rgba(0, 0, 0, 0.6)";
      c.shadowBlur = 16;
      c.beginPath();
      c.roundRect(W / 2 - totalW / 2 - padX, subY - finalFont / 2 - padY, totalW + padX * 2, finalFont + padY * 2, 24);
      c.fill();
      c.stroke();
      c.shadowBlur = 0;

      // Render Words: Active = Hijau Neon Pill + Kuning Emas Text with Remotion Spring Pop
      let curX = W / 2 - totalW / 2;
      for (let i = 0; i < gWords.length; i++) {
        const wObj = gWords[i];
        const wW = scaledWidths[i];
        const centerX = curX + wW / 2;
        const isCurrent = t >= wObj.start - 0.03 && t <= wObj.end + 0.05;
        const isPast = t > wObj.end + 0.05;

        c.save();
        c.translate(centerX, subY);

        if (isCurrent) {
          const wPop = remotionSpring(t, wObj.start, { damping: 11, stiffness: 140 });
          const curScale = 1 + 0.22 * clamp(wPop, 0, 1.25);
          c.scale(curScale, curScale);

          // Highlight Pill: Hijau Neon Konsisten
          c.fillStyle = "#00F5D4";
          c.shadowColor = "rgba(0, 245, 212, 0.8)";
          c.shadowBlur = 18;
          c.beginPath();
          c.roundRect(-wW / 2 - 12, -finalFont / 2 - 7, wW + 24, finalFont + 14, 14);
          c.fill();
          c.shadowBlur = 0;

          // Active Text: Kuning Emas Konsisten
          c.font = `900 ${finalFont}px "Segoe UI", "Arial Black", sans-serif`;
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.lineWidth = 8;
          c.strokeStyle = "#000000";
          c.strokeText(wObj.text, 0, 1);
          c.fillStyle = "#FFE600";
          c.fillText(wObj.text, 0, 1);
        } else {
          // Inactive Text: Putih Bersih
          c.font = `900 ${finalFont}px "Segoe UI", "Arial Black", sans-serif`;
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.lineWidth = 8;
          c.strokeStyle = "#000000";
          c.strokeText(wObj.text, 0, 1);
          c.fillStyle = isPast ? "#CBD5E1" : "#FFFFFF";
          c.fillText(wObj.text, 0, 1);
        }

        c.restore();
        curX += wW + scaledGap;
      }
    }

    c.restore();
  };
})();
