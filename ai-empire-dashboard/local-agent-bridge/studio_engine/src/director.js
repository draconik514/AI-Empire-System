// director.js: Multi-Scene 3D + ReelMimic Character + Karaoke Subtitle Choreographer
(function () {
  const DATA = window.SCENE_DATA || {
    duration: 30,
    title: "Fakta Sains Mengejutkan!",
    words: [],
    scenes: [],
  };

  // Group words into 3-4 word karaoke phrases
  const GROUPS = [];
  (function buildWordGroups() {
    const words = DATA.words || [];
    let cur = [];
    for (let i = 0; i < words.length; i++) {
      cur.push(words[i]);
      const txt = words[i].text || "";
      const isPunct = /[.!?,;:]$/.test(txt);
      const nextPause = i + 1 < words.length ? words[i + 1].start - words[i].end > 0.25 : true;
      if (cur.length >= 4 || (cur.length >= 2 && (isPunct || nextPause)) || i === words.length - 1) {
        GROUPS.push({
          start: cur[0].start,
          end: cur[cur.length - 1].end + 0.12,
          words: cur,
        });
        cur = [];
      }
    }
  })();

  function isSpeakingAt(t) {
    const words = DATA.words || [];
    for (let i = 0; i < words.length; i++) {
      if (t >= words[i].start - 0.03 && t <= words[i].end + 0.03) {
        return 0.35 + 0.65 * Math.abs(Math.sin((t - words[i].start) * 28));
      }
    }
    return 0;
  }

  // Helper to wrap text into lines
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

  // Draw futuristic 3D HUD Callout with animated leader line
  function drawCallout(c, lt, cal, idx) {
    const t0 = 0.45 + idx * 0.4;
    if (lt < t0) return;
    const prog = easeOut(clamp((lt - t0) / 0.45, 0, 1));
    const pop = backOut(clamp((lt - t0) / 0.4, 0, 1));

    const tx = cal.tx || 540;
    const ty = cal.ty || 580;
    const bx = cal.x || 240;
    const by = cal.y || 380;
    const col = cal.color || "#00F5D4";

    c.save();
    c.globalAlpha = clamp((lt - t0) / 0.2, 0, 1);

    // Pulsing target reticle on 3D object
    const rPulse = 12 + Math.sin(lt * 10 + idx) * 4;
    c.strokeStyle = col;
    c.lineWidth = 3;
    c.beginPath();
    c.arc(tx, ty, rPulse, 0, TAU);
    c.stroke();

    c.fillStyle = col;
    c.beginPath();
    c.arc(tx, ty, 5, 0, TAU);
    c.fill();

    // Animated leader line from target (tx, ty) to box (bx, by)
    const curX = lerp(tx, bx, prog);
    const curY = lerp(ty, by, prog);
    c.strokeStyle = col;
    c.lineWidth = 3.5;
    c.setLineDash([8, 5]);
    c.beginPath();
    c.moveTo(tx, ty);
    c.lineTo(curX, curY);
    c.stroke();
    c.setLineDash([]);

    // HUD Callout Card
    if (prog > 0.35) {
      c.translate(bx, by);
      c.scale(pop, pop);
      const w = 330, h = 92;
      c.fillStyle = "rgba(6, 12, 28, 0.88)";
      c.strokeStyle = col;
      c.lineWidth = 3;
      c.beginPath();
      c.roundRect(-w / 2, -h / 2, w, h, 16);
      c.fill();
      c.stroke();

      c.fillStyle = col;
      c.font = '800 22px "Segoe UI", system-ui, sans-serif';
      c.textAlign = "center";
      c.fillText(cal.label || "ANALISIS 3D", 0, -10);

      c.fillStyle = "#FFFFFF";
      c.font = '900 28px "Segoe UI", system-ui, sans-serif';
      c.fillText(cal.val || "AKTIF", 0, 26);
    }
    c.restore();
  }

  // Register shots from DATA.scenes
  const sceneList = DATA.scenes && DATA.scenes.length ? DATA.scenes : [
    { start: 0, end: DATA.duration, mode3d: "jellyfish_ocean", badge: "FAKTA SAINS 3D", headline: DATA.title, char: "ren", face: "surprised" }
  ];

  const shotDefs = sceneList.map((sc, sIdx) => {
    return [
      sc.start,
      function (t, lt, dur) {
        setTOD("night");

        // 1. Render 3D WebGL Simulation on upper/main canvas
        const isDanger = sc.mode3d === "myth_explosion" || (sc.mode3d === "microscope_nematocyst" && lt > 0.8 && lt < 2.2);
        const [sx, sy] = isDanger ? shakeXY(t, 10) : [0, 0];

        const simCanvas = window.renderThreeAt(t, lt, dur, sc.mode3d);
        if (simCanvas) {
          G.save();
          // Subtle slow zoom on 3D viewport
          const z3d = 1 + 0.05 * Math.sin(lt * 0.6);
          G.translate(W / 2 + sx, 590 + sy);
          G.scale(z3d, z3d);
          G.drawImage(simCanvas, -W / 2, -590, 1080, 1180);
          G.restore();
        }

        // 2. Gradient bridge between 3D viewport (top) and Character Studio (bottom)
        const grad = G.createLinearGradient(0, 960, 0, 1920);
        grad.addColorStop(0, "rgba(5, 11, 24, 0)");
        grad.addColorStop(0.22, sc.mode3d === "myth_explosion" ? "rgba(38, 6, 18, 0.94)" : sc.mode3d === "fact_vinegar_shield" ? "rgba(4, 28, 30, 0.94)" : "rgba(7, 13, 32, 0.95)");
        grad.addColorStop(1, "#040814");
        G.fillStyle = grad;
        G.fillRect(0, 960, W, 960);

        // Futuristic glowing divider arc
        G.save();
        G.strokeStyle = sc.badgeColor || "#00F5D4";
        G.lineWidth = 4;
        G.shadowColor = sc.badgeColor || "#00F5D4";
        G.shadowBlur = 18;
        G.beginPath();
        G.moveTo(40, 1145);
        G.lineTo(W - 40, 1145);
        G.stroke();
        G.restore();

        // 3. Anime staging effects (focusLines / speedLines / sparkles) in lower stage
        if (sc.fx === "focusLines" || sc.mode3d === "myth_explosion") {
          G.save();
          focusLines(t, W / 2, 1550, { col: "rgba(255, 60, 100, 0.22)", r: 220, n: 64, w: 8 });
          G.restore();
        } else if (sc.fx === "sparkles" || sc.mode3d === "fact_vinegar_shield") {
          sparkles(t, 540, 1520, 420, 10, "sp" + sIdx, 0.8);
        }

        // 4. 3D HUD Callout Labels pointing directly to the 3D model
        const cals = sc.callouts || [];
        for (let cIdx = 0; cIdx < cals.length; cIdx++) {
          drawCallout(G, lt, cals[cIdx], cIdx);
        }

        // 5. Animated ReelMimic Characters (Ren & Hina) with live Lip-Sync, Moving Arms & Acting
        setTOD("day");
        const ta = onTwos(lt);
        const tk = take(ta, 0.18, 0.9);
        const mouthOpen = isSpeakingAt(t);
        const blinkVal = autoBlink(t, sIdx + 1);
        const waveArm = Math.sin(t * 4.5) * 14;

        G.save();
        if (sc.char === "both") {
          // Left: Hina reacting with animated arms, Right: Ren explaining & pointing at 3D scene
          hina(300, 2120 + tk.dy * 18, 210, {
            t: ta,
            turn: 0.35,
            face: sc.faceHina || "shocked",
            sq: tk.sq * 0.45,
            blink: autoBlink(t, 7),
            talk: mouthOpen * 0.35,
            look: [0.3, -0.5],
            armL: [25 + waveArm, 85, "open"],
            armR: [-20 - waveArm * 0.5, 75, "open"],
            sway: [0.03 * Math.sin(t * 2.2), 0],
          });
          ren(780, 2150 + tk.dy * 18, 215, {
            t: ta,
            turn: -0.3,
            face: sc.face || "determined",
            sq: tk.sq * 0.45,
            blink: blinkVal,
            talk: mouthOpen,
            look: [-0.2, -0.45],
            armL: [35 + waveArm, 95, "point"],
            armR: [-18, 45, "open"],
            sway: [-0.03 * Math.cos(t * 2.0), 0],
          });
        } else if (sc.char === "hina") {
          hina(540 + sx * 0.6, 2140 + tk.dy * 22, 230, {
            t: ta,
            turn: 0.2 * Math.sin(t * 0.9),
            face: sc.face || "shocked",
            sq: tk.sq * 0.5,
            blink: blinkVal,
            talk: mouthOpen,
            look: [0, -0.5],
            armL: [30 + waveArm, 95, "point"],
            armR: [-25 - waveArm * 0.5, 85, "open"],
            sway: [0.03 * Math.sin(t * 2.4), 0.015 * Math.cos(t * 1.8)],
          });
        } else {
          ren(540 + sx * 0.6, 2160 + tk.dy * 22, 230, {
            t: ta,
            turn: -0.2 * Math.cos(t * 0.8),
            face: sc.face || "determined",
            sq: tk.sq * 0.5,
            blink: blinkVal,
            talk: mouthOpen,
            look: [0, -0.5],
            armL: [35 + waveArm, 95, "point"],
            armR: [-20 + waveArm * 0.5, 65, "open"],
            sway: [0.025 * Math.sin(t * 2.1), 0.015 * Math.sin(t * 1.5)],
          });
        }
        G.restore();

        // 6. Scene Transitions (Impact Frame, Flash, Slash Wipe)
        if (sIdx > 0 && lt < 0.18) {
          flash(1 - lt / 0.18, sc.badgeColor || "#00F5D4");
        }
        if (sc.mode3d === "myth_explosion" && lt > 0.35 && lt < 0.48) {
          impactFrame(1, "invert", { x: 540, y: 580, t });
        }
        if (lt > dur - 0.28 && sIdx < sceneList.length - 1) {
          slashWipe(seg(lt, dur - 0.28, dur) * 0.5);
        }
      },
    ];
  });

  shots(shotDefs);

  // ===========================================================================
  // OVERLAY HOOK: TOP HUD + SCENE HEADLINE + WORD-BY-WORD POP KARAOKE SUBTITLES
  // ===========================================================================
  window.overlayHook = function (c, t) {
    // Find current scene
    let sc = sceneList[0];
    for (let i = 0; i < sceneList.length; i++) {
      if (t >= sceneList[i].start) sc = sceneList[i];
    }
    const lt = Math.max(0, t - sc.start);
    const accent = sc.badgeColor || "#00F5D4";

    c.save();

    // 1. Top Progress Bar (0..W)
    const prog = clamp(t / Math.max(1, DATA.duration), 0, 1);
    c.fillStyle = "rgba(255,255,255,0.14)";
    c.fillRect(0, 0, W, 10);
    c.fillStyle = accent;
    c.fillRect(0, 0, W * prog, 10);

    // 2. Top Scene Badge Pill (y = 68)
    const badgePop = backOut(clamp(lt / 0.35, 0, 1));
    c.save();
    c.translate(W / 2, 74);
    c.scale(badgePop, badgePop);
    c.font = '900 25px "Segoe UI", system-ui, sans-serif';
    const bTxt = sc.badge || "SIMULASI 3D EDUKASI";
    const bW = Math.min(960, c.measureText(bTxt).width + 64);
    c.fillStyle = "rgba(6, 12, 28, 0.88)";
    c.strokeStyle = accent;
    c.lineWidth = 3.5;
    c.beginPath();
    c.roundRect(-bW / 2, -28, bW, 56, 28);
    c.fill();
    c.stroke();

    c.fillStyle = accent;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(bTxt, 0, 1);
    c.restore();

    // 3. Scene Dynamic Headline Card (y = 165)
    if (sc.headline) {
      const hPop = easeOut(clamp(lt / 0.4, 0, 1));
      c.save();
      c.translate(W / 2, lerp(130, 175, hPop));
      c.globalAlpha = hPop;
      c.font = '900 38px "Segoe UI", system-ui, sans-serif';
      c.textAlign = "center";
      c.textBaseline = "middle";
      const lines = wrapLines(c, sc.headline, 940);
      const boxH = lines.length * 48 + 28;
      c.fillStyle = "rgba(5, 10, 25, 0.78)";
      c.beginPath();
      c.roundRect(-490, -boxH / 2, 980, boxH, 20);
      c.fill();

      for (let i = 0; i < lines.length; i++) {
        const ly = (i - (lines.length - 1) / 2) * 48;
        c.lineWidth = 9;
        c.strokeStyle = "#000000";
        c.strokeText(lines[i], 0, ly);
        c.fillStyle = "#FFFFFF";
        c.fillText(lines[i], 0, ly);
      }
      c.restore();
    }

    // 4. WORD-BY-WORD POP KARAOKE SUBTITLES (y = 1235 - Right between 3D & Character!)
    let activeGroup = null;
    for (let i = 0; i < GROUPS.length; i++) {
      if (t >= GROUPS[i].start - 0.06 && t <= GROUPS[i].end) {
        activeGroup = GROUPS[i];
        break;
      }
    }

    if (activeGroup) {
      const gWords = activeGroup.words;
      const baseFont = 56;
      c.font = `900 ${baseFont}px "Segoe UI", "Arial Black", sans-serif`;

      // Measure total width of the word group
      const gap = 36;
      const widths = gWords.map((w) => c.measureText(w.text).width);
      let totalW = widths.reduce((a, b) => a + b, 0) + gap * (gWords.length - 1);

      // Auto-scale font down if group is wider than 920px
      const scaleFit = totalW > 900 ? 900 / totalW : 1;
      const finalFont = Math.round(baseFont * scaleFit);
      c.font = `900 ${finalFont}px "Segoe UI", "Arial Black", sans-serif`;
      const scaledWidths = gWords.map((w) => c.measureText(w.text).width);
      const scaledGap = gap * scaleFit;
      totalW = scaledWidths.reduce((a, b) => a + b, 0) + scaledGap * (gWords.length - 1);

      const subY = 1740;
      // Dark glass backing pill behind the karaoke phrase
      const padX = 38, padY = 26;
      c.fillStyle = "rgba(4, 8, 20, 0.86)";
      c.strokeStyle = "rgba(255, 255, 255, 0.22)";
      c.lineWidth = 2.5;
      c.beginPath();
      c.roundRect(W / 2 - totalW / 2 - padX, subY - finalFont / 2 - padY, totalW + padX * 2, finalFont + padY * 2, 26);
      c.fill();
      c.stroke();

      // Draw each word with individual pop animation when active
      let curX = W / 2 - totalW / 2;
      for (let i = 0; i < gWords.length; i++) {
        const wObj = gWords[i];
        const wW = scaledWidths[i];
        const centerX = curX + wW / 2;
        const isCurrent = t >= wObj.start - 0.04 && t <= wObj.end + 0.06;
        const isPast = t > wObj.end + 0.06;

        c.save();
        c.translate(centerX, subY);

        if (isCurrent) {
          const wProg = clamp((t - wObj.start) / 0.14, 0, 1);
          const wScale = 1 + 0.24 * backOut(wProg);
          c.scale(wScale, wScale);

          // Highlight pill behind the active word
          c.fillStyle = accent;
          c.beginPath();
          c.roundRect(-wW / 2 - 12, -finalFont / 2 - 8, wW + 24, finalFont + 16, 14);
          c.fill();

          c.font = `900 ${finalFont}px "Segoe UI", "Arial Black", sans-serif`;
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.lineWidth = 8;
          c.strokeStyle = "#000000";
          c.strokeText(wObj.text, 0, 2);
          c.fillStyle = "#FFE600";
          c.fillText(wObj.text, 0, 2);
        } else {
          c.font = `900 ${finalFont}px "Segoe UI", "Arial Black", sans-serif`;
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.lineWidth = 8;
          c.strokeStyle = "#000000";
          c.strokeText(wObj.text, 0, 2);
          c.fillStyle = isPast ? "#E2E8F0" : "#FFFFFF";
          c.fillText(wObj.text, 0, 2);
        }

        c.restore();
        curX += wW + scaledGap;
      }
    }

    c.restore();
  };
})();
