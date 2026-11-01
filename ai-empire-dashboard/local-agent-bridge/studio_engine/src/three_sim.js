// three_sim.js: Real-time Deterministic Three.js 3D Simulation Engine for YouTube Shorts (1080x1180 Stage)
(function () {
  const SIM_W = 1080;
  const SIM_H = 1180;
  let renderer, scene, camera;
  let simCanvas;

  // Groups for each 3D simulation mode
  let groups = {};
  let jellyfishData = null;
  let nematocystData = null;
  let mythData = null;
  let factData = null;
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
    scene.background = new THREE.Color(0x050b18);
    scene.fog = new THREE.FogExp2(0x050b18, 0.032);

    camera = new THREE.PerspectiveCamera(48, SIM_W / SIM_H, 0.1, 200);

    // Studio 3-point lighting (HyperFrames 3d.md spec: warm key, cool rim, ambient fill)
    const ambLight = new THREE.AmbientLight(0x283c66, 1.3);
    scene.add(ambLight);

    const keyLight = new THREE.DirectionalLight(0xffeedd, 2.2);
    keyLight.position.set(12, 18, 15);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x00f5d4, 3.5, 45);
    rimLight.position.set(-12, 8, -10);
    scene.add(rimLight);

    const accentLight = new THREE.PointLight(0xff2a85, 2.8, 40);
    accentLight.position.set(10, -10, 8);
    scene.add(accentLight);

    // Global 3D floating particles
    const pGeo = new THREE.BufferGeometry();
    const pCount = 260;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (hash(i * 3.1) - 0.5) * 32;
      pPos[i * 3 + 1] = (hash(i * 7.3) - 0.5) * 32;
      pPos[i * 3 + 2] = (hash(i * 11.7) - 0.5) * 24;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x56cfe1,
      size: 0.22,
      transparent: true,
      opacity: 0.75,
    });
    particlesMesh = new THREE.Points(pGeo, pMat);
    scene.add(particlesMesh);

    buildJellyfishScene();
    buildNematocystScene();
    buildMythExplosionScene();
    buildFactShieldScene();
    buildDnaRegenScene();
  };

  // ---------------------------------------------------------------------------
  // 1. 3D BIOLUMINESCENT JELLYFISH IN DEEP OCEAN
  // ---------------------------------------------------------------------------
  function buildJellyfishScene() {
    const g = new THREE.Group();
    // Outer translucent bell
    const bellGeo = new THREE.SphereGeometry(3.2, 36, 28, 0, Math.PI * 2, 0, Math.PI * 0.62);
    const bellMat = new THREE.MeshPhongMaterial({
      color: 0x00e5ff,
      emissive: 0x004477,
      specular: 0xffffff,
      shininess: 90,
      transparent: true,
      opacity: 0.74,
      side: THREE.DoubleSide,
    });
    const bell = new THREE.Mesh(bellGeo, bellMat);
    g.add(bell);

    // Inner glowing nucleus / Immortal Jellyfish red core
    const coreGeo = new THREE.SphereGeometry(1.45, 24, 24);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0xff2a6d,
      emissive: 0xcc1144,
      shininess: 100,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 0.6;
    g.add(core);

    // Rim ring around bell bottom
    const rimGeo = new THREE.TorusGeometry(2.95, 0.14, 16, 48);
    const rimMat = new THREE.MeshBasicMaterial({ color: 0x72efdd });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = -0.55;
    g.add(rim);

    // 24 Tentacles made of articulated 3D spheres/cylinders
    const tentacles = [];
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const radius = i % 3 === 0 ? 1.6 : 2.65;
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
  // 2. 3D MICROSCOPIC SKIN & NEMATOCYST VENOM HARPOON SIMULATION
  // ---------------------------------------------------------------------------
  function buildNematocystScene() {
    const g = new THREE.Group();

    // 3D Skin Cell Layer (Hexagonal / Cellular Dermis blocks)
    const cells = [];
    const cellGeo = new THREE.CylinderGeometry(1.05, 0.95, 1.4, 6);
    for (let x = -4; x <= 4; x++) {
      for (let z = -3; z <= 3; z++) {
        const cMat = new THREE.MeshPhongMaterial({
          color: 0xe06d85,
          emissive: 0x3b121e,
          shininess: 40,
        });
        const cell = new THREE.Mesh(cellGeo, cMat);
        const px = x * 1.9 + (z % 2) * 0.95;
        const pz = z * 1.65;
        cell.position.set(px, -3.2, pz);
        g.add(cell);
        cells.push({ mesh: cell, baseX: px, baseZ: pz, idx: x * 7 + z });
      }
    }

    // 5 Nematocyst Capsules above the skin firing harpoon needles
    const capsules = [];
    const positions = [
      [0, 2.6, 0],
      [-3.2, 3.1, -1.2],
      [3.1, 2.9, -0.8],
      [-2.1, 3.4, 1.8],
      [2.4, 3.2, 1.6],
    ];
    for (let i = 0; i < positions.length; i++) {
      const capGroup = new THREE.Group();
      capGroup.position.set(...positions[i]);

      // Capsule shell
      const shellGeo = new THREE.SphereGeometry(0.95, 24, 24);
      shellGeo.scale(0.8, 1.35, 0.8);
      const shellMat = new THREE.MeshPhongMaterial({
        color: 0x00f5d4,
        emissive: 0x004455,
        transparent: true,
        opacity: 0.82,
      });
      const shell = new THREE.Mesh(shellGeo, shellMat);
      capGroup.add(shell);

      // Harpoon needle shaft firing downward
      const shaftGeo = new THREE.CylinderGeometry(0.09, 0.04, 6.2, 12);
      const shaftMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.position.y = -3.1;
      capGroup.add(shaft);

      // Glowing venom shockwave ring on skin impact
      const ringGeo = new THREE.TorusGeometry(1.1, 0.08, 12, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xffbe0b });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -5.1;
      capGroup.add(ring);

      g.add(capGroup);
      capsules.push({ group: capGroup, shell, shaft, ring, delay: i * 0.35 });
    }

    scene.add(g);
    groups.microscope_nematocyst = g;
    nematocystData = { cells, capsules };
  }

  // ---------------------------------------------------------------------------
  // 3. 3D MYTH EXPLOSION (OSM0TIC PRESSURE DETONATION - RED DANGER)
  // ---------------------------------------------------------------------------
  function buildMythExplosionScene() {
    const g = new THREE.Group();

    // Central unstable capsule core
    const coreGeo = new THREE.IcosahedronGeometry(2.2, 3);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0xff1e42,
      emissive: 0x880015,
      wireframe: false,
      shininess: 90,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    g.add(core);

    // Outer wireframe pressure cage
    const wireGeo = new THREE.IcosahedronGeometry(2.6, 2);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xffbe0b,
      wireframe: true,
    });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    g.add(wire);

    // 60 exploding venom spikes / droplets
    const shards = [];
    const shardGeo = new THREE.ConeGeometry(0.22, 0.9, 6);
    for (let i = 0; i < 60; i++) {
      const sMat = new THREE.MeshPhongMaterial({
        color: i % 2 === 0 ? 0xff0044 : 0xffbe0b,
        emissive: 0x550011,
      });
      const m = new THREE.Mesh(shardGeo, sMat);
      const theta = hash(i * 5.1) * Math.PI * 2;
      const phi = Math.acos(2 * hash(i * 9.7) - 1);
      const dir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi)
      );
      g.add(m);
      shards.push({ mesh: m, dir, speed: 2.5 + hash(i * 2.3) * 4.5 });
    }

    scene.add(g);
    groups.myth_explosion = g;
    mythData = { core, wire, shards };
  }

  // ---------------------------------------------------------------------------
  // 4. 3D FACT SHIELD / VINEGAR MOLECULAR NEUTRALIZATION (GREEN/CYAN SOLUTION)
  // ---------------------------------------------------------------------------
  function buildFactShieldScene() {
    const g = new THREE.Group();

    // Protected stabilized cell sphere
    const cellGeo = new THREE.SphereGeometry(2.1, 32, 32);
    const cellMat = new THREE.MeshPhongMaterial({
      color: 0x06d6a0,
      emissive: 0x024433,
      shininess: 100,
    });
    const cell = new THREE.Mesh(cellGeo, cellMat);
    g.add(cell);

    // Geodesic Hexagonal Molecular Shield Dome
    const shieldGeo = new THREE.IcosahedronGeometry(3.4, 2);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x00f5d4,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    g.add(shield);

    // 3 Orbiting Molecular Rings (Acetic Acid / Healing Ions)
    const rings = [];
    for (let i = 0; i < 3; i++) {
      const rGeo = new THREE.TorusGeometry(4.1 + i * 0.55, 0.08, 16, 64);
      const rMat = new THREE.MeshBasicMaterial({
        color: i === 1 ? 0x80ffdb : 0x06d6a0,
      });
      const rMesh = new THREE.Mesh(rGeo, rMat);
      g.add(rMesh);
      rings.push(rMesh);
    }

    scene.add(g);
    groups.fact_vinegar_shield = g;
    factData = { cell, shield, rings };
  }

  // ---------------------------------------------------------------------------
  // 5. 3D DNA DOUBLE HELIX & CELLULAR TRANSDIFFERENTIATION LOOP
  // ---------------------------------------------------------------------------
  function buildDnaRegenScene() {
    const g = new THREE.Group();
    const rungs = [];
    const N = 32;
    for (let i = 0; i < N; i++) {
      const y = (i - N / 2) * 0.42;
      const angle = i * 0.42;
      const r = 2.3;

      const row = new THREE.Group();
      row.position.y = y;
      row.rotation.y = angle;

      const s1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.26, 12, 12),
        new THREE.MeshPhongMaterial({ color: 0x00f5d4, emissive: 0x005544 })
      );
      s1.position.x = -r;
      row.add(s1);

      const s2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.26, 12, 12),
        new THREE.MeshPhongMaterial({ color: 0xff2a85, emissive: 0x660033 })
      );
      s2.position.x = r;
      row.add(s2);

      const bar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, r * 2, 8),
        new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x72efdd : 0xffbe0b })
      );
      bar.rotation.z = Math.PI / 2;
      row.add(bar);

      g.add(row);
      rungs.push({ row, baseAngle: angle, idx: i });
    }
    scene.add(g);
    groups.dna_regeneration = g;
    dnaData = { rungs, group: g };
  }

  // ---------------------------------------------------------------------------
  // RENDER 3D SCENE AT EXACT TIMELINE TIME t (PURE FUNCTION OF t)
  // ---------------------------------------------------------------------------
  window.renderThreeAt = function (t, lt, dur, mode) {
    if (!renderer) return null;

    // Hide all groups first
    Object.keys(groups).forEach((k) => {
      groups[k].visible = k === mode;
    });
    if (!groups[mode]) {
      groups.jellyfish_ocean.visible = true;
      mode = "jellyfish_ocean";
    }

    // Rotate ambient particle field deterministically
    if (particlesMesh) {
      particlesMesh.rotation.y = t * 0.12;
      particlesMesh.position.y = (t * 0.8) % 6 - 3;
    }

    if (mode === "jellyfish_ocean") {
      scene.background.setHex(0x040d21);
      const pulse = Math.sin(t * 4.2);
      const { bell, core, rim, tentacles } = jellyfishData;
      bell.scale.set(1 + pulse * 0.12, 1 - pulse * 0.1, 1 + pulse * 0.12);
      core.scale.setScalar(1 + Math.sin(t * 8.4) * 0.15);
      rim.scale.setScalar(1 + pulse * 0.12);

      groups.jellyfish_ocean.position.y = Math.sin(t * 2.1) * 0.8 + 0.5;
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

      // Camera flies in closer
      const camZ = lerp(14.5, 9.8, ease(clamp(lt / Math.max(1, dur), 0, 1)));
      camera.position.set(Math.sin(t * 0.4) * 2.2, 0.2 + Math.cos(t * 0.6) * 0.8, camZ);
      camera.lookAt(0, -0.8, 0);
    } else if (mode === "microscope_nematocyst") {
      scene.background.setHex(0x140718);
      const { cells, capsules } = nematocystData;

      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        c.mesh.position.y = -3.2 + Math.sin(t * 3.5 + c.idx) * 0.12;
      }

      for (let i = 0; i < capsules.length; i++) {
        const cap = capsules[i];
        const fireProg = clamp((lt - 0.5 - cap.delay) * 1.8, 0, 1);
        const recoil = Math.sin(fireProg * Math.PI) * 0.4;
        cap.shell.scale.set(0.8 + recoil * 0.3, 1.35 - fireProg * 0.25, 0.8 + recoil * 0.3);

        // Harpoon shoots down into skin
        cap.shaft.scale.y = Math.max(0.01, easeOut(fireProg));
        cap.shaft.position.y = -3.1 * easeOut(fireProg);

        // Shockwave ring expands on impact
        const ringProg = clamp((lt - 0.85 - cap.delay) * 1.4, 0, 1);
        cap.ring.scale.setScalar(0.2 + ringProg * 2.8);
        cap.ring.visible = ringProg > 0 && ringProg < 1;
      }

      const orbit = t * 0.55;
      camera.position.set(Math.sin(orbit) * 10.5, 2.2 - lt * 0.25, Math.cos(orbit) * 10.5);
      camera.lookAt(0, -1.2, 0);
    } else if (mode === "myth_explosion") {
      scene.background.setHex(0x1f050d);
      const { core, wire, shards } = mythData;
      const cycle = (lt * 0.85) % 1;
      const boom = easeOut(clamp((lt - 0.4) / 2.2, 0, 1));

      core.scale.setScalar(1 + Math.sin(t * 18) * 0.18 + boom * 0.45);
      core.rotation.x = t * 1.5;
      core.rotation.y = t * 2.1;

      wire.scale.setScalar(1.1 + boom * 1.4);
      wire.rotation.x = -t * 1.2;
      wire.rotation.z = t * 1.8;

      for (let i = 0; i < shards.length; i++) {
        const sh = shards[i];
        const dist = 1.6 + ((lt * sh.speed) % 6.5);
        sh.mesh.position.copy(sh.dir).multiplyScalar(dist);
        sh.mesh.rotation.x = t * 4 + i;
        sh.mesh.rotation.y = t * 3 + i;
      }

      camera.position.set(Math.sin(t * 0.8) * 3, Math.cos(t * 1.1) * 2, 12.5);
      camera.lookAt(0, 0, 0);
    } else if (mode === "fact_vinegar_shield") {
      scene.background.setHex(0x041b1d);
      const { cell, shield, rings } = factData;
      const shieldIn = easeOut(clamp(lt / 1.2, 0, 1));

      cell.scale.setScalar(0.9 + Math.sin(t * 3.5) * 0.06);
      shield.scale.setScalar(lerp(2.2, 1.0, shieldIn));
      shield.rotation.y = t * 0.65;
      shield.rotation.x = t * 0.35;

      rings[0].rotation.x = t * 1.4;
      rings[0].rotation.y = t * 0.8;
      rings[1].rotation.y = -t * 1.6;
      rings[1].rotation.z = t * 1.1;
      rings[2].rotation.x = Math.PI / 3 + t * 1.2;
      rings[2].rotation.z = -t * 1.3;

      camera.position.set(Math.sin(t * 0.4) * 4, 1.8, 12.8);
      camera.lookAt(0, 0, 0);
    } else if (mode === "dna_regeneration") {
      scene.background.setHex(0x060b24);
      const { rungs, group } = dnaData;
      group.rotation.y = t * 1.15;
      group.rotation.z = Math.sin(t * 0.7) * 0.18;

      for (let i = 0; i < rungs.length; i++) {
        const r = rungs[i];
        const wave = Math.sin(t * 4 + i * 0.35);
        r.row.scale.setScalar(1 + wave * 0.14);
      }

      camera.position.set(0, Math.sin(t * 0.8) * 2.5, 13.5);
      camera.lookAt(0, 0, 0);
    }

    renderer.render(scene, camera);
    return simCanvas;
  };
})();

