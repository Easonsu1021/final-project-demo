import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

function PlateViewer() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 360;
    let height = container.clientHeight || 240;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040807);
    scene.fog = new THREE.Fog(0x060c18, 45, 160);

    const aspect = width / height;
    const d = 10;
    const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1200);
    camera.position.set(32, 16, 22);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.55;
    controls.enableZoom = true;
    controls.maxDistance = 160;
    controls.minDistance = 30;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xe9eef6, 0.5);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x244034, 0x050805, 0.4);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xf9fafc, 1.7);
    dirLight.position.set(30, 48, 18);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 300;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0xfff0c5, 0.9);
    rimLight.position.set(-22, 24, -16);
    rimLight.castShadow = false;
    scene.add(rimLight);

    // --- Generation ---
    const BOARD_SIZE = 60;
    const VOXEL_SIZE = 1;
    const GAP = 0.05;
    const GRID_SCALE = VOXEL_SIZE + GAP;

    const PALETTE = {
      BOARD: { color: 0x0f241c, rough: 0.85, metal: 0.08, emissive: 0x0a160f, emissiveIntensity: 0.06 },
      CHIP: { color: 0x1a1b1f, rough: 0.55, metal: 0.15, emissive: 0x0f1014, emissiveIntensity: 0.08 },
      PIN: { color: 0xf6f7f8, rough: 0.12, metal: 0.92, emissive: 0xcfd3d8, emissiveIntensity: 0.07 },
      TRACE: { color: 0xf0c33c, rough: 0.2, metal: 0.82, emissive: 0xffd766, emissiveIntensity: 0.22 },
      CAP: { color: 0xc0b08f, rough: 0.4, metal: 0.08, emissive: 0x9f9070, emissiveIntensity: 0.05 },
      BLUE: { color: 0x597f9f, rough: 0.42, metal: 0.18, emissive: 0x6b93b5, emissiveIntensity: 0.12 },
      LABEL: { color: 0xffffff, rough: 0.9, metal: 0.0 }
    };

    const grid = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
    const voxelData = [];

    const isFree = (x, z, w, h) => {
      if (x < 0 || z < 0 || x + w > BOARD_SIZE || z + h > BOARD_SIZE) return false;
      for (let i = x; i < x + w; i++) {
        for (let j = z; j < z + h; j++) {
          if (grid[i][j] !== 0) return false;
        }
      }
      return true;
    };

    const markOccupied = (x, z, w, h, id = 1) => {
      for (let i = x; i < x + w; i++) {
        for (let j = z; j < z + h; j++) {
          grid[i][j] = id;
        }
      }
    };

    const addVoxel = (x, y, z, typeKey) => {
      voxelData.push({ x, y, z, type: typeKey });
    };

    // Base board
    for (let x = 0; x < BOARD_SIZE; x++) {
      for (let z = 0; z < BOARD_SIZE; z++) {
        addVoxel(x, 0, z, 'BOARD');
      }
    }

    // Large chips
    for (let i = 0; i < 5; i++) {
      let w = 6 + Math.floor(Math.random() * 6);
      let h = w;
      let x = Math.floor(Math.random() * (BOARD_SIZE - w));
      let z = Math.floor(Math.random() * (BOARD_SIZE - h));

      if (isFree(x, z, w, h)) {
        markOccupied(x, z, w, h);
        for (let dx = 0; dx < w; dx++) {
          for (let dz = 0; dz < h; dz++) {
            const isEdge = dx === 0 || dx === w - 1 || dz === 0 || dz === h - 1;
            if (isEdge) {
              addVoxel(x + dx, 1, z + dz, 'PIN');
            } else {
              addVoxel(x + dx, 1, z + dz, 'CHIP');
              addVoxel(x + dx, 2, z + dz, 'CHIP');
            }
          }
        }
        addVoxel(x + 2, 3, z + 2, 'CHIP');
      }
    }

    // Rectangular chips
    for (let i = 0; i < 15; i++) {
      let w = 3;
      let h = 6 + Math.floor(Math.random() * 4);
      if (Math.random() > 0.5) [w, h] = [h, w];

      let x = Math.floor(Math.random() * (BOARD_SIZE - w));
      let z = Math.floor(Math.random() * (BOARD_SIZE - h));

      if (isFree(x, z, w, h)) {
        markOccupied(x, z, w, h);
        for (let dx = 0; dx < w; dx++) {
          for (let dz = 0; dz < h; dz++) {
            const isEdge = dx === 0 || dx === w - 1 || dz === 0 || dz === h - 1;
            if (isEdge && (dx + dz) % 2 !== 0) {
              addVoxel(x + dx, 1, z + dz, 'PIN');
            } else if (!isEdge) {
              addVoxel(x + dx, 1, z + dz, 'CHIP');
            }
          }
        }
      }
    }

    // Caps / small components
    for (let i = 0; i < 30; i++) {
      const x = Math.floor(Math.random() * (BOARD_SIZE - 2));
      const z = Math.floor(Math.random() * (BOARD_SIZE - 2));
      if (isFree(x, z, 2, 1)) {
        markOccupied(x, z, 2, 1);
        const type = Math.random() > 0.5 ? 'CAP' : 'BLUE';
        addVoxel(x, 1, z, 'PIN');
        addVoxel(x + 1, 1, z, 'PIN');
        addVoxel(x, 2, z, type);
        addVoxel(x + 1, 2, z, type);
      }
    }

    // Traces (random walkers)
    const NUM_WALKERS = 40;
    for (let i = 0; i < NUM_WALKERS; i++) {
      let cx = Math.floor(Math.random() * BOARD_SIZE);
      let cz = Math.floor(Math.random() * BOARD_SIZE);
      let dir = Math.floor(Math.random() * 4);
      let length = 5 + Math.floor(Math.random() * 20);
      for (let step = 0; step < length; step++) {
        if (cx < 0 || cz < 0 || cx >= BOARD_SIZE || cz >= BOARD_SIZE) break;
        if (grid[cx][cz] === 0) {
          addVoxel(cx, 1, cz, 'TRACE');
          grid[cx][cz] = 2;
        }
        if (dir === 0) cz--;
        else if (dir === 1) cx++;
        else if (dir === 2) cz++;
        else if (dir === 3) cx--;
        if (Math.random() < 0.2) {
          dir = (dir + (Math.random() > 0.5 ? 1 : 3)) % 4;
        }
      }
    }

    // --- Mesh construction ---
    const typeBuckets = {};
    voxelData.forEach((v) => {
      if (!typeBuckets[v.type]) typeBuckets[v.type] = [];
      typeBuckets[v.type].push(v);
    });

    const geometry = new RoundedBoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE, 2, 0.15);
    const group = new THREE.Group();
    group.position.set(-(BOARD_SIZE * GRID_SCALE) / 2, 0, -(BOARD_SIZE * GRID_SCALE) / 2);
    scene.add(group);

    const dummy = new THREE.Object3D();
    const materials = [];
    const meshes = [];

    Object.keys(typeBuckets).forEach((key) => {
      const voxels = typeBuckets[key];
      const matProps = PALETTE[key];
      const material = new THREE.MeshStandardMaterial({
        color: matProps.color,
        roughness: matProps.rough,
        metalness: matProps.metal,
        emissive: matProps.emissive ? new THREE.Color(matProps.emissive) : undefined,
        emissiveIntensity: matProps.emissiveIntensity ?? 0
      });
      materials.push(material);

      const mesh = new THREE.InstancedMesh(geometry, material, voxels.length);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      voxels.forEach((v, i) => {
        dummy.position.set(v.x * GRID_SCALE, v.y * GRID_SCALE, v.z * GRID_SCALE);
        if (key === 'TRACE') {
          dummy.scale.set(1, 0.2, 1);
          dummy.position.y -= GRID_SCALE * 0.4;
        } else {
          dummy.scale.set(1, 1, 1);
        }
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });

      meshes.push(mesh);
      group.add(mesh);
    });

    // --- Animation ---
    let animationId = null;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handling
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || width;
      height = container.clientHeight || height;
      const nextAspect = width / height;
      camera.left = -d * nextAspect;
      camera.right = d * nextAspect;
      camera.top = d;
      camera.bottom = -d;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      controls.dispose();
      geometry.dispose();
      materials.forEach((m) => m.dispose());
      meshes.forEach((m) => m.dispose());
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="panel voxel-panel">
      <div className="voxel-canvas" ref={mountRef} />
    </div>
  );
}

export default PlateViewer;
