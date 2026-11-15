import * as THREE from 'three';

export interface ARPlantDefinition {
  id: string;
  name: string;
  nameVi?: string;
  nameEn?: string;
  scientificName: string;
  category: string;
  defaultHeightMeters: number;
  defaultWidthMeters: number;
  sunlight: string;
  description: string;
  icon: string;
  createModel: () => THREE.Group;
}

// Procedural texture generator for canvas-based textures (Zero 404 dependencies)
function createSoilTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#2d1f14';
  ctx.fillRect(0, 0, 128, 128);

  for (let i = 0; i < 300; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    const r = Math.random() * 2 + 0.5;
    ctx.fillStyle = Math.random() > 0.5 ? '#1f140c' : '#3d2c1e';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createTerracottaTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#b85d3b';
  ctx.fillRect(0, 0, 128, 128);

  // Subtle terracotta grain
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    ctx.fillStyle = Math.random() > 0.5 ? '#a8502f' : '#c46947';
    ctx.fillRect(x, y, 2, 2);
  }
  return new THREE.CanvasTexture(canvas);
}

// 1. Procedural Monstera Deliciosa
export function createMonsteraModel(): THREE.Group {
  const group = new THREE.Group();

  // Pot
  const potGeo = new THREE.CylinderGeometry(0.2, 0.14, 0.35, 24);
  const potMat = new THREE.MeshStandardMaterial({
    color: 0xefede8,
    roughness: 0.3,
    metalness: 0.05,
  });
  const pot = new THREE.Mesh(potGeo, potMat);
  pot.position.y = 0.175;
  pot.castShadow = true;
  pot.receiveShadow = true;
  group.add(pot);

  // Pot Rim
  const rimGeo = new THREE.TorusGeometry(0.205, 0.02, 12, 24);
  const rim = new THREE.Mesh(rimGeo, potMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.35;
  group.add(rim);

  // Soil
  const soilGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.04, 20);
  const soilMat = new THREE.MeshStandardMaterial({
    map: createSoilTexture(),
    roughness: 0.9,
    metalness: 0.0,
  });
  const soil = new THREE.Mesh(soilGeo, soilMat);
  soil.position.y = 0.33;
  soil.receiveShadow = true;
  group.add(soil);

  // Stem & Leaves
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x1e6f3d,
    roughness: 0.35,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x2d8a4e,
    roughness: 0.5,
  });

  const leafConfigs = [
    { angle: 0, height: 0.6, reach: 0.35, tilt: 0.4, scale: 0.28 },
    { angle: (Math.PI * 2) / 5, height: 0.72, reach: 0.38, tilt: 0.35, scale: 0.32 },
    { angle: (Math.PI * 4) / 5, height: 0.55, reach: 0.3, tilt: 0.45, scale: 0.25 },
    { angle: (Math.PI * 6) / 5, height: 0.8, reach: 0.42, tilt: 0.3, scale: 0.35 },
    { angle: (Math.PI * 8) / 5, height: 0.65, reach: 0.33, tilt: 0.4, scale: 0.3 },
  ];

  leafConfigs.forEach(cfg => {
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.33, 0),
      new THREE.Vector3(
        Math.cos(cfg.angle) * cfg.reach * 0.4,
        0.33 + cfg.height * 0.6,
        Math.sin(cfg.angle) * cfg.reach * 0.4
      ),
      new THREE.Vector3(
        Math.cos(cfg.angle) * cfg.reach,
        0.33 + cfg.height,
        Math.sin(cfg.angle) * cfg.reach
      ),
    ]);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 12, 0.012, 8, false);
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    stemMesh.castShadow = true;
    group.add(stemMesh);

    // Heart-shaped fenestrated leaf blade using ExtrudeGeometry
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.bezierCurveTo(0.12, 0.1, 0.2, 0.3, 0.1, 0.45);
    leafShape.bezierCurveTo(0.04, 0.52, 0, 0.6, 0, 0.65);
    leafShape.bezierCurveTo(0, 0.6, -0.04, 0.52, -0.1, 0.45);
    leafShape.bezierCurveTo(-0.2, 0.3, -0.12, 0.1, 0, 0);

    const leafGeo = new THREE.ShapeGeometry(leafShape);
    const leafMesh = new THREE.Mesh(leafGeo, leafMat);
    leafMesh.position.set(
      Math.cos(cfg.angle) * cfg.reach,
      0.33 + cfg.height,
      Math.sin(cfg.angle) * cfg.reach
    );
    leafMesh.scale.set(cfg.scale * 1.5, cfg.scale * 1.5, 1);
    leafMesh.rotation.y = cfg.angle + Math.PI / 2;
    leafMesh.rotation.x = cfg.tilt;
    leafMesh.rotation.z = Math.sin(cfg.angle) * 0.3;
    leafMesh.castShadow = true;
    group.add(leafMesh);
  });

  // Soft Contact Shadow Disc
  const shadowGeo = new THREE.CircleGeometry(0.28, 24);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.3,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  group.add(shadow);

  return group;
}

// 2. Procedural Cherry Tomato Plant
export function createTomatoModel(): THREE.Group {
  const group = new THREE.Group();

  // Terracotta Pot
  const potGeo = new THREE.CylinderGeometry(0.22, 0.15, 0.38, 24);
  const potMat = new THREE.MeshStandardMaterial({
    map: createTerracottaTexture(),
    roughness: 0.8,
  });
  const pot = new THREE.Mesh(potGeo, potMat);
  pot.position.y = 0.19;
  pot.castShadow = true;
  group.add(pot);

  // Soil
  const soilGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.04, 20);
  const soilMat = new THREE.MeshStandardMaterial({ map: createSoilTexture(), roughness: 0.95 });
  const soil = new THREE.Mesh(soilGeo, soilMat);
  soil.position.y = 0.36;
  group.add(soil);

  // Wooden Support Stakes (Bamboo tripod)
  const stakeMat = new THREE.MeshStandardMaterial({ color: 0x8a6240, roughness: 0.9 });
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const stakeGeo = new THREE.CylinderGeometry(0.008, 0.01, 1.1, 8);
    const stake = new THREE.Mesh(stakeGeo, stakeMat);
    stake.position.set(Math.cos(angle) * 0.12, 0.85, Math.sin(angle) * 0.12);
    stake.rotation.z = Math.cos(angle) * 0.06;
    stake.rotation.x = Math.sin(angle) * 0.06;
    stake.castShadow = true;
    group.add(stake);
  }

  // Tomato Stem & Foliage
  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0x2e7d32,
    roughness: 0.5,
    side: THREE.DoubleSide,
  });
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x43a047, roughness: 0.6 });

  // Central main stem
  const mainStemGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.8, 10);
  const mainStem = new THREE.Mesh(mainStemGeo, stemMat);
  mainStem.position.y = 0.72;
  mainStem.castShadow = true;
  group.add(mainStem);

  // Leaves clusters
  for (let y = 0.45; y <= 1.05; y += 0.12) {
    for (let j = 0; j < 3; j++) {
      const angle = j * ((Math.PI * 2) / 3) + y * 2;
      const leafGeo = new THREE.SphereGeometry(0.09, 8, 8);
      leafGeo.scale(1.8, 0.4, 0.9);
      const leafCluster = new THREE.Mesh(leafGeo, foliageMat);
      leafCluster.position.set(
        Math.cos(angle) * (0.16 + Math.random() * 0.06),
        y,
        Math.sin(angle) * (0.16 + Math.random() * 0.06)
      );
      leafCluster.rotation.y = angle;
      leafCluster.rotation.z = 0.2;
      leafCluster.castShadow = true;
      group.add(leafCluster);
    }
  }

  // Clusters of bright red ripe cherry tomatoes!
  const tomatoMat = new THREE.MeshStandardMaterial({
    color: 0xde2a1b,
    roughness: 0.15,
    metalness: 0.1,
  });

  const tomatoPositions = [
    { x: 0.12, y: 0.55, z: 0.08 },
    { x: 0.15, y: 0.52, z: 0.04 },
    { x: 0.10, y: 0.50, z: 0.10 },
    { x: -0.11, y: 0.68, z: 0.09 },
    { x: -0.14, y: 0.65, z: 0.06 },
    { x: 0.03, y: 0.75, z: -0.14 },
    { x: 0.07, y: 0.72, z: -0.12 },
  ];

  tomatoPositions.forEach(pos => {
    const tGeo = new THREE.SphereGeometry(0.028, 12, 12);
    const tomato = new THREE.Mesh(tGeo, tomatoMat);
    tomato.position.set(pos.x, pos.y, pos.z);
    tomato.castShadow = true;
    group.add(tomato);
  });

  // Soft Contact Shadow
  const shadowGeo = new THREE.CircleGeometry(0.26, 24);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  group.add(shadow);

  return group;
}

// 3. Procedural English Rose Bush
export function createRoseModel(): THREE.Group {
  const group = new THREE.Group();

  // Modern Glazed Ceramic Pot (Dark teal / charcoal)
  const potGeo = new THREE.CylinderGeometry(0.24, 0.18, 0.4, 24);
  const potMat = new THREE.MeshStandardMaterial({
    color: 0x1f3438,
    roughness: 0.2,
    metalness: 0.15,
  });
  const pot = new THREE.Mesh(potGeo, potMat);
  pot.position.y = 0.2;
  pot.castShadow = true;
  group.add(pot);

  // Soil
  const soilGeo = new THREE.CylinderGeometry(0.23, 0.23, 0.04, 20);
  const soilMat = new THREE.MeshStandardMaterial({ map: createSoilTexture(), roughness: 0.95 });
  const soil = new THREE.Mesh(soilGeo, soilMat);
  soil.position.y = 0.38;
  group.add(soil);

  // Bush Foliage Dome
  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0x1b5e20,
    roughness: 0.45,
    side: THREE.DoubleSide,
  });

  for (let i = 0; i < 9; i++) {
    const angle = (i * Math.PI * 2) / 9;
    const rad = 0.15 + (i % 3) * 0.06;
    const bushGeo = new THREE.DodecahedronGeometry(0.14, 1);
    const bushPart = new THREE.Mesh(bushGeo, foliageMat);
    bushPart.position.set(
      Math.cos(angle) * rad,
      0.55 + (i % 2) * 0.12,
      Math.sin(angle) * rad
    );
    bushPart.scale.set(1.2, 0.9, 1.1);
    bushPart.castShadow = true;
    group.add(bushPart);
  }

  // Rose Flowers (Layered petals)
  const roseMat = new THREE.MeshStandardMaterial({
    color: 0xe91e63, // Vibrant romantic rose pink
    roughness: 0.3,
    metalness: 0.05,
  });

  const flowerOffsets = [
    { x: 0.12, y: 0.72, z: 0.14 },
    { x: -0.16, y: 0.68, z: 0.12 },
    { x: 0.02, y: 0.82, z: -0.12 },
    { x: -0.10, y: 0.78, z: -0.08 },
    { x: 0.18, y: 0.64, z: -0.10 },
  ];

  flowerOffsets.forEach(pos => {
    const flowerGroup = new THREE.Group();
    // Inner bud
    const budGeo = new THREE.SphereGeometry(0.035, 10, 10);
    const bud = new THREE.Mesh(budGeo, roseMat);
    flowerGroup.add(bud);

    // Outer Petals
    for (let p = 0; p < 5; p++) {
      const petalGeo = new THREE.CircleGeometry(0.038, 12);
      const petal = new THREE.Mesh(petalGeo, roseMat);
      const a = (p * Math.PI * 2) / 5;
      petal.position.set(Math.cos(a) * 0.025, Math.sin(a) * 0.025, 0.005);
      petal.rotation.z = a;
      flowerGroup.add(petal);
    }

    flowerGroup.position.set(pos.x, pos.y, pos.z);
    flowerGroup.rotation.x = -0.3;
    flowerGroup.rotation.y = Math.random() * Math.PI;
    group.add(flowerGroup);
  });

  // Soft Contact Shadow
  const shadowGeo = new THREE.CircleGeometry(0.3, 24);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  group.add(shadow);

  return group;
}

// 4. Procedural Snake Plant (Sansevieria)
export function createSnakePlantModel(): THREE.Group {
  const group = new THREE.Group();

  // Slate Grey Minimalist Pot
  const potGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.42, 24);
  const potMat = new THREE.MeshStandardMaterial({
    color: 0x374151,
    roughness: 0.4,
  });
  const pot = new THREE.Mesh(potGeo, potMat);
  pot.position.y = 0.21;
  pot.castShadow = true;
  group.add(pot);

  // Soil
  const soilGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.04, 20);
  const soilMat = new THREE.MeshStandardMaterial({ map: createSoilTexture(), roughness: 0.95 });
  const soil = new THREE.Mesh(soilGeo, soilMat);
  soil.position.y = 0.40;
  group.add(soil);

  // Upright sword leaves
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x22543d,
    roughness: 0.3,
  });
  const borderMat = new THREE.MeshStandardMaterial({
    color: 0xd69e2e,
    roughness: 0.35,
  });

  const leaves = [
    { height: 0.75, angle: 0, rad: 0.04, curve: 0.04 },
    { height: 0.85, angle: 0.9, rad: 0.03, curve: -0.05 },
    { height: 0.70, angle: 1.8, rad: 0.06, curve: 0.03 },
    { height: 0.90, angle: 2.7, rad: 0.02, curve: 0.06 },
    { height: 0.65, angle: 3.8, rad: 0.05, curve: -0.04 },
    { height: 0.80, angle: 4.8, rad: 0.04, curve: 0.05 },
  ];

  leaves.forEach(l => {
    const leafGeo = new THREE.BoxGeometry(0.05, l.height, 0.012);
    // Taper top
    const pos = leafGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) > 0) {
        pos.setX(i, pos.getX(i) * 0.4);
      }
    }
    leafGeo.computeVertexNormals();

    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(
      Math.cos(l.angle) * l.rad,
      0.40 + l.height / 2,
      Math.sin(l.angle) * l.rad
    );
    leaf.rotation.y = l.angle;
    leaf.rotation.z = l.curve;
    leaf.castShadow = true;
    group.add(leaf);
  });

  // Soft Contact Shadow
  const shadowGeo = new THREE.CircleGeometry(0.24, 24);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  group.add(shadow);

  return group;
}

// 5. Procedural Japanese Bonsai Pine
export function createBonsaiModel(): THREE.Group {
  const group = new THREE.Group();

  // Oval Glazed Ceramic Bonsai Pot
  const potGeo = new THREE.CylinderGeometry(0.28, 0.22, 0.12, 24);
  potGeo.scale(1.4, 1.0, 0.9);
  const potMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a5f, // Deep indigo cobalt glaze
    roughness: 0.15,
    metalness: 0.1,
  });
  const pot = new THREE.Mesh(potGeo, potMat);
  pot.position.y = 0.08;
  pot.castShadow = true;
  group.add(pot);

  // White Decorative Gravel Top-dressing
  const gravelGeo = new THREE.CylinderGeometry(0.27, 0.27, 0.02, 24);
  gravelGeo.scale(1.38, 1.0, 0.88);
  const gravelMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9 });
  const gravel = new THREE.Mesh(gravelGeo, gravelMat);
  gravel.position.y = 0.13;
  group.add(gravel);

  // Gnarled S-curve Trunk
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.08, 0.13, 0),
    new THREE.Vector3(0.04, 0.28, 0.04),
    new THREE.Vector3(-0.06, 0.42, -0.03),
    new THREE.Vector3(0.08, 0.54, 0.02),
  ]);
  const trunkGeo = new THREE.TubeGeometry(trunkCurve, 20, 0.03, 10, false);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.castShadow = true;
  group.add(trunk);

  // Stepped Needle Clouds (Cloud Pruning)
  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0x14532d,
    roughness: 0.6,
  });

  const cloudPads = [
    { x: -0.14, y: 0.36, z: 0.06, scaleX: 0.16, scaleZ: 0.14 },
    { x: 0.16, y: 0.46, z: 0.08, scaleX: 0.18, scaleZ: 0.15 },
    { x: -0.06, y: 0.52, z: -0.10, scaleX: 0.15, scaleZ: 0.13 },
    { x: 0.08, y: 0.62, z: 0.02, scaleX: 0.20, scaleZ: 0.18 }, // Crown
  ];

  cloudPads.forEach(pad => {
    const padGeo = new THREE.SphereGeometry(0.1, 10, 8);
    padGeo.scale(pad.scaleX * 10, 3, pad.scaleZ * 10);
    const padMesh = new THREE.Mesh(padGeo, foliageMat);
    padMesh.position.set(pad.x, pad.y, pad.z);
    padMesh.castShadow = true;
    group.add(padMesh);
  });

  // Soft Contact Shadow
  const shadowGeo = new THREE.CircleGeometry(0.35, 24);
  shadowGeo.scale(1.4, 1.0, 1.0);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  group.add(shadow);

  return group;
}

// Full catalogue of AR plants
export const AR_PLANT_CATALOGUE: ARPlantDefinition[] = [
  {
    id: 'ar-monstera',
    name: 'Cây Trầu Bà Thanh Xuân (Monstera)',
    scientificName: 'Monstera deliciosa',
    category: 'indoor',
    defaultHeightMeters: 0.85,
    defaultWidthMeters: 0.65,
    sunlight: 'Tán xạ gián tiếp (Indoor / Ban công râm mát)',
    description: 'Lá xẻ thùy lớn sang trọng, lọc không khí tuyệt vời cho phòng khách và ban công.',
    icon: '🌿',
    createModel: createMonsteraModel,
  },
  {
    id: 'ar-tomato',
    name: 'Cây Cà Chua Bi Trĩu Quả',
    scientificName: 'Solanum lycopersicum var. cerasiforme',
    category: 'vegetable',
    defaultHeightMeters: 1.1,
    defaultWidthMeters: 0.55,
    sunlight: 'Nắng trực tiếp 6-8 tiếng (Sân thượng / Ban công)',
    description: 'Chùm quả đỏ mọng bóng bẩy, thích hợp trồng chậu trên giàn leo ban công đón nắng.',
    icon: '🍅',
    createModel: createTomatoModel,
  },
  {
    id: 'ar-rose',
    name: 'Cây Hoa Hồng Ngoại (English Rose)',
    scientificName: 'Rosa hybrida',
    category: 'flower',
    defaultHeightMeters: 0.85,
    defaultWidthMeters: 0.70,
    sunlight: 'Nắng toàn phần buổi sáng (Ban công Đông / Nam)',
    description: 'Hoa hồng ngoại cánh kép phớt hồng kiêu sa, thơm ngát, tán tròn xum xuê.',
    icon: '🌹',
    createModel: createRoseModel,
  },
  {
    id: 'ar-sansevieria',
    name: 'Cây Lưỡi Hổ Hoàng Kim',
    scientificName: 'Sansevieria trifasciata Laurentii',
    category: 'indoor',
    defaultHeightMeters: 0.90,
    defaultWidthMeters: 0.40,
    sunlight: 'Ưa râm hoặc nắng nhẹ (Phòng ngủ / Cửa sổ)',
    description: 'Lá vươn thẳng viền vàng kim vượng khí phong thủy, chịu hạn cực tốt và xua đuổi tà khí.',
    icon: '🪴',
    createModel: createSnakePlantModel,
  },
  {
    id: 'ar-bonsai',
    name: 'Cây Bonsai Tùng La Hán Nghệ Thuật',
    scientificName: 'Podocarpus macrophyllus Bonsai',
    category: 'bonsai',
    defaultHeightMeters: 0.65,
    defaultWidthMeters: 0.75,
    sunlight: 'Nắng nhẹ sớm (Bàn trà / Tiểu cảnh sân vườn)',
    description: 'Thân cổ thụ uốn lượn phong trần, mâm tán lá kim tầng bậc đậm chất thiền định.',
    icon: '🌲',
    createModel: createBonsaiModel,
  },
];
