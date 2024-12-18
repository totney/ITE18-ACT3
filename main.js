import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/jsm/loaders/GLTFLoader.js';

// Scene Setup for Sunny Tropical Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87cefa); // Sky blue
scene.fog = new THREE.Fog(0x87cefa, 20, 200);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(30, 20, 50);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls for user interaction
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;

// Sandy ground setup
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0xf4d9a0 }) // Sand color
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Ambient and directional lighting for the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const sunlight = new THREE.DirectionalLight(0xffe9b1, 0.6);
sunlight.position.set(50, 100, -30);
scene.add(sunlight);

// Restricted area for a central beach umbrella feature
let restrictedArea = {
  x: 0,
  z: 0,
  radius: 15
};

// Function to check if a position is outside the restricted area
function isOutsideRestrictedArea(x, z) {
  const dx = x - restrictedArea.x;
  const dz = z - restrictedArea.z;
  return Math.sqrt(dx * dx + dz * dz) >= restrictedArea.radius;
}

// Function to get a random position outside the restricted area
function getRandomPositionOutsideRestrictedArea() {
  let x, z;
  do {
    x = Math.random() * 160 - 80;
    z = Math.random() * 160 - 80;
  } while (!isOutsideRestrictedArea(x, z));
  return { x, z };
}

// Load a beach umbrella model at the center
const loader = new GLTFLoader();
loader.load(
  'https://trystan211.github.io/ITE18-JegAct4/gazebo_1.glb', 
  (gltf) => {
    const umbrella = gltf.scene;
    umbrella.position.set(restrictedArea.x, 0, restrictedArea.z);
    umbrella.scale.set(8, 8, 8);
    scene.add(umbrella);

    // Update restricted area radius based on the umbrella's size
    const boundingBox = new THREE.Box3().setFromObject(umbrella);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    restrictedArea.radius = Math.max(size.x, size.z) / 2 + 3;
    console.log(`Restricted area radius updated: ${restrictedArea.radius}`);
  },
  undefined,
  (error) => console.error('Error loading umbrella model:', error)
);

// Palm trees setup for the tropical scene
const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });

const trees = [];

for (let i = 0; i < 30; i++) {
  const position = getRandomPositionOutsideRestrictedArea();

  // Create a tree group
  const treeGroup = new THREE.Group();

  // Tree trunk
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.8, 10),
    trunkMaterial
  );
  trunk.position.set(0, 5, 0);
  treeGroup.add(trunk);

  // Palm leaves
  for (let j = 0; j < 5; j++) {
    const leaf = new THREE.Mesh(
      new THREE.ConeGeometry(4, 1, 8),
      leafMaterial
    );
    leaf.rotation.x = Math.PI / 2;
    leaf.position.set(0, 10, 0);
    leaf.rotation.z = (j * Math.PI) / 2.5;
    treeGroup.add(leaf);
  }

  // Position the tree group
  treeGroup.position.set(position.x, 0, position.z);

   // SCALE the tree group here!
  treeGroup.scale.set(2, 2, 2); // Makes all trees 2x bigger
  
  // Add tree group to the scene and store it
  scene.add(treeGroup);
  trees.push(treeGroup);
}

// Floating water droplets (particles)
const particleCount = 2000;
const particlesGeometry = new THREE.BufferGeometry();
const positions = [];
const velocities = [];

for (let i = 0; i < particleCount; i++) {
  positions.push(
    Math.random() * 200 - 100, // X
    Math.random() * 50 + 20,   // Y
    Math.random() * 200 - 100 // Z
  );
  velocities.push(0, Math.random() * -0.1, 0); // Floating effect
}

particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
particlesGeometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));

const particlesMaterial = new THREE.PointsMaterial({
  color: 0x87ceeb,
  size: 0.5,
  transparent: true,
  opacity: 0.8
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

// Raycaster for tree interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(trees, true);
  if (intersects.length > 0) {
    const treeGroup = intersects[0].object.parent;

    // Change color to white (coconut flower effect)
    treeGroup.children.forEach((child) => {
      if (child.material) {
        child.material.color.set(0xfffdd0); // Pale white
      }
    });

    // Revert color after 2 seconds
    setTimeout(() => {
      treeGroup.children.forEach((child) => {
        if (child.material) {
          child.material.color.set(
            child.geometry.type === 'ConeGeometry' ? 0x228b22 : 0x8b4513
          );
        }
      });
    }, 2000);
  }
});

// Animation loop
const clock = new THREE.Clock();

const animate = () => {
  // Update water particles
  const positions = particlesGeometry.attributes.position.array;
  const velocities = particlesGeometry.attributes.velocity.array;

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3 + 1] += velocities[i * 3 + 1];
    if (positions[i * 3 + 1] < 0) {
      positions[i * 3 + 1] = Math.random() * 50 + 20;
    }
  }

  particlesGeometry.attributes.position.needsUpdate = true;

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
