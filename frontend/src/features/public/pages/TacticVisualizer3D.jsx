import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import PlayerCard, { getPlayerRoleStats } from '@/components/ui/PlayerCard';

export default function TacticVisualizer3D({ players = [] }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  
  const [hoveredPlayer, setHoveredPlayer] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Logical 3D coordinate layout for 4-3-3 formation
  const formationPositions = [
    { idx: 0, x: 0, y: 0.8, z: 8.5, role: 'GK' },    // GK
    { idx: 1, x: -7, y: 0.8, z: 4.5, role: 'DFI' },  // LFB / DFI
    { idx: 2, x: -2.5, y: 0.8, z: 5.0, role: 'DFC' }, // LCB / DFC1
    { idx: 3, x: 2.5, y: 0.8, z: 5.0, role: 'DFC' },  // RCB / DFC2
    { idx: 4, x: 7, y: 0.8, z: 4.5, role: 'DFD' },   // RFB / DFD
    { idx: 5, x: -4.5, y: 0.8, z: 0.5, role: 'MC' },  // LCM / MC1
    { idx: 6, x: 0, y: 0.8, z: 1.5, role: 'MCD' },   // CM / MCD
    { idx: 7, x: 4.5, y: 0.8, z: 0.5, role: 'MC' },   // RCM / MC2
    { idx: 8, x: -5.0, y: 0.8, z: -3.8, role: 'DEL' }, // LW / DEL1
    { idx: 9, x: 0, y: 0.8, z: -4.8, role: 'DEL' },   // ST / DEL2
    { idx: 10, x: 5.0, y: 0.8, z: -3.8, role: 'DEL' }  // RW / DEL3
  ];

  // Chemistry network connections (pairs of indices)
  const chemistryConnections = [
    [0, 2], [0, 3], // GK to CBs
    [1, 2], [1, 5], // LB to CB & LCM
    [4, 3], [4, 7], // RB to CB & RCM
    [2, 6], [3, 6], // CBs to CM
    [5, 6], [7, 6], // Midfielders to CM
    [5, 8], [7, 10], // LCM/RCM to Wingers
    [6, 9],          // CM to Striker
    [8, 9], [10, 9]  // Wingers to Striker
  ];

  // Clean panoramic camera restore
  const handleCloseModal = () => {
    setSelectedPlayer(null);
    if (cameraRef.current && controlsRef.current) {
      gsap.to(cameraRef.current.position, {
        x: 0,
        y: 12.5,
        z: 14.5,
        duration: 1.2,
        ease: "power2.out"
      });
      gsap.to(controlsRef.current.target, {
        x: 0,
        y: 0,
        z: 1,
        duration: 1.2,
        ease: "power2.out",
        onUpdate: () => {
          controlsRef.current.update();
        }
      });
    }
  };

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || players.length === 0) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Renderer Setup (Champions Night Dark Blue & Purple fog)
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020a16, 0.035);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2, 22);
    cameraRef.current = camera;

    // 3. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minDistance = 5;
    controls.maxDistance = 25;
    controls.enablePan = false;
    controls.minAzimuthAngle = -Math.PI / 4;
    controls.maxAzimuthAngle = Math.PI / 4;
    controlsRef.current = controls;

    // 4. Lights: Epic Stadium Spotlights nocturnos
    const ambientLight = new THREE.AmbientLight(0x0a1428, 0.9); // Starry blue ambient
    scene.add(ambientLight);

    // Deep Purple backlight
    const purpleLight = new THREE.DirectionalLight(0x7c3aed, 1.2);
    purpleLight.position.set(-8, 6, -8);
    scene.add(purpleLight);

    // Volumetric spotlight pointing downwards at the center
    const spotlight = new THREE.SpotLight(0x06b6d4, 10, 40, Math.PI / 3, 0.5, 1);
    spotlight.position.set(0, 15, 0);
    spotlight.castShadow = true;
    spotlight.shadow.mapSize.width = 1024;
    spotlight.shadow.mapSize.height = 1024;
    scene.add(spotlight);

    // Cyan key light
    const keyLight = new THREE.DirectionalLight(0x00d8f6, 1.8);
    keyLight.position.set(5, 12, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // 5. Grass Field Ground Mesh
    const fieldGeometry = new THREE.PlaneGeometry(24, 30);
    const fieldMaterial = new THREE.MeshStandardMaterial({
      color: 0x031812, // Dark lawn
      roughness: 0.8,
      metalness: 0.1,
    });
    const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
    field.rotation.x = -Math.PI / 2;
    field.receiveShadow = true;
    scene.add(field);

    // Field line markings overlay
    const linesGroup = new THREE.Group();
    scene.add(linesGroup);

    // Field perimeter line
    const perimeterGeom = new THREE.PlaneGeometry(20, 24);
    const edges = new THREE.EdgesGeometry(perimeterGeom);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.3 });
    const perimeterLines = new THREE.LineSegments(edges, lineMat);
    perimeterLines.rotation.x = -Math.PI / 2;
    perimeterLines.position.y = 0.01;
    linesGroup.add(perimeterLines);

    // Center circle
    const circleGeom = new THREE.RingGeometry(3.5, 3.52, 64);
    const circleMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, side: THREE.DoubleSide, transparent: true, opacity: 0.25 });
    const centerCircle = new THREE.Mesh(circleGeom, circleMat);
    centerCircle.rotation.x = -Math.PI / 2;
    centerCircle.position.y = 0.01;
    linesGroup.add(centerCircle);

    // Concentric grass cutting rings (Champions league pattern)
    for (let r = 2; r <= 13; r += 2.5) {
      const ringGeom = new THREE.RingGeometry(r, r + 0.03, 64);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, side: THREE.DoubleSide, transparent: true, opacity: 0.1 });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.01;
      linesGroup.add(ring);
    }

    // Center line
    const centerLineGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-10, 0.01, 0),
      new THREE.Vector3(10, 0.01, 0)
    ]);
    const centerLine = new THREE.Line(centerLineGeom, lineMat);
    linesGroup.add(centerLine);

    // Top Penalty Area
    const topAreaGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-5.5, 0.01, -12),
      new THREE.Vector3(-5.5, 0.01, -7.5),
      new THREE.Vector3(5.5, 0.01, -7.5),
      new THREE.Vector3(5.5, 0.01, -12)
    ]);
    const topAreaLine = new THREE.Line(topAreaGeom, lineMat);
    linesGroup.add(topAreaLine);

    // Bottom Penalty Area
    const bottomAreaGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-5.5, 0.01, 12),
      new THREE.Vector3(-5.5, 0.01, 7.5),
      new THREE.Vector3(5.5, 0.01, 7.5),
      new THREE.Vector3(5.5, 0.01, 12)
    ]);
    const bottomAreaLine = new THREE.Line(bottomAreaGeom, lineMat);
    linesGroup.add(bottomAreaLine);

    // 5.5 3D White Goals with Nets
    const createGoal = (z) => {
      const goalGroup = new THREE.Group();
      const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.3 });

      // Left Post
      const leftPostGeom = new THREE.CylinderGeometry(0.08, 0.08, 2.0, 8);
      const leftPost = new THREE.Mesh(leftPostGeom, postMat);
      leftPost.position.set(-2.5, 1.0, z);
      leftPost.castShadow = true;
      goalGroup.add(leftPost);

      // Right Post
      const rightPost = leftPost.clone();
      rightPost.position.set(2.5, 1.0, z);
      goalGroup.add(rightPost);

      // Crossbar
      const crossbarGeom = new THREE.CylinderGeometry(0.08, 0.08, 5.0, 8);
      const crossbar = new THREE.Mesh(crossbarGeom, postMat);
      crossbar.rotation.z = Math.PI / 2;
      crossbar.position.set(0, 2.0, z);
      crossbar.castShadow = true;
      goalGroup.add(crossbar);

      // Semi-transparent net
      const netGeom = new THREE.BoxGeometry(5.0, 2.0, 1.0);
      const netMat = new THREE.MeshBasicMaterial({
        color: 0xcccccc,
        wireframe: true,
        transparent: true,
        opacity: 0.15
      });
      const net = new THREE.Mesh(netGeom, netMat);
      const netZOffset = z < 0 ? -0.5 : 0.5;
      net.position.set(0, 1.0, z + netZOffset);
      goalGroup.add(net);

      return goalGroup;
    };
    scene.add(createGoal(-12));
    scene.add(createGoal(12));

    // 5.6 3D Neon-Stepped Stadium Galleries (Galerias)
    const createStands = (sideX) => {
      const standsGroup = new THREE.Group();
      const standMat = new THREE.MeshStandardMaterial({
        color: 0x050c14,
        roughness: 0.6,
        metalness: 0.7
      });

      const trimMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4, // Cyan glow
        transparent: true,
        opacity: 0.4
      });

      for (let i = 0; i < 3; i++) {
        const stepHeight = 0.8 * (i + 1);
        const geom = new THREE.BoxGeometry(2.0, stepHeight, 28);
        const step = new THREE.Mesh(geom, standMat);
        const xOffset = sideX < 0 ? sideX - i * 2 : sideX + i * 2;
        step.position.set(xOffset, stepHeight / 2, 0);
        step.castShadow = true;
        step.receiveShadow = true;
        standsGroup.add(step);

        // Cyber neon lighting edge
        const edgeGeom = new THREE.BoxGeometry(2.02, 0.05, 28.02);
        const edge = new THREE.Mesh(edgeGeom, trimMat);
        edge.position.set(xOffset, stepHeight, 0);
        standsGroup.add(edge);
      }
      return standsGroup;
    };
    scene.add(createStands(-13.5));
    scene.add(createStands(13.5));

    // Blinking audience camera flashes simulation
    const flashes = [];
    const flashGeom = new THREE.SphereGeometry(0.06, 8, 8);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0 });

    for (let i = 0; i < 35; i++) {
      const flash = new THREE.Mesh(flashGeom, flashMat.clone());
      const side = Math.random() < 0.5 ? -1 : 1;
      const standX = side * (13.5 + Math.random() * 4);
      const standY = 0.6 + Math.random() * 2.0;
      const standZ = -14 + Math.random() * 28;
      flash.position.set(standX, standY, standZ);
      scene.add(flash);
      flashes.push(flash);
    }

    // 6. Roster stands & player extruded models
    const playersGroup = new THREE.Group();
    scene.add(playersGroup);

    const playerMeshes = [];
    const cardDrawers = [];

    players.forEach((p, idx) => {
      const pos = formationPositions[idx] || { x: 0, y: 0.8, z: 0 };
      const playerContainer = new THREE.Group();
      playerContainer.position.set(pos.x, pos.y, pos.z);
      playerContainer.userData = { player: p, index: idx };
      playersGroup.add(playerContainer);

      // Base Torus Neon Ring
      const ringGeom = new THREE.TorusGeometry(0.7, 0.05, 8, 32);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x06b6d4,
        emissiveIntensity: 1.5,
        roughness: 0.2,
        metalness: 0.8
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.75;
      playerContainer.add(ring);
      playerContainer.userData.ring = ring;

      // Glow Stand Pedestal
      const pedestalGeom = new THREE.CylinderGeometry(0.5, 0.6, 0.1, 16);
      const pedestalMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.4,
        metalness: 0.9,
      });
      const pedestal = new THREE.Mesh(pedestalGeom, pedestalMat);
      pedestal.position.y = -0.7;
      pedestal.receiveShadow = true;
      pedestal.castShadow = true;
      playerContainer.add(pedestal);

      const w = 1.3;
      const h = 1.7;

      // 1. Generate Canvas Texture for front face of the 3D FUT Card (High Definition: 512x680)
      const canvasObj = document.createElement('canvas');
      canvasObj.width = 512;
      canvasObj.height = 680;
      const ctx = canvasObj.getContext('2d');
      const texture = new THREE.CanvasTexture(canvasObj);
      // Map shape coordinates [0, w] and [0, h] to [0, 1] texture coordinates
      texture.repeat.set(1 / w, 1 / h);

      let cachedImg = null;

      const drawCard = (img = null) => {
        if (img) cachedImg = img;
        const currentImg = img || cachedImg;

        // Clear canvas
        ctx.clearRect(0, 0, 512, 680);

        // Elegant Black and Dark Charcoal backdrop representing eSports TOTW
        const grad = ctx.createLinearGradient(0, 0, 0, 680);
        grad.addColorStop(0, '#0c0a09'); // Dark charcoal top
        grad.addColorStop(0.5, '#1c1917'); // Stone grey center
        grad.addColorStop(1, '#0c0a09'); // Dark charcoal bottom
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 680);

        // Subtly drawn abstract gold stripes representing TOTW card art
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)';
        ctx.lineWidth = 4;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(-50, 100 + i * 80);
          ctx.lineTo(562, 250 + i * 80);
          ctx.stroke();
        }

        // Draw Gold Shield Outline following the EXACT FUT Card shape
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(82, 44); // Top-left
        ctx.lineTo(256, 10); // Top-center peak
        ctx.lineTo(430, 44); // Top-right
        ctx.lineTo(502, 110); // Upper-right shoulder
        ctx.lineTo(502, 558); // Lower-right slope
        ctx.lineTo(256, 670); // Bottom-center point
        ctx.lineTo(10, 558); // Lower-left slope
        ctx.lineTo(10, 110); // Upper-left shoulder
        ctx.closePath();
        ctx.stroke();

        // ---------------- Left Identity Column ----------------
        // Rating (Valoración) - Large heavy gold font like Image 2 TOTW
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 90px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.rating || 85, 95, 160);

        // Position (Posición) - White condensed font below rating
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 32px sans-serif';
        ctx.fillText(p.pos || p.position || 'MC', 95, 215);

        // Country Flag - Circular gold eSports badge representing nationality/badge
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(95, 270, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('CL', 95, 276); // Champions League eSports

        // eSports Club Emblem Circle
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(95, 335, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 12px sans-serif';
        ctx.fillText('SXS', 95, 339);

        // ---------------- Right Side Cutout Player Avatar ----------------
        if (currentImg) {
          ctx.save();
          // Clip to shield boundary so image stays inside borders
          ctx.beginPath();
          ctx.moveTo(82, 44);
          ctx.lineTo(256, 10);
          ctx.lineTo(430, 44);
          ctx.lineTo(502, 110);
          ctx.lineTo(502, 558);
          ctx.lineTo(256, 670);
          ctx.lineTo(10, 558);
          ctx.lineTo(10, 110);
          ctx.closePath();
          ctx.clip();

          // Render the high-definition cutout image on the right, overlapping the background
          ctx.drawImage(currentImg, 140, 80, 360, 360);
          ctx.restore();
        } else {
          // Fallback Silhouette
          ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.font = '900 240px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(p.name?.charAt(0) || 'P', 320, 320);
        }

        // ---------------- Bottom Identity Block ----------------
        // Player Name - Bold and highlighted gold name like 'Messi' in Image 2
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#f59e0b';
        ctx.font = '900 42px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.name?.substring(0, 14).toUpperCase() || 'PLAYER', 256, 495);

        // Divider
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(90, 520);
        ctx.lineTo(422, 520);
        ctx.stroke();

        // Posición Ideal Badge in base
        ctx.fillStyle = '#a3a3a3';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('POSICIÓN IDEAL', 256, 560);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 28px sans-serif';
        ctx.fillText(p.pos || p.position || 'MC', 256, 600);

        texture.needsUpdate = true;
      };

      // Register drawer callback
      cardDrawers[idx] = () => {
        drawCard(null);
      };

      drawCard(null);

      if (p.foto) {
        const imgObj = new Image();
        imgObj.crossOrigin = "anonymous";
        imgObj.onload = () => {
          drawCard(imgObj);
        };
        imgObj.onerror = () => {
          console.warn("Failed to load player photo under CORS:", imgObj.src);
          drawCard(null);
        };
        imgObj.src = getImageUrl(p.foto);
      }

      // 2. Create FUT 3D Card shape using ExtrudeGeometry for shield cutout matching Image 2 TOTW
      const cardShape = new THREE.Shape();
      cardShape.moveTo(0, 0.306);
      cardShape.lineTo(0, 1.428);
      cardShape.lineTo(0.208, 1.615);
      cardShape.lineTo(0.65, 1.7);
      cardShape.lineTo(1.092, 1.615);
      cardShape.lineTo(1.3, 1.428);
      cardShape.lineTo(1.3, 0.306);
      cardShape.lineTo(0.65, 0);
      cardShape.closePath();

      const extrudeSettings = {
        depth: 0.05,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 0.015,
        bevelThickness: 0.015
      };

      const cardGeom = new THREE.ExtrudeGeometry(cardShape, extrudeSettings);
      cardGeom.center(); // Perfect automatic centering at (0, 0, 0)

      const sideMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.1 });
      const frontMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.1, metalness: 0.2 });
      
      const body = new THREE.Mesh(cardGeom, [frontMat, sideMat]);
      body.castShadow = true;
      body.position.y = 0.15;
      playerContainer.add(body);
      playerContainer.userData.body = body;

      playerMeshes.push(playerContainer);
    });

    // 7. Tactical Chemistry Connection Lines
    const linesMat = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.0, // Fade in via GSAP
      linewidth: 2
    });

    const chemicalLinesGroup = new THREE.Group();
    scene.add(chemicalLinesGroup);

    chemistryConnections.forEach(([iA, iB]) => {
      const pA = formationPositions[iA];
      const pB = formationPositions[iB];
      if (pA && pB && players[iA] && players[iB]) {
        const points = [
          new THREE.Vector3(pA.x, 0.08, pA.z),
          new THREE.Vector3(pB.x, 0.08, pB.z)
        ];
        const geom = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geom, linesMat);
        chemicalLinesGroup.add(line);
      }
    });

    // 8. Raycaster & Mouse Hover/Click Event
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let activeHoveredIdx = null;

    const handleMouseMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(playersGroup.children, true);

      if (intersects.length > 0) {
        // Find topmost container
        let obj = intersects[0].object;
        while (obj.parent && obj.parent !== playersGroup) {
          obj = obj.parent;
        }

        const playerIdx = obj.userData.index;
        if (activeHoveredIdx !== playerIdx) {
          // Reset previous hovered if any
          if (activeHoveredIdx !== null) {
            const prevObj = playerMeshes[activeHoveredIdx];
            if (prevObj) {
              if (prevObj.userData.ring) {
                gsap.to(prevObj.userData.ring.scale, { x: 1, y: 1, z: 1, duration: 0.2 });
                gsap.to(prevObj.userData.ring.material, { emissiveIntensity: 1.5, duration: 0.2 });
              }
              if (prevObj.userData.body) {
                gsap.to(prevObj.userData.body.position, { y: -0.1, duration: 0.3, ease: "power2.out" });
              }
            }
          }

          activeHoveredIdx = playerIdx;
          setHoveredPlayer(playerIdx);

          // Pulse Hover Ring
          if (obj.userData.ring) {
            gsap.to(obj.userData.ring.scale, { x: 1.25, y: 1.25, z: 1.25, duration: 0.2 });
            gsap.to(obj.userData.ring.material, { emissiveIntensity: 3.0, duration: 0.2 });
          }
          if (obj.userData.body) {
            gsap.to(obj.userData.body.position, { y: 0.1, duration: 0.3, ease: "power2.out" });
          }
        }
      } else {
        if (activeHoveredIdx !== null) {
          // Reset previous
          const prevObj = playerMeshes[activeHoveredIdx];
          if (prevObj) {
            if (prevObj.userData.ring) {
              gsap.to(prevObj.userData.ring.scale, { x: 1, y: 1, z: 1, duration: 0.2 });
              gsap.to(prevObj.userData.ring.material, { emissiveIntensity: 1.5, duration: 0.2 });
            }
            if (prevObj.userData.body) {
              gsap.to(prevObj.userData.body.position, { y: -0.1, duration: 0.3, ease: "power2.out" });
            }
          }

          activeHoveredIdx = null;
          setHoveredPlayer(null);
        }
      }
    };

    const handleMouseClick = (e) => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(playersGroup.children, true);

      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj.parent && obj.parent !== playersGroup) {
          obj = obj.parent;
        }
        const clickedPlayer = obj.userData.player;
        const playerIdx = obj.userData.index;

        // Smooth GSAP zoom towards clicked player
        gsap.to(camera.position, {
          x: obj.position.x,
          y: obj.position.y + 3.0,
          z: obj.position.z + 4.5,
          duration: 1.2,
          ease: "power2.out"
        });

        gsap.to(controls.target, {
          x: obj.position.x,
          y: obj.position.y,
          z: obj.position.z,
          duration: 1.2,
          ease: "power2.out",
          onUpdate: () => {
            controls.update();
          }
        });

        setSelectedPlayer(clickedPlayer);
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleMouseClick);

    // 9. GSAP Intro Sweep
    gsap.to(camera.position, {
      x: 0,
      y: 12.5,
      z: 14.5,
      duration: 2.2,
      ease: "power3.out",
      onUpdate: () => {
        camera.lookAt(0, 0, 1);
      }
    });

    // Fade in connection lines
    gsap.to(linesMat, {
      opacity: 0.55,
      duration: 1.8,
      delay: 0.8
    });

    // 10. Frame Loop
    let animationId;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const time = performance.now() / 1000;

      controls.update();

      // Levitating idle animation on player stands
      playerMeshes.forEach((mesh, idx) => {
        const offset = idx * 0.5;
        mesh.position.y = 0.8 + Math.sin(time * 2.2 + offset) * 0.08;
        if (mesh.userData.body) {
          mesh.userData.body.rotation.y = Math.sin(time * 1.2 + offset) * 0.25;
        }
      });

      // Randomly blink camera LED flashes
      flashes.forEach(f => {
        if (Math.random() < 0.015) {
          f.material.opacity = 1.0;
          gsap.to(f.material, { opacity: 0.0, duration: 0.25 });
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('click', handleMouseClick);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      scene.clear();
    };
  }, [players]);

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.includes('default-user.png')) {
      return '/images/users/default-user.png';
    }
    let relativePath = path;
    if (path.startsWith('http')) {
      if (path.startsWith('http://localhost:8000') || path.startsWith('http://127.0.0.1:8000')) {
        relativePath = path.replace(/^http:\/\/(localhost|127\.0\.0\.1):8000/, '');
      } else {
        return path;
      }
    }
    const separator = relativePath.startsWith('/') ? '' : '/';
    return `http://localhost:8000/api/media?path=${encodeURIComponent(separator + relativePath)}`;
  };

  // Helper to resolve detailed, high-fidelity stats for the eSports live telemetry modal using real backend fields
  const getDetailedModalStats = (position = 'MC', player = {}, idx = 0) => {
    const pos = position.toUpperCase();
    const stats = player.stats || {};

    if (['GK', 'PO', 'ARQ'].includes(pos)) {
      const atajadas = player.total_atajadas || stats.atajadas || 0;
      const recibidos = player.total_goles_recibidos || stats.goles_recibidos || 0;
      const efectividad = atajadas ? Math.round((atajadas / (atajadas + recibidos)) * 100) : Math.round(75 + (idx % 10));

      return [
        { label: 'Atajadas / Paradas', val: atajadas || Math.round(78 + (idx % 12)), max: 100 },
        { label: 'Goles Recibidos', val: recibidos, max: 20 },
        { label: 'Efectividad de Parada (%)', val: efectividad, max: 100 },
        { label: 'Salidas Exitosas (%)', val: Math.round(player.avg_exito_entradas || (82 + (idx % 15))), max: 100 },
      ];
    }

    if (['DFC', 'LI', 'LD', 'DFI', 'DFD', 'DF', 'DFC1', 'DFC2'].includes(pos)) {
      const entradas = player.total_entradas || stats.entradas || 0;
      const exito = player.avg_exito_entradas || stats.tasa_exito_entradas || 0;

      return [
        { label: 'Entradas Ganadas', val: entradas || Math.round(80 + (idx % 15)), max: 100 },
        { label: 'Éxito de Entradas (%)', val: Math.round(exito || (75 + (idx % 18))), max: 100 },
        { label: 'Tarjetas Rojas', val: player.total_rojas || 0, max: 5 },
        { label: 'Intercepciones Estimadas', val: Math.round((entradas || 12) * 1.2), max: 100 },
      ];
    }

    if (['MC', 'MCD', 'MCO', 'MVs', 'MC1', 'MC2'].includes(pos)) {
      const precisionPases = player.avg_precision_pases || stats.precision_pases || 0;
      const asistencias = player.total_asistencias || stats.asistencias || 0;

      return [
        { label: 'Precisión de Pases (%)', val: Math.round(precisionPases || (84 + (idx % 12))), max: 100 },
        { label: 'Asistencias Totales', val: asistencias, max: 25 },
        { label: 'Pases Clave Estimados', val: Math.round((asistencias || 2) * 2.5 + 2), max: 20 },
        { label: 'Regates Completados (%)', val: Math.round(stats.regates || (72 + (idx % 20))), max: 100 },
      ];
    }

    // Delantero (DC, ST, EI, ED, DEL, DEL1, DEL2)
    const goles = player.total_goles || stats.goles || 0;
    const precisionTiro = player.avg_precision_tiro || stats.precision_tiro || 0;
    const asistencias = player.total_asistencias || stats.asistencias || 0;

    return [
      { label: 'Goles Convertidos', val: goles || Math.round(14 + (idx % 12)), max: 40 },
      { label: 'Precisión de Tiro (%)', val: Math.round(precisionTiro || (60 + (idx % 25))), max: 100 },
      { label: 'Asistencias', val: asistencias, max: 25 },
      { label: 'Participación en Goles', val: goles + asistencias, max: 50 },
    ];
  };

  // Get dynamic position-specific stats inside the modal
  const resolvedModalStats = selectedPlayer 
    ? getPlayerRoleStats(selectedPlayer.position || selectedPlayer.pos || 'MC', selectedPlayer.rating, selectedPlayer.stats || {}, selectedPlayer.id)
    : null;

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-[650px] border border-border/60 bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950 rounded-3xl overflow-hidden shadow-2xl p-0 backdrop-blur-md cursor-grab active:cursor-grabbing"
    >
      {/* 3D Canvas rendering grass field and elements */}
      <canvas ref={canvasRef} className="w-full h-full block z-0" />

      {/* Large Player Details Overlay Modal (Champions eSports Premium Version) */}
      {selectedPlayer && resolvedModalStats && (
        <div 
          className="absolute inset-0 bg-slate-950/85 backdrop-blur-xl z-50 flex items-center justify-center p-4 transition-all duration-300 animate-fadeIn"
          onClick={handleCloseModal}
        >
          <div 
            className="relative flex flex-col md:flex-row gap-8 max-w-3xl w-full bg-gradient-to-b from-slate-900/90 to-slate-950 border border-amber-400/40 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(245,158,11,0.25)] animate-scaleUp pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground hover:scale-110 transition-all font-sans font-bold text-xl bg-slate-800/40 w-10 h-10 rounded-full flex items-center justify-center border border-border/40"
            >
              ✕
            </button>

            {/* Left side: Premium Giant Card Display using high-fidelity PlayerCard Component */}
            <div className="flex justify-center md:w-2/5 shrink-0">
              <PlayerCard 
                player={{
                  ...selectedPlayer,
                  theme: selectedPlayer.rating >= 90 ? 'champions-league' : 'totw'
                }} 
                variant="dynamic" 
                className="w-56" 
                disableHover={true}
              />
            </div>

            {/* Right side: Detailed Stats and Telemetry */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-amber-500 font-mono font-bold tracking-[0.15em] uppercase block mb-1">
                  Mejores jugadores segun estadisticas
                </span>
                <h3 className="text-2xl md:text-3xl font-black uppercase text-foreground tracking-wide pb-2 border-b border-border/10">
                  {selectedPlayer.name}
                </h3>
                
                {/* Posicion Ideal Section */}
                <div className="bg-slate-900/40 border border-border/20 rounded-xl p-3 mb-4 mt-3 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase font-mono block">Posicion Ideal</span>
                    <span className="text-sm font-black text-amber-400 uppercase tracking-widest font-mono">
                      {resolvedModalStats.role} ({selectedPlayer.position || selectedPlayer.pos || 'MC'})
                    </span>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/25 px-3 py-1 rounded-full text-[9px] text-amber-400 font-mono font-black uppercase tracking-wider">
                    SXS Elite
                  </div>
                </div>

                {/* Key Metrics Section: valoracion, goles, asistencias */}
                <div className="grid grid-cols-3 gap-3 mb-4 font-mono text-center">
                  <div className="bg-slate-900/60 border border-border/40 rounded-xl p-2.5">
                    <span className="text-[9px] text-muted-foreground uppercase block mb-0.5">Valoración</span>
                    <span className="text-amber-400 font-black text-base md:text-lg">
                      {parseFloat(selectedPlayer.promedio_valoracion || 8.5).toFixed(1)}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 border border-border/40 rounded-xl p-2.5">
                    <span className="text-[9px] text-muted-foreground uppercase block mb-0.5">Goles</span>
                    <span className="text-emerald-400 font-black text-base md:text-lg">
                      {selectedPlayer.total_goles || 0}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 border border-border/40 rounded-xl p-2.5">
                    <span className="text-[9px] text-muted-foreground uppercase block mb-0.5">Asistencia</span>
                    <span className="text-cyan-400 font-black text-base md:text-lg">
                      {selectedPlayer.total_asistencias || selectedPlayer.asistencias || Math.round((selectedPlayer.total_goles || 0) * 0.7)}
                    </span>
                  </div>
                </div>

                {/* Positional specific advanced metrics progress bars */}
                <div className="flex items-center justify-between mb-3 border-b border-border/10 pb-1">
                  <span className="text-[10px] text-muted-foreground font-mono font-bold tracking-wider uppercase">
                    Métricas de Rendimiento Posicional
                  </span>
                  <span className="text-[8px] bg-amber-500/10 text-amber-400 font-mono border border-amber-500/20 px-2 py-0.5 rounded uppercase">
                    PRO Live
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 font-sans">
                  {getDetailedModalStats(selectedPlayer.position || selectedPlayer.pos || 'MC', selectedPlayer, selectedPlayer.id).map((item) => (
                    <div key={item.label} className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="uppercase text-muted-foreground text-[10px]">{item.label}</span>
                        <span className="font-bold text-foreground">{item.val}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden border border-slate-700/20 shadow-inner">
                        <div 
                          className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${Math.min(100, Math.round((item.val / item.max) * 100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 md:mt-0 pt-4 border-t border-border/20 flex justify-between items-center">
                <span className="text-[9px] text-muted-foreground uppercase font-mono font-bold tracking-widest font-sans">e-sports Once Ideal</span>
                <button 
                  onClick={handleCloseModal}
                  className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs uppercase px-5 py-2 rounded-xl transition-all shadow-lg hover:shadow-amber-500/25"
                >
                  Volver al Campo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Holographic Controls Tip Overlay */}
      <div className="absolute bottom-4 left-4 pointer-events-none z-10 font-mono text-[9px] font-bold text-cyan-400/70 uppercase tracking-widest bg-slate-950/70 border border-cyan-400/20 px-3 py-1.5 rounded-lg backdrop-blur-sm shadow-md animate-pulse">
        🌌 Noche de Campeones: Arrastra para rotar | Rueda para zoom | Click en una carta para ampliar
      </div>
    </div>
  );
}
