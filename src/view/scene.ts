import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import RAPIER from "@dimforge/rapier3d-compat";
import { SARSEN_DENSITY, SOCKET_DEPTH, SOCKET_SPACING, STRIP } from "../sim/constants.ts";
import type { LabWorld } from "../sim/world.ts";
import type { StoneState } from "../sim/types.ts";

export interface LabView {
  sync(world: LabWorld): void;
  dispose(): void;
}

interface BodyBind {
  mesh: THREE.Mesh;
  body: RAPIER.RigidBody;
  id: string;
}

export async function createLabView(host: HTMLElement): Promise<LabView> {
  await RAPIER.init();
  const physics = new RAPIER.World({ x: 0, y: -9.81, z: 0 });

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  const w0 = Math.max(320, host.clientWidth || 800);
  const h0 = Math.max(240, host.clientHeight || 480);
  renderer.setSize(w0, h0);
  renderer.shadowMap.enabled = true;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8aa0a8);
  scene.fog = new THREE.Fog(0x8aa0a8, 90, 240);

  const camera = new THREE.PerspectiveCamera(50, w0 / h0, 0.1, 400);
  camera.position.set(STRIP.siteX - 18, 22, 36);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(STRIP.siteX, 3, 0);
  controls.update();

  scene.add(new THREE.HemisphereLight(0xf0e6d4, 0x4a4032, 0.85));
  const sun = new THREE.DirectionalLight(0xfff4dc, 1.05);
  sun.position.set(30, 50, 24);
  sun.castShadow = true;
  scene.add(sun);

  addStrip(scene, physics);
  const stones: BodyBind[] = [];
  const aframe = makeAFrame(scene);
  const cribGroup = new THREE.Group();
  scene.add(cribGroup);
  const socketMeshes = makeSocketMarkers(scene);
  const comDots: THREE.Mesh[] = [];

  const bindStone = (st: StoneState): BodyBind => {
    const geo = new THREE.BoxGeometry(st.length, st.thickness, st.width);
    const mat = new THREE.MeshStandardMaterial({
      color: st.kind === "lintel" ? 0xc4b49a : 0xa89880,
      roughness: 0.88,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    const desc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(st.position.x, 1, st.position.z);
    const body = physics.createRigidBody(desc);
    physics.createCollider(
      RAPIER.ColliderDesc.cuboid(st.length / 2, st.thickness / 2, st.width / 2).setDensity(SARSEN_DENSITY),
      body,
    );
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xaa2222 }),
    );
    scene.add(dot);
    comDots.push(dot);
    return { mesh, body, id: st.id };
  };

  let last: LabWorld | null = null;
  const sync = (world: LabWorld): void => {
    last = world;
    if (stones.length === 0) {
      for (const st of [world.uprightA, world.uprightB, world.lintel]) stones.push(bindStone(st));
    }
    const list = [world.uprightA, world.uprightB, world.lintel];
    list.forEach((st, i) => applyPose(stones[i]!, st, comDots[i]!));
    aframe.visible = world.flagsUsed.includes("R2");
    aframe.position.set(STRIP.siteX - 4, 0, -6);
    rebuildCrib(cribGroup, world.crib.height, world.crib.collapsed);
    socketMeshes[0]!.material = markerMat(world.sockets.A.packed ? 0x2f5d3a : world.sockets.A.hasRamp ? 0x6a4423 : 0x5a5348);
    socketMeshes[1]!.material = markerMat(world.sockets.B.packed ? 0x2f5d3a : world.sockets.B.hasRamp ? 0x6a4423 : 0x5a5348);
  };

  const onResize = (): void => {
    const w = Math.max(1, host.clientWidth);
    const h = Math.max(1, host.clientHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener("resize", onResize);

  let raf = 0;
  const loop = (): void => {
    physics.step();
    if (last) sync(last);
    controls.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };
  loop();

  return {
    sync,
    dispose: () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    },
  };
}

function markerMat(hex: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: hex, roughness: 0.92 });
}

function addStrip(scene: THREE.Scene, physics: RAPIER.World): void {
  const ground = physics.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(70, -0.5, 0));
  physics.createCollider(RAPIER.ColliderDesc.cuboid(80, 0.5, 18), ground);

  const zones: Array<[number, number, number]> = [
    [STRIP.quarryX, 16, 0x6b5438],
    [(STRIP.pathStartX + STRIP.pathEndX) / 2, 36, 0x7a6844],
    [STRIP.stagingX, 12, 0x8a7750],
    [STRIP.siteX, 18, 0x5d6a55],
  ];
  for (const [x, w, color] of zones) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.2, 22),
      new THREE.MeshStandardMaterial({ color, roughness: 1 }),
    );
    mesh.position.set(x, -0.05, 0);
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
  const soft = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.22, 10),
    new THREE.MeshStandardMaterial({ color: 0x3d3328, roughness: 1 }),
  );
  soft.position.set(STRIP.softPatchX, 0.02, 0);
  scene.add(soft);
}

function makeSocketMarkers(scene: THREE.Scene): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];
  for (const dz of [-SOCKET_SPACING / 2, SOCKET_SPACING / 2]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(2.4, SOCKET_DEPTH, 1.6), markerMat(0x5a5348));
    m.position.set(STRIP.siteX, -SOCKET_DEPTH / 2, dz);
    scene.add(m);
    meshes.push(m);
  }
  return meshes;
}

function makeAFrame(scene: THREE.Scene): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x8a6234, roughness: 0.8 });
  for (const z of [-1.2, 1.2]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 7, 8), mat);
    leg.position.set(0, 3.2, z);
    leg.rotation.z = z > 0 ? 0.25 : -0.25;
    g.add(leg);
  }
  g.visible = false;
  scene.add(g);
  return g;
}

function rebuildCrib(group: THREE.Group, height: number, collapsed: boolean): void {
  group.clear();
  const layers = Math.max(0, Math.round(height / 0.3));
  const mat = new THREE.MeshStandardMaterial({ color: collapsed ? 0x8a2b12 : 0x9a743f, roughness: 0.85 });
  for (let i = 0; i < layers; i++) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 3.4), mat);
    beam.position.set(STRIP.siteX + 3.2, 0.2 + i * 0.3, 0);
    beam.rotation.y = i % 2 === 0 ? 0 : 0.5;
    group.add(beam);
  }
}

function applyPose(sb: BodyBind, st: StoneState, com: THREE.Mesh): void {
  const tilt = (st.tiltDeg * Math.PI) / 180;
  const cx = st.position.x + (st.length / 2) * Math.cos(tilt);
  const cy = st.position.y + (st.length / 2) * Math.sin(tilt);
  const cz = st.position.z;
  const y = Math.max(st.thickness / 2, cy);
  sb.mesh.position.set(cx, y, cz);
  sb.mesh.rotation.set(0, 0, tilt);
  sb.body.setNextKinematicTranslation({ x: cx, y, z: cz });
  const q = new THREE.Quaternion().setFromEuler(sb.mesh.rotation);
  sb.body.setNextKinematicRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
  com.position.set(cx + st.comOffset.x, y + st.comOffset.y, cz + st.comOffset.z);
  if (st.fallen) {
    sb.mesh.material = new THREE.MeshStandardMaterial({ color: 0x8a2b12, roughness: 0.9 });
  }
}
