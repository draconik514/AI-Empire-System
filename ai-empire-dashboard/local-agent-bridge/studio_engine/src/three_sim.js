// three_sim.js: Advanced Real-time Deterministic Three.js 3D Simulation Engine (1080x1180 Stage)
// Includes:
// 1. jellyfish_ocean: Bioluminescent Turritopsis dohrnii swimming in deep sea
// 2. cellular_transdiff: Medusa shrinking & transforming into sea-bed Polyp cluster (Reverse Aging)
// 3. predator_attack: Huge deep-sea predator (jaw & teeth) lunging, snapping, impact bubbles & bite
// 4. disease_infection: Bacterial & viral infection rot, sickly pale purple decay, swarming microbes
// 5. dna_telomere: 3D DNA Double Helix genetic reprogramming & telomere repair
(function () {
  const SIM_W = 1080;
  const SIM_H = 1180;
  let renderer, scene, camera;
  let simCanvas;

  let groups = {};
  let jellyfishData = null;
  let transdiffData = null;
  let predatorData = null;
  let infectionData = null;
  let dnaData = null;
  let particlesMesh = null;

  window.initThreeSim = function () {
    simCanvas = document.createElement("canvas");
    simCanvas.width = SIM_W;
    simCanvas.height = SIM_H;

    renderer = new THREE.WebGLRenderer({
      canvas: simCanvas,
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: false,
    });
    renderer.setSize(SIM_W, SIM_H, false);
    renderer.setPixelRatio(1);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040816);
    scene.fog = new THREE.FogExp2(0x040816, 0.028);

    camera = new THREE.PerspectiveCamera(46, SIM_W / SIM_H, 0.1, 250);

    // 3-Point Studio Lighting
    const ambLight = new THREE.AmbientLight(0x20355a, 1.4);
    scene.add(ambLight);

    const keyLight = new THREE.DirectionalLight(0xfff0e2, 2.4);
    keyLight.position.set(14, 20, 16);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x00f5d4, 4.0, 50);
    rimLight.position.set(-14, 10, -12);
    scene.add(rimLight);

    const accentLight = new THREE.PointLight(0xff2a85, 3.2, 45);
    accentLight.position.set(12, -8, 10);
    scene.add(accentLight);

    // Global ambient floating marine particles
    const pGeo = new THREE.BufferGeometry();
    const pCount = 300;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (hash(i * 3.1) - 0.5) * 36;
      pPos[i * 3 + 1] = (hash(i * 7.3) - 0.5) * 36;
      pPos[i * 3 + 2] = (hash(i * 11.7) - 0.5) * 26;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x4cc9f0,
      size: 0.24,
      transparent: true,
      opacity: 0.8,
    });
    particlesMesh = new THREE.Points(pGeo, pMat);
    scene.add(particlesMesh);

    buildJellyfishScene();
    buildTransdiffScene();
    buildPredatorScene();
    buildInfectionScene();
    buildDnaScene();
  };

  // ---------------------------------------------------------------------------
  // 1. BIOLUMINESCENT IMMORTAL JELLYFISH
  // ---------------------------------------------------------------------------
  function buildJellyfishScene() {
    const g = new THREE.Group();
    // Translucent outer bell
    const bellGeo = new THREE.SphereGeometry(3.3, 36, 28, 0, Math.PI * 2, 0, Math.PI * 0.62);
    const bellMat = new THREE.MeshPhongMaterial({
      color: 0x00e5ff,
      emissive: 0x004477,
      specular: 0xffffff,
      shininess: 90,
      transparent: true,
      opacity: 0.76,
      side: THREE.DoubleSide,
    });
    const bell = new THREE.Mesh(bellGeo, bellMat);
    g.add(bell);

    // Red scarlet core
    const coreGeo = new THREE.SphereGeometry(1.5, 24, 24);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0xff2a6d,
      emissive: 0xcc1144,
      shininess: 100,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 0.65;
    g.add(core);

    // Margin ring
    const rimGeo = new THREE.TorusGeometry(3.05, 0.15, 16, 48);
    const rimMat = new THREE.MeshBasicMaterial({ color: 0x72efdd });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = -0.55;
    g.add(rim);

    // Tentacles (24 chains)
    const tentacles = [];
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const radius = i % 3 === 0 ? 1.7 : 2.75;
      const segs = [];
      const segCount = 14;
      const tMat = new THREE.MeshPhongMaterial({
        color: i % 2 === 0 ? 0x00f5d4 : 0xff4d94,
        emissive: i % 2 === 0 ? 0x005566 : 0x661133,
      });
      for (let s = 0; s < segCount; s++) {
        const r = Math.max(0.03, 0.13 * (1 - s / segCount));
        const m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), tMat);
        g.add(m);
        segs.push(m);
      }
      tentacles.push({ angle, radius, segs });
    }

    scene.add(g);
    groups.jellyfish_ocean = g;
    jellyfishData = { bell, core, rim, tentacles };
  }

  // ---------------------------------------------------------------------------
  // 2. TRANSDIFFERENTIATION (REVERSE AGING: MEDUSA -> SEABED POLYP)
  // ---------------------------------------------------------------------------
  function buildTransdiffScene() {
    const g = new THREE.Group();

    // Seabed rocky reef foundation
    const reefGeo = new THREE.CylinderGeometry(5.2, 5.8, 1.6, 24);
    const reefMat = new THREE.MeshPhongMaterial({
      color: 0x1f2438,
      emissive: 0x0d111d,
      roughness: 0.9,
    });
    const reef = new THREE.Mesh(reefGeo, reefMat);
    reef.position.y = -3.8;
    g.add(reef);

    // Transforming Medusa (shrinking into cyst/ball)
    const cystGeo = new THREE.SphereGeometry(2.2, 32, 32);
    const cystMat = new THREE.MeshPhongMaterial({
      color: 0x00f5d4,
      emissive: 0x005544,
      transparent: true,
      opacity: 0.85,
    });
    const cyst = new THREE.Mesh(cystGeo, cystMat);
    cyst.position.y = 0;
    g.add(cyst);

    // Growing Golden Polyp Stems
    const polyps = [];
    for (let p = 0; p < 7; p++) {
      const pGroup = new THREE.Group();
      const ang = (p / 7) * Math.PI * 2;
      const rad = p === 0 ? 0 : 1.8 + (p % 2) * 0.9;
      pGroup.position.set(Math.cos(ang) * rad, -3.0, Math.sin(ang) * rad);

      // Stalk
      const stalkGeo = new THREE.CylinderGeometry(0.14, 0.22, 3.2, 12);
      const stalkMat = new THREE.MeshPhongMaterial({
        color: 0xffbe0b,
        emissive: 0x664400,
      });
      const stalk = new THREE.Mesh(stalkGeo, stalkMat);
      stalk.position.y = 1.6;
      pGroup.add(stalk);

      // Polyp crown head with blooming tentacle arms
      const crownGeo = new THREE.SphereGeometry(0.48, 16, 16);
      const crownMat = new THREE.MeshBasicMaterial({ color: 0x72efdd });
      const crown = new THREE.Mesh(crownGeo, crownMat);
      crown.position.y = 3.2;
      pGroup.add(crown);

      const crownTentacles = [];
      for (let t = 0; t < 8; t++) {
        const tAng = (t / 8) * Math.PI * 2;
        const armGeo = new THREE.ConeGeometry(0.08, 1.2, 8);
        const armMat = new THREE.MeshBasicMaterial({ color: 0xffe600 });
        const arm = new THREE.Mesh(armGeo, armMat);
        arm.position.set(Math.cos(tAng) * 0.45, 3.5, Math.sin(tAng) * 0.45);
        arm.rotation.z = Math.PI * 0.25;
        arm.rotation.y = tAng;
        pGroup.add(arm);
        crownTentacles.push(arm);
      }

      g.add(pGroup);
      polyps.push({ group: pGroup, stalk, crown, crownTentacles, pIdx: p });
    }

    scene.add(g);
    groups.cellular_transdiff = g;
    transdiffData = { cyst, reef, polyps };
  }

  // ---------------------------------------------------------------------------
  // 3. APEX PREDATOR ATTACK (SHARK/SEA TURTLE JAWS SNAPPING)
  // ---------------------------------------------------------------------------
  function buildPredatorScene() {
    const g = new THREE.Group();

    // The Victim Jellyfish in danger
    const vicGeo = new THREE.SphereGeometry(2.2, 28, 20);
    const vicMat = new THREE.MeshPhongMaterial({
      color: 0x00f5d4,
      emissive: 0x004455,
      transparent: true,
      opacity: 0.72,
    });
    const victim = new THREE.Mesh(vicGeo, vicMat);
    victim.position.set(-1.2, 0, 0);
    g.add(victim);

    // Giant Predator Upper Head/Snout
    const upperHeadGeo = new THREE.ConeGeometry(3.6, 8.5, 16);
    upperHeadGeo.rotateX(Math.PI / 2);
    const predMat = new THREE.MeshPhongMaterial({
      color: 0x1a2536,
      emissive: 0x0a101d,
      specular: 0x6688aa,
      shininess: 70,
    });
    const upperJaw = new THREE.Mesh(upperHeadGeo, predMat);
    upperJaw.position.set(7.5, 2.4, 0);
    upperJaw.rotation.y = -Math.PI / 2;
    g.add(upperJaw);

    // Predator Glowing Red/Yellow Menacing Eyes
    const eyeGeo = new THREE.SphereGeometry(0.38, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffbe0b });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(5.2, 3.2, 1.8);
    g.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(5.2, 3.2, -1.8);
    g.add(eyeR);

    // Predator Lower Jaw
    const lowerJawGeo = new THREE.ConeGeometry(3.2, 7.8, 16);
    lowerJawGeo.rotateX(Math.PI / 2);
    const lowerJaw = new THREE.Mesh(lowerJawGeo, predMat);
    lowerJaw.position.set(7.5, -2.4, 0);
    lowerJaw.rotation.y = -Math.PI / 2;
    g.add(lowerJaw);

    // Sharp Razor Teeth Rows (Upper & Lower)
    const teeth = [];
    const toothGeo = new THREE.ConeGeometry(0.26, 0.95, 6);
    const toothMat = new THREE.MeshPhongMaterial({ color: 0xffffff, specular: 0xffffff });
    for (let i = 0; i < 14; i++) {
      const z = (i - 6.5) * 0.42;
      const tUp = new THREE.Mesh(toothGeo, toothMat);
      tUp.position.set(4.4 + Math.abs(z) * 0.25, 0.8, z);
      tUp.rotation.z = Math.PI;
      g.add(tUp);
      teeth.push(tUp);

      const tDown = new THREE.Mesh(toothGeo, toothMat);
      tDown.position.set(4.4 + Math.abs(z) * 0.25, -0.8, z);
      g.add(tDown);
      teeth.push(tDown);
    }

    // Impact Bubbles on Bite
    const bubbles = [];
    const bGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const bMat = new THREE.MeshBasicMaterial({ color: 0xade8f4, transparent: true, opacity: 0.75 });
    for (let b = 0; b < 40; b++) {
      const bMesh = new THREE.Mesh(bGeo, bMat);
      g.add(bMesh);
      bubbles.push({
        mesh: bMesh,
        dir: new THREE.Vector3((hash(b * 3.1) - 0.5) * 6, hash(b * 5.7) * 5, (hash(b * 7.9) - 0.5) * 6),
      });
    }

    scene.add(g);
    groups.predator_attack = g;
    predatorData = { victim, upperJaw, lowerJaw, eyeL, eyeR, teeth, bubbles, group: g };
  }

  // ---------------------------------------------------------------------------
  // 4. DISEASE INFECTION & BACTERIAL CELLULAR ROT
  // ---------------------------------------------------------------------------
  function buildInfectionScene() {
    const g = new THREE.Group();

    // Sickly corrupted jellyfish bell (mottled pale purple/grey)
    const sickBellGeo = new THREE.SphereGeometry(3.1, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.65);
    const sickBellMat = new THREE.MeshPhongMaterial({
      color: 0x6c5b7b,
      emissive: 0x2b1030,
      specular: 0x995588,
      shininess: 30,
      transparent: true,
      opacity: 0.82,
    });
    const sickBell = new THREE.Mesh(sickBellGeo, sickBellMat);
    g.add(sickBell);

    // Rotting dark core with toxic necrotic pustules
    const rotCoreGeo = new THREE.SphereGeometry(1.6, 20, 20);
    const rotCoreMat = new THREE.MeshPhongMaterial({
      color: 0x3d0c24,
      emissive: 0x1f0312,
      shininess: 40,
    });
    const rotCore = new THREE.Mesh(rotCoreGeo, rotCoreMat);
    rotCore.position.y = 0.5;
    g.add(rotCore);

    // 25 3D Spiky Bacterial / Viral Microbes attacking the tissue
    const microbes = [];
    const micBodyGeo = new THREE.IcosahedronGeometry(0.42, 1);
    const spikeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6);
    for (let m = 0; m < 25; m++) {
      const micGroup = new THREE.Group();
      const mMat = new THREE.MeshPhongMaterial({
        color: m % 2 === 0 ? 0xff0055 : 0x00f5d4,
        emissive: 0x330011,
      });
      const micBody = new THREE.Mesh(micBodyGeo, mMat);
      micGroup.add(micBody);

      // Microbe receptor spikes
      for (let s = 0; s < 8; s++) {
        const spMesh = new THREE.Mesh(spikeGeo, mMat);
        const sDir = new THREE.Vector3(
          hash(m * 12 + s * 3.1) - 0.5,
          hash(m * 12 + s * 5.3) - 0.5,
          hash(m * 12 + s * 7.7) - 0.5
        ).normalize();
        spMesh.position.copy(sDir).multiplyScalar(0.45);
        spMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), sDir);
        micGroup.add(spMesh);
      }

      g.add(micGroup);
      microbes.push({
        group: micGroup,
        orbitRadius: 2.2 + hash(m * 3.5) * 2.2,
        speed: 1.2 + hash(m * 4.7) * 2.4,
        phase: m * 0.45,
        lat: (hash(m * 6.3) - 0.5) * Math.PI * 0.7,
      });
    }

    scene.add(g);
    groups.disease_infection = g;
    infectionData = { sickBell, rotCore, microbes };
  }

  // ---------------------------------------------------------------------------
  // 5. DNA DOUBLE HELIX & TELOMERE REPAIR REPROGRAMMING
  // ---------------------------------------------------------------------------
  function buildDnaScene() {
    const g = new THREE.Group();
    const rungs = [];
    const N = 36;
    for (let i = 0; i < N; i++) {
      const y = (i - N / 2) * 0.38;
      const angle = i * 0.44;
      const r = 2.4;

      const row = new THREE.Group();
      row.position.y = y;
      row.rotation.y = angle;

      const s1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 12, 12),
        new THREE.MeshPhongMaterial({ color: 0x00f5d4, emissive: 0x005544 })
      );
      s1.position.x = -r;
      row.add(s1);

      const s2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 12, 12),
        new THREE.MeshPhongMaterial({ color: 0xffbe0b, emissive: 0x664400 })
      );
      s2.position.x = r;
      row.add(s2);

      const bar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, r * 2, 8),
        new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x72efdd : 0xff4d94 })
      );
      bar.rotation.z = Math.PI / 2;
      row.add(bar);

      g.add(row);
      rungs.push({ row, baseAngle: angle, idx: i });
    }
    scene.add(g);
    groups.dna_telomere = g;
    dnaData = { rungs, group: g };
  }

  // ---------------------------------------------------------------------------
  // RENDER AT EXACT TIMELINE TIME t (DETERMINISTIC)
  // ---------------------------------------------------------------------------
  window.renderThreeAt = function (t, lt, dur, mode) {
    if (!renderer) return null;

    Object.keys(groups).forEach((k) => {
      groups[k].visible = k === mode;
    });
    if (!groups[mode]) {
      groups.jellyfish_ocean.visible = true;
      mode = "jellyfish_ocean";
    }

    if (particlesMesh) {
      particlesMesh.rotation.y = t * 0.12;
      particlesMesh.position.y = ((t * 0.9) % 6) - 3;
    }

    if (mode === "jellyfish_ocean") {
      scene.background.setHex(0x040816);
      const pulse = Math.sin(t * 4.2);
      const { bell, core, rim, tentacles } = jellyfishData;
      bell.scale.set(1 + pulse * 0.12, 1 - pulse * 0.1, 1 + pulse * 0.12);
      core.scale.setScalar(1 + Math.sin(t * 8.4) * 0.15);
      rim.scale.setScalar(1 + pulse * 0.12);

      groups.jellyfish_ocean.position.y = Math.sin(t * 2.1) * 0.8 + 0.4;
      groups.jellyfish_ocean.rotation.y = t * 0.45;
      groups.jellyfish_ocean.rotation.z = Math.sin(t * 1.3) * 0.12;

      for (let i = 0; i < tentacles.length; i++) {
        const tc = tentacles[i];
        for (let s = 0; s < tc.segs.length; s++) {
          const wave = Math.sin(t * 5.2 - s * 0.45 + i) * (0.15 + s * 0.045);
          const r = tc.radius + wave;
          const x = Math.cos(tc.angle) * r;
          const z = Math.sin(tc.angle) * r;
          const y = -0.6 - s * 0.42 + Math.cos(t * 4.2 - s * 0.3) * 0.12;
          tc.segs[s].position.set(x, y, z);
        }
      }

      const camZ = lerp(14.0, 10.2, ease(clamp(lt / Math.max(1, dur), 0, 1)));
      camera.position.set(Math.sin(t * 0.35) * 2.4, 0.4 + Math.cos(t * 0.5) * 0.7, camZ);
      camera.lookAt(0, -0.6, 0);
    } else if (mode === "cellular_transdiff") {
      scene.background.setHex(0x061122);
      const { cyst, polyps } = transdiffData;
      const transProg = ease(clamp(lt / Math.max(1, dur * 0.7), 0, 1));

      // Medusa shrinks down onto the rock
      const shrink = lerp(1.2, 0.38, transProg);
      cyst.scale.setScalar(shrink + Math.sin(t * 6) * 0.05);
      cyst.position.y = lerp(2.2, -2.6, transProg);

      // Polyps bloom up from the rock as aging reverses
      for (let i = 0; i < polyps.length; i++) {
        const p = polyps[i];
        const pGrow = clamp((transProg - 0.2 - i * 0.08) / 0.5, 0, 1);
        p.group.scale.setScalar(easeOut(pGrow));
        for (let a = 0; a < p.crownTentacles.length; a++) {
          p.crownTentacles[a].rotation.z = Math.PI * 0.25 + Math.sin(t * 4 + a) * 0.12;
        }
      }

      camera.position.set(Math.sin(t * 0.5) * 6, lerp(1.5, -0.8, transProg), 13.0);
      camera.lookAt(0, -1.8, 0);
    } else if (mode === "predator_attack") {
      scene.background.setHex(0x0a040d);
      const { victim, upperJaw, lowerJaw, eyeL, eyeR, teeth, bubbles } = predatorData;

      // Predator lunges forward in cycles or at peak
      const attackCycle = (lt * 0.75) % 1;
      const biteProg = Math.sin(attackCycle * Math.PI);
      const lungeX = lerp(6.5, 2.2, easeIn(biteProg));

      upperJaw.position.x = lungeX;
      lowerJaw.position.x = lungeX;
      upperJaw.rotation.z = lerp(0.35, -0.05, biteProg);
      lowerJaw.rotation.z = lerp(-0.35, 0.05, biteProg);

      eyeL.position.x = lungeX - 2.2;
      eyeR.position.x = lungeX - 2.2;

      for (let i = 0; i < teeth.length; i++) {
        teeth[i].position.x = lungeX - 3.1 + Math.abs(i % 14 - 6.5) * 0.22;
      }

      // Jellyfish victim flinches in panic
      victim.position.x = -1.2 + Math.sin(t * 14) * 0.25;
      victim.position.y = Math.cos(t * 10) * 0.3;
      victim.scale.setScalar(lerp(1.0, 0.75, biteProg));

      // Bubble rush
      for (let b = 0; b < bubbles.length; b++) {
        const bb = bubbles[b];
        const bTime = (lt * 3 + b * 0.15) % 1;
        bb.mesh.position.set(
          lungeX - 1.5 + bb.dir.x * bTime,
          bb.dir.y * bTime - 1.0,
          bb.dir.z * bTime
        );
        bb.mesh.scale.setScalar(bTime * 1.6);
      }

      camera.position.set(Math.sin(t * 0.8) * 4.5, 0.5, 12.5);
      camera.lookAt(0.5, 0, 0);
    } else if (mode === "disease_infection") {
      scene.background.setHex(0x130718);
      const { sickBell, rotCore, microbes } = infectionData;
      const pulse = Math.sin(t * 2.5);

      sickBell.scale.set(1 + pulse * 0.06, 1 - pulse * 0.05, 1 + pulse * 0.06);
      rotCore.scale.setScalar(1 + Math.sin(t * 5) * 0.12);

      // Microbes swarm around the decaying bell
      for (let m = 0; m < microbes.length; m++) {
        const mic = microbes[m];
        const ang = t * mic.speed + mic.phase;
        const x = Math.cos(ang) * mic.orbitRadius;
        const z = Math.sin(ang) * mic.orbitRadius;
        const y = Math.sin(mic.lat) * 2.2 + Math.sin(t * 3 + m) * 0.4;
        mic.group.position.set(x, y, z);
        mic.group.rotation.x = t * 2 + m;
        mic.group.rotation.y = t * 3 + m;
      }

      camera.position.set(Math.sin(t * 0.6) * 5, 0.8, 12.0);
      camera.lookAt(0, 0, 0);
    } else if (mode === "dna_telomere") {
      scene.background.setHex(0x050c26);
      const { rungs, group } = dnaData;
      group.rotation.y = t * 1.25;
      group.rotation.z = Math.sin(t * 0.6) * 0.15;

      for (let i = 0; i < rungs.length; i++) {
        const r = rungs[i];
        const wave = Math.sin(t * 4.5 + i * 0.32);
        r.row.scale.setScalar(1 + wave * 0.12);
      }

      camera.position.set(0, Math.sin(t * 0.7) * 2.2, 13.5);
      camera.lookAt(0, 0, 0);
    }

    renderer.render(scene, camera);
    return simCanvas;
  };
})();
