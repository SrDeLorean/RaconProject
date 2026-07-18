import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import api from '@/api/axios';
import PlayerCard, { getPlayerRoleStats, getFUTStats, getFlagUrl, translatePosition } from '@/components/ui/PlayerCard';
import totsTemplate from '@/assets/images/cartas/tots.png';
import totwTemplate from '@/assets/images/cartas/totw.png';

export default function TacticVisualizer3D({ players = [], activeTab = 'totw', customColor = null }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  
  const [hoveredPlayer, setHoveredPlayer] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Logical 3D coordinate layout for 4-3-3 formation
  const formationPositions = [
    { idx: 0, x: 0, y: 0.8, z: 8.5, role: 'GK' },    // GK
    { idx: 1, x: -7, y: 0.8, z: 4.0, role: 'DFI' },  // LFB / DFI (more forward)
    { idx: 2, x: -2.5, y: 0.8, z: 5.2, role: 'DFC' }, // LCB / DFC1 (more backward)
    { idx: 3, x: 2.5, y: 0.8, z: 5.2, role: 'DFC' },  // RCB / DFC2 (more backward)
    { idx: 4, x: 7, y: 0.8, z: 4.0, role: 'DFD' },   // RFB / DFD (more forward)
    { idx: 5, x: -4.5, y: 0.8, z: 1.2, role: 'MC' },  // LCM / MC1 (more backward)
    { idx: 6, x: 0, y: 0.8, z: 0.0, role: 'MCD' },   // CM / MCD (more forward)
    { idx: 7, x: 4.5, y: 0.8, z: 1.2, role: 'MC' },   // RCM / MC2 (more backward)
    { idx: 8, x: -5.0, y: 0.8, z: -3.8, role: 'DEL' }, // LW / DEL1
    { idx: 9, x: 0, y: 0.8, z: -5.2, role: 'DEL' },   // ST / DEL2 (more forward)
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

    // 1. Scene & Renderer Setup (Deep Night Blue Fog)
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020612, 0.022);

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
    controls.maxDistance = 35; // Increased to allow seeing the entire stadium stands
    controls.enablePan = false;
    controls.minAzimuthAngle = -Math.PI / 4;
    controls.maxAzimuthAngle = Math.PI / 4;
    controlsRef.current = controls;

    // 4. Lights: Warm-White & Bright Floodlights (adjusted for crisp texture contrast)
    const ambientLight = new THREE.AmbientLight(0x0f172a, 0.8); // Deep night-blue ambient light
    scene.add(ambientLight);

    const floodlightLeft = new THREE.DirectionalLight(0xffffff, 1.2);
    floodlightLeft.position.set(-10, 15, -10);
    floodlightLeft.castShadow = true;
    scene.add(floodlightLeft);

    const floodlightRight = new THREE.DirectionalLight(0xffffff, 1.4);
    floodlightRight.position.set(10, 15, 10);
    floodlightRight.castShadow = true;
    scene.add(floodlightRight);

    const pitchSpot = new THREE.SpotLight(0xfffaed, 5.0, 35, Math.PI / 3, 0.6, 1);
    pitchSpot.position.set(0, 16, 0);
    pitchSpot.castShadow = true;
    scene.add(pitchSpot);

    // 5. Grass Field Ground Mesh
    const grassCanvas = document.createElement('canvas');
    grassCanvas.width = 256;
    grassCanvas.height = 512;
    const gCtx = grassCanvas.getContext('2d');
    
    // Draw base dark green
    gCtx.fillStyle = '#1b4a1e';
    gCtx.fillRect(0, 0, 256, 512);
    
    // Draw lighter stripes
    gCtx.fillStyle = '#225d26';
    const stripeHeight = 512 / 10;
    for (let i = 0; i < 10; i += 2) {
      gCtx.fillRect(0, i * stripeHeight, 256, stripeHeight);
    }
    
    // Add grass blades noise
    for (let i = 0; i < 4000; i++) {
      const rx = Math.random() * 256;
      const ry = Math.random() * 512;
      const rSize = Math.random() * 1.2 + 0.4;
      gCtx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
      gCtx.fillRect(rx, ry, rSize, rSize);
    }
    
    const grassTexture = new THREE.CanvasTexture(grassCanvas);
    grassTexture.flipY = false;
    grassTexture.premultiplyAlpha = false;
    const fieldGeometry = new THREE.PlaneGeometry(24, 30);
    const fieldMaterial = new THREE.MeshStandardMaterial({
      map: grassTexture,
      roughness: 0.95,
      metalness: 0.02,
    });
    const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
    field.rotation.x = -Math.PI / 2;
    field.receiveShadow = true;
    scene.add(field);

    // Field line markings overlay
    const linesGroup = new THREE.Group();
    scene.add(linesGroup);

    // Field perimeter line (Chalk white line)
    const perimeterGeom = new THREE.PlaneGeometry(20, 24);
    const edges = new THREE.EdgesGeometry(perimeterGeom);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65 });
    const perimeterLines = new THREE.LineSegments(edges, lineMat);
    perimeterLines.rotation.x = -Math.PI / 2;
    perimeterLines.position.y = 0.01;
    linesGroup.add(perimeterLines);

    // Center circle
    const circleGeom = new THREE.RingGeometry(3.5, 3.52, 64);
    const circleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.55 });
    const centerCircle = new THREE.Mesh(circleGeom, circleMat);
    centerCircle.rotation.x = -Math.PI / 2;
    centerCircle.position.y = 0.01;
    linesGroup.add(centerCircle);

    // Concentric grass cutting rings
    for (let r = 2; r <= 13; r += 2.5) {
      const ringGeom = new THREE.RingGeometry(r, r + 0.03, 64);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.12 });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.01;
      linesGroup.add(ring);
    }

    // Center line (halfway dividing line drawn as a flat mesh plane to ensure high visibility)
    const centerLineGeom = new THREE.PlaneGeometry(20, 0.08);
    const centerLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.55 });
    const centerLine = new THREE.Mesh(centerLineGeom, centerLineMat);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.set(0, 0.011, 0);
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

    // Top Penalty D-Arc (facing South, centered at Z = -9.5)
    const topArcGeom = new THREE.RingGeometry(3.0, 3.02, 32, 1, Math.PI + 0.65, Math.PI - 1.3);
    const topArc = new THREE.Mesh(topArcGeom, circleMat);
    topArc.rotation.x = -Math.PI / 2;
    topArc.position.set(0, 0.012, -9.5);
    linesGroup.add(topArc);

    // Bottom Penalty D-Arc (facing North, centered at Z = 9.5)
    const bottomArcGeom = new THREE.RingGeometry(3.0, 3.02, 32, 1, 0.65, Math.PI - 1.3);
    const bottomArc = new THREE.Mesh(bottomArcGeom, circleMat);
    bottomArc.rotation.x = -Math.PI / 2;
    bottomArc.position.set(0, 0.012, 9.5);
    linesGroup.add(bottomArc);

    // Quarter-circle corner arcs
    const swArcGeom = new THREE.RingGeometry(0.8, 0.82, 16, 1, 0, Math.PI / 2);
    const swArc = new THREE.Mesh(swArcGeom, circleMat);
    swArc.rotation.x = -Math.PI / 2;
    swArc.position.set(-10, 0.012, 12);
    linesGroup.add(swArc);

    const seArcGeom = new THREE.RingGeometry(0.8, 0.82, 16, 1, Math.PI / 2, Math.PI / 2);
    const seArc = new THREE.Mesh(seArcGeom, circleMat);
    seArc.rotation.x = -Math.PI / 2;
    seArc.position.set(10, 0.012, 12);
    linesGroup.add(seArc);

    const neArcGeom = new THREE.RingGeometry(0.8, 0.82, 16, 1, Math.PI, Math.PI / 2);
    const neArc = new THREE.Mesh(neArcGeom, circleMat);
    neArc.rotation.x = -Math.PI / 2;
    neArc.position.set(10, 0.012, -12);
    linesGroup.add(neArc);

    const nwArcGeom = new THREE.RingGeometry(0.8, 0.82, 16, 1, 1.5 * Math.PI, Math.PI / 2);
    const nwArc = new THREE.Mesh(nwArcGeom, circleMat);
    nwArc.rotation.x = -Math.PI / 2;
    nwArc.position.set(-10, 0.012, -12);
    linesGroup.add(nwArc);

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

    // 5.6 Create realistic Night Stadium Bowl environment (Camp Nou style)
    const createStadiumBowl = () => {
      const bowlGroup = new THREE.Group();

      // 1. Generate repeating crowd texture dynamically using a canvas
      const crowdCanvas = document.createElement('canvas');
      crowdCanvas.width = 128;
      crowdCanvas.height = 128;
      const ctx = crowdCanvas.getContext('2d');
      ctx.fillStyle = '#151b26'; // Dark seating structure base
      ctx.fillRect(0, 0, 128, 128);

      // Draw tiny multi-colored crowd pixels (spectators)
      const colors = ['#ef4444', '#fbbf24', '#3b82f6', '#10b981', '#ffffff', '#4b5563', '#1f2937'];
      for (let i = 0; i < 1500; i++) {
        const cx = Math.random() * 128;
        const cy = Math.random() * 128;
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.fillRect(cx, cy, 1.5, 1.5);
      }

      const crowdTexture = new THREE.CanvasTexture(crowdCanvas);
      crowdTexture.flipY = false;
      crowdTexture.premultiplyAlpha = false;
      crowdTexture.wrapS = THREE.RepeatWrapping;
      crowdTexture.wrapT = THREE.RepeatWrapping;
      crowdTexture.repeat.set(4, 1);

      // Stand material for the tiers
      const standMat = new THREE.MeshStandardMaterial({
        map: crowdTexture,
        roughness: 0.85,
        metalness: 0.1,
      });

      // Support structures & back walls material (dark concrete)
      const concreteMat = new THREE.MeshStandardMaterial({
        color: 0x111622,
        roughness: 0.9,
        metalness: 0.2,
      });

      // Glowing emissive floodlight bulbs material (always bright)
      const bulbMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        fog: false
      });

      // Volumetric spotlight cone geometry & material
      // We create a ConeGeometry pointing downwards (additive blending, low opacity)
      // Height of 15, tip at 0 (translated Y offset -7.5)
      const beamGeom = new THREE.ConeGeometry(0.1, 4.5, 15.0, 16, 1, true);
      beamGeom.translate(0, -7.5, 0); // Rotate/scale around tip at top

      // 36 segments distributed in an oval shape surrounding the 24x30 pitch
      const segments = 36;
      const xRadius = 18.5;
      const zRadius = 21.5;
      const tiers = 12;
      const tierD = 0.65;
      const tierH = 0.55;

      for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        // Position on the base oval
        const bx = xRadius * cosT;
        const bz = zRadius * sinT;

        const segmentGroup = new THREE.Group();
        segmentGroup.position.set(bx, 0, bz);

        // Calculate rotation angle to look at the center (0, 0, 0)
        // Since we build tiers going outwards in positive local Z direction, 
        // the front face of stands should face negative local Z direction (towards center).
        const angle = Math.atan2(bx, bz);
        segmentGroup.rotation.y = angle;

        // Build 12 tiers of stands for each segment
        for (let j = 0; j < tiers; j++) {
          const standGeom = new THREE.BoxGeometry(3.8, tierH, tierD);
          const stand = new THREE.Mesh(standGeom, standMat);
          
          // Position tier box going up and back
          stand.position.set(0, j * tierH + tierH / 2, j * tierD + tierD / 2);
          stand.castShadow = true;
          stand.receiveShadow = true;
          segmentGroup.add(stand);
        }

        // Add back barrier wall at the top tier to close the stadium bowl
        const topZ = tiers * tierD;
        const topY = tiers * tierH;
        
        const barrierGeom = new THREE.BoxGeometry(3.8, 1.8, 0.1);
        const barrier = new THREE.Mesh(barrierGeom, concreteMat);
        barrier.position.set(0, topY + 0.9, topZ + 0.05);
        barrier.castShadow = true;
        segmentGroup.add(barrier);

        // Add support structural beam/column going from ground to the top
        const columnGeom = new THREE.CylinderGeometry(0.12, 0.2, topY + 1.8, 8);
        const column = new THREE.Mesh(columnGeom, concreteMat);
        column.position.set(0, (topY + 1.8) / 2, topZ + 0.2);
        column.castShadow = true;
        segmentGroup.add(column);

        // Add cantilevered floodlight roof bar (pointing slightly inwards)
        const roofBarGeom = new THREE.BoxGeometry(0.4, 0.2, 1.8);
        const roofBar = new THREE.Mesh(roofBarGeom, concreteMat);
        roofBar.position.set(0, topY + 1.8, topZ - 0.7);
        roofBar.castShadow = true;
        segmentGroup.add(roofBar);

        // Place 4 glowing bulbs under the roof bar
        for (let b = 0; b < 4; b++) {
          const bulbGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 8);
          const bulb = new THREE.Mesh(bulbGeom, bulbMat);
          // Distribute along the roof bar (Z offset)
          const bulbZ = topZ - 0.7 - 0.6 + (b * 0.4);
          bulb.position.set(0, topY + 1.68, bulbZ);
          segmentGroup.add(bulb);
        }

        // Add beautiful transparent volumetric cone beam pointing inwards and downwards
        const beamMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.18,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false,
          fog: false // Volumetric lights ignore fog to stand out dramatically
        });
        const beam = new THREE.Mesh(beamGeom, beamMat);
        // Position at the tip of the light canopy
        beam.position.set(0, topY + 1.68, topZ - 0.8);
        
        // Tilt the beam inwards (rotate around local X-axis)
        beam.rotation.x = Math.PI / 4.5;
        segmentGroup.add(beam);

        bowlGroup.add(segmentGroup);
      }

      return bowlGroup;
    };
    scene.add(createStadiumBowl());

    // 6. Roster stands & player extruded models
    const playersGroup = new THREE.Group();
    scene.add(playersGroup);

    const playerMeshes = [];
    const cardDrawers = [];

    // Pre-load card background templates from local assets (no backend request needed)
    const totwTemplateImg = new Image();
    totwTemplateImg.src = totwTemplate;
    totwTemplateImg.onload = () => {
      cardDrawers.forEach(drawer => drawer());
    };

    const totsTemplateImg = new Image();
    totsTemplateImg.src = totsTemplate;
    totsTemplateImg.onload = () => {
      cardDrawers.forEach(drawer => drawer());
    };

    players.forEach((p, idx) => {
      const pos = formationPositions[idx] || { x: 0, y: 0.8, z: 0 };
      const playerContainer = new THREE.Group();
      playerContainer.position.set(pos.x, 0.01, pos.z);
      playerContainer.scale.set(1.65, 1.65, 1.65);
      playerContainer.userData = { player: p, index: idx };
      playersGroup.add(playerContainer);

      // Base Torus Premium Metallic Ring
      const ringGeom = new THREE.TorusGeometry(0.65, 0.02, 8, 32);
      const ringMat = new THREE.MeshStandardMaterial({
        color: customColor ? new THREE.Color(customColor) : (activeTab === 'tots' ? 0x00f3ff : 0xd4af37),
        emissive: customColor ? new THREE.Color(customColor).clone().multiplyScalar(0.2) : (activeTab === 'tots' ? 0x002c38 : 0x382c00),
        emissiveIntensity: 1.0,
        roughness: 0.2,
        metalness: 0.8,
        fog: false // Keep metallic ring emissive bright at distance
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = -Math.PI / 2;
      playerContainer.add(ring);
      playerContainer.userData.ring = ring;
      ring.position.y = 0.01;

      // Chalk White Marker Disc
      const pedestalGeom = new THREE.CylinderGeometry(0.55, 0.6, 0.08, 16);
      const pedestalMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.9,
        metalness: 0.1,
        fog: false // Keep chalk ring clear from fog
      });
      const pedestal = new THREE.Mesh(pedestalGeom, pedestalMat);
      pedestal.position.y = 0.0;
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
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.flipY = false;
      texture.premultiplyAlpha = false;
      // Map shape coordinates [0, w] and [0, h] to [0, 1] texture coordinates
      // Since flipY is false, we invert the repeat.y and set offset.y to 1 to render upright
      texture.repeat.set(1 / w, -1 / h);
      texture.offset.set(0, 1);

      let cachedImg = null;

      let loadedPlayerImg = null;
      let loadedFlagImg = null;
      let loadedBadgeImg = null;

      const drawCard = () => {
        // Clear canvas
        ctx.clearRect(0, 0, 512, 680);

        const isTOTS = activeTab === 'tots';
        const activeTemplateImg = isTOTS ? totsTemplateImg : totwTemplateImg;

        // Draw Card Background Template from pre-loaded Image
        if (activeTemplateImg.complete && activeTemplateImg.naturalWidth !== 0) {
          ctx.drawImage(activeTemplateImg, 0, 0, 512, 680);
        } else {
          // Fallback gradient while loading
          const grad = ctx.createLinearGradient(0, 0, 0, 680);
          if (isTOTS) {
            grad.addColorStop(0, '#0c183a');
            grad.addColorStop(1, '#01030e');
          } else {
            grad.addColorStop(0, '#0c0c0c');
            grad.addColorStop(1, '#080808');
          }
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 512, 680);
        }

        // ---------------- Left Identity Column (Lowered) ----------------
        // Jersey Number (Camiseta) instead of Rating
        const displayDorsal = p.dorsal || (p.contrato_activo?.dorsal) || (p.id % 99) || 10;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 90px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(displayDorsal, 120, 205);

        // Position
        ctx.fillStyle = isTOTS ? '#67e8f9' : '#d97706';
        ctx.font = '900 32px sans-serif';
        ctx.fillText(translatePosition(p.posReal || p.pos || p.position || 'MC'), 120, 255);

        // Club badge instead of generic SVG shield
        if (loadedBadgeImg) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(120, 322, 44, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(loadedBadgeImg, 76, 278, 88, 88);
          ctx.restore();
        } else {
          ctx.save();
          ctx.translate(120, 322);
          ctx.fillStyle = isTOTS ? '#22d3ee' : '#fbbf24';
          ctx.beginPath();
          ctx.moveTo(0, -35);
          ctx.lineTo(31, -20);
          ctx.lineTo(31, 19);
          ctx.lineTo(0, 35);
          ctx.lineTo(-31, 19);
          ctx.lineTo(-31, -20);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // ---------------- Right Side Cutout Player Avatar (Slightly Shrunk) ----------------
        if (loadedPlayerImg) {
          const portraitCanvas = document.createElement('canvas');
          portraitCanvas.width = 330;
          portraitCanvas.height = 330;
          const pCtx = portraitCanvas.getContext('2d');
          pCtx.drawImage(loadedPlayerImg, 0, 0, 330, 330);

          pCtx.globalCompositeOperation = 'destination-out';
          const fadeGrad = pCtx.createLinearGradient(0, 0, 0, 330);
          fadeGrad.addColorStop(0.65, 'rgba(0,0,0,0)');
          fadeGrad.addColorStop(1.0, 'rgba(0,0,0,1)');
          pCtx.fillStyle = fadeGrad;
          pCtx.fillRect(0, 0, 330, 330);
          pCtx.globalCompositeOperation = 'source-over';

          ctx.save();
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
          ctx.drawImage(portraitCanvas, 168, 95, 330, 330);
          ctx.restore();
        } else {
          // Silhouette fallback
          ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.font = '900 240px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(p.name?.charAt(0) || 'P', 320, 320);
        }

        // ---------------- Bottom Identity & Stats Block ----------------
        // Player Name (Raised & Compacted)
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 42px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.name?.substring(0, 14).toUpperCase() || 'PLAYER', 256, 438, 420);
        ctx.shadowBlur = 0;

        // Stats Values Drawing directly on background - dynamically sized layout
        const cardStats = getFUTStats(p, isTOTS);
        const colCount = cardStats.length;
        cardStats.forEach((s, sIdx) => {
          // Printable stats width margin: 12% on left/right -> starts at 62, width 390
          const statX = 62 + (390 / colCount) * sIdx + (390 / (colCount * 2));
          
          // Draw Stat Label (PAC, SHO, etc.)
          ctx.fillStyle = isTOTS ? '#67e8f9' : '#e2e8f0';
          ctx.font = '900 20px monospace';
          ctx.fillText(s.label, statX, 482);
          
          // Draw Stat Value (99)
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 36px sans-serif';
          ctx.fillText(s.val, statX, 515);
        });

        // Bottom Logos: Flag, League logo, Club badge (Raised & Compacted)
        // Country Flag (X: 175, Y: 574, W: 36, H: 22)
        if (loadedFlagImg) {
          ctx.drawImage(loadedFlagImg, 175, 574, 36, 22);
        } else {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(175, 574, 36, 22);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText('CL', 193, 589);
        }

        // League Icon (Center: X: 256, Y: 593)
        ctx.fillStyle = isTOTS ? '#22d3ee' : '#fbbf24';
        ctx.font = '22px sans-serif';
        ctx.fillText('⚽', 256, 593);

        // Club Crest (X: 306, Y: 572, W: 26, H: 26)
        if (loadedBadgeImg) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(319, 585, 13, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(loadedBadgeImg, 306, 572, 26, 26);
          ctx.restore();
        } else {
          ctx.strokeStyle = isTOTS ? '#00f3ff' : '#f59e0b';
          ctx.lineWidth = 2;
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.arc(319, 585, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 8px sans-serif';
          ctx.fillText('FC', 319, 588);
        }

        texture.needsUpdate = true;
      };

      // Register drawer callback
      cardDrawers[idx] = () => {
        drawCard();
      };

      drawCard();

      if (p.foto) {
        const imgObj = new Image();
        imgObj.crossOrigin = "anonymous";
        imgObj.onload = () => {
          loadedPlayerImg = imgObj;
          drawCard();
        };
        imgObj.onerror = () => {
          console.warn("Failed to load player photo under CORS:", imgObj.src);
          drawCard();
        };
        imgObj.src = getImageUrl(p.foto);
      }

      const resolvedFlagUrl = p.countryFlag || (p.nacionalidad ? getFlagUrl(p.nacionalidad) : null);
      if (resolvedFlagUrl) {
        const flagObj = new Image();
        flagObj.crossOrigin = "anonymous";
        flagObj.onload = () => {
          loadedFlagImg = flagObj;
          drawCard();
        };
        flagObj.onerror = () => {
          console.warn("Failed to load flag photo:", flagObj.src);
          drawCard();
        };
        flagObj.src = resolvedFlagUrl.startsWith('http') ? resolvedFlagUrl : getImageUrl(resolvedFlagUrl);
      }

      if (p.clubBadge) {
        const badgeObj = new Image();
        badgeObj.crossOrigin = "anonymous";
        badgeObj.onload = () => {
          loadedBadgeImg = badgeObj;
          drawCard();
        };
        badgeObj.src = getImageUrl(p.clubBadge, 'team');
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

      const sideMat = new THREE.MeshStandardMaterial({ 
        color: customColor ? new THREE.Color(customColor) : (activeTab === 'tots' ? 0x00d8f6 : 0xd4af37), 
        metalness: 0.9, 
        roughness: 0.15,
        transparent: true,
        opacity: 1.0,
        fog: false // Disable fog so side colors stay original independent of distance
      });
      const frontMat = new THREE.MeshBasicMaterial({ 
        map: texture, 
        transparent: true,
        alphaTest: 0.05,
        fog: false // Disable fog so card front stays bright and original independent of distance
      });
      
      const body = new THREE.Mesh(cardGeom, [frontMat, sideMat]);
      body.castShadow = true;
      body.position.y = 1.50;
      playerContainer.add(body);
      playerContainer.userData.body = body;

      playerMeshes.push(playerContainer);
    });

    // 7. Tactical Chemistry Connection Lines (Chalk line format)
    const linesMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0, // Fade in via GSAP
      linewidth: 1.5
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
                gsap.to(prevObj.userData.ring.material, { emissiveIntensity: 1.0, duration: 0.2 });
              }
            }
          }

          activeHoveredIdx = playerIdx;
          setHoveredPlayer(playerIdx);

          // Pulse Hover Ring
          if (obj.userData.ring) {
            gsap.to(obj.userData.ring.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.2 });
            gsap.to(obj.userData.ring.material, { emissiveIntensity: 2.0, duration: 0.2 });
          }
        }
      } else {
        if (activeHoveredIdx !== null) {
          // Reset previous
          const prevObj = playerMeshes[activeHoveredIdx];
          if (prevObj) {
            if (prevObj.userData.ring) {
              gsap.to(prevObj.userData.ring.scale, { x: 1, y: 1, z: 1, duration: 0.2 });
              gsap.to(prevObj.userData.ring.material, { emissiveIntensity: 1.0, duration: 0.2 });
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
        mesh.position.y = 0.01;
        
        const isHovered = (activeHoveredIdx === idx);
        let targetY = 1.50;
        if (isHovered) {
          targetY = 1.80;
        }
        
        if (mesh.userData.body) {
          const currentY = mesh.userData.body.position.y - Math.sin(time * 2.2 + offset) * 0.1;
          const newBaseY = THREE.MathUtils.lerp(currentY || 1.50, targetY, 0.15);
          
          mesh.userData.body.position.y = newBaseY + Math.sin(time * 2.2 + offset) * 0.1;
          mesh.userData.body.rotation.y = Math.sin(time * 1.2 + offset) * 0.25;
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
  }, [players, activeTab, customColor]);

  const getImageUrl = (path, type = 'user') => {
    if (!path) return null;
    if (path.includes('default-user.png') || (path === 'default.png' && type === 'user')) {
      return '/images/users/default-user.png?v=2';
    }
    if (path === 'default.png' && type === 'team') {
      return '/images/default-team-logo.svg';
    }
    const apiBaseUrl = api.defaults.baseURL || 'http://localhost:8000/api';
    const backendBaseUrl = apiBaseUrl.replace(/\/api$/, '') ;
    let relativePath = path;
    if (path.startsWith('http')) {
      if (path.startsWith('') || path.startsWith('http://127.0.0.1:8000')) {
        relativePath = path.replace(/^http:\/\/(localhost|127\.0\.0\.1):8000/, '');
      } else if (path.startsWith(backendBaseUrl)) {
        relativePath = path.substring(backendBaseUrl.length);
      } else {
        return path;
      }
    }
    const separator = relativePath.startsWith('/') ? '' : '/';
    return `${apiBaseUrl}/media?path=${encodeURIComponent(separator + relativePath)}`;
  };

  // Helper to resolve detailed, high-fidelity stats for the eSports live telemetry modal using real backend fields
  const getDetailedModalStats = (position = 'MC', player = {}, idx = 0) => {
    const pos = position.toUpperCase();
    const stats = player.stats || {};

    const isGK = ['GK', 'PO', 'ARQ', 'POR'].includes(pos);
    const isDEF = ['DFC', 'LI', 'LD', 'DFI', 'DFD', 'DF', 'DFC1', 'DFC2', 'CB', 'LB', 'RB', 'DEFENDER'].includes(pos);
    const isMID = ['MC', 'MCD', 'MCO', 'MVs', 'MC1', 'MC2', 'VOL', 'MD', 'MI', 'CM', 'CAM', 'CDM', 'LM', 'RM', 'MIDFIELDER'].includes(pos);

    if (isGK) {
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

    if (isDEF) {
      const entradas = player.total_entradas || stats.entradas_exitosas || stats.entradas || 0;
      const exito = player.avg_exito_entradas || stats.tasa_exito_entradas || 0;

      return [
        { label: 'Entradas Ganadas', val: entradas || Math.round(80 + (idx % 15)), max: 100 },
        { label: 'Éxito de Entradas (%)', val: Math.round(exito || (75 + (idx % 18))), max: 100 },
        { label: 'Tarjetas Rojas', val: player.total_rojas || 0, max: 5 },
        { label: 'Intercepciones Estimadas', val: Math.round((entradas || 12) * 1.2), max: 100 },
      ];
    }

    if (isMID) {
      const precisionPases = player.avg_precision_pases || stats.precision_pases || 0;
      const asistencias = player.total_asistencias || stats.asistencias || 0;

      return [
        { label: 'Precisión de Pases (%)', val: Math.round(precisionPases || (84 + (idx % 12))), max: 100 },
        { label: 'Asistencias Totales', val: asistencias, max: 25 },
        { label: 'Pases Clave Estimados', val: Math.round((asistencias || 2) * 2.5 + 2), max: 20 },
        { label: 'Regates Completados (%)', val: Math.round(stats.regates || (72 + (idx % 20))), max: 100 },
      ];
    }

    // Delantero (DC, ST, EI, ED, DEL, DEL1, DEL2, wingers)
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
      className="relative w-full h-[650px] border border-border/60 bg-gradient-to-b from-[#020612] via-[#040b18] to-[#020612] rounded-3xl overflow-hidden shadow-2xl p-0 backdrop-blur-md cursor-grab active:cursor-grabbing"
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
                  theme: activeTab === 'tots' ? 'champions-league' : 'totw'
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
                      {resolvedModalStats.role} ({translatePosition(selectedPlayer.position || selectedPlayer.pos || 'MC')})
                    </span>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/25 px-3 py-1 rounded-full text-[9px] text-amber-400 font-mono font-black uppercase tracking-wider">
                    PRO Elite
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
