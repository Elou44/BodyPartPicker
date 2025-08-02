import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// DOM Elements
const canvas = document.getElementById('render-canvas');
const spinButton = document.getElementById('spin-button');
const settingsButton = document.getElementById('settings-button');
const settingsModal = document.getElementById('settings-modal');
const wheelTextarea = document.getElementById('wheel-items');
const saveSettingsBtn = document.getElementById('save-settings');
const wheelCanvas = document.getElementById('spin-wheel-canvas');
const wheelContainer = document.getElementById('spin-wheel-container');
const wheelCtx = wheelCanvas.getContext('2d');

// === 3D Scene ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x242424);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 3.5;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 0.5, 1);
scene.add(directionalLight);

// === Load Model ===
const loader = new GLTFLoader();
let model = null;

loader.load(
    'human-model.glb',
    (gltf) => {
        model = gltf.scene;

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        model.traverse((child) => {
            if (child.isMesh) {
                child.geometry.translate(0, 0, 2 * size.z);
            }
        });

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.0 / maxDim;
        model.scale.set(scale, scale, scale);

        scene.add(model);
    },
    undefined,
    (error) => {
        console.error("Erreur de chargement du modèle :", error);
        alert("Impossible de charger le modèle 3D.");
    }
);

// === Spin Logic ===
spinButton.addEventListener('click', () => {
    if (spinButton.textContent === 'Reset') {
        resetGame();
        return;
    }

    if (!model) return;

    spinButton.disabled = true;

    const targetRotation = {
        x: model.rotation.x + (Math.random() + 2) * 4 * Math.PI,  // pitch
        y: model.rotation.y + (Math.random() * 4 + 4) * Math.PI, // yaw
        z: model.rotation.z + /*(Math.random() - 0.5) * 4 * Math.PI*/0
    };

    gsap.to(model.rotation, {
        x: targetRotation.x,
        y: targetRotation.y,
        z: targetRotation.z,
        duration: 10,
        ease: "power2.out",
        onComplete: () => {
            spinButton.textContent = 'Reset';
            spinButton.disabled = false;
            showAndSpinWheel();
        }
    });
});

function resetGame() {
    spinButton.textContent = 'Spin';
    wheelContainer.classList.add('hidden');
    drawWheel(); // redraw in case items changed
}

// === Spin Wheel Logic ===
let wheelItems = loadWheelItems();
let wheelAngle = 0;
let spinDuration = 7000; // ms

function drawWheel(selectedIndex = null, blink = false) {
    const items = wheelItems;
    const ctx = wheelCtx;
    const w = wheelCanvas.width;
    const h = wheelCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = w / 2;
    const innerRadius = radius * 0.4;
    const sliceAngle = (2 * Math.PI) / items.length;

    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < items.length; i++) {
        const angle = i * sliceAngle + wheelAngle;
        const color = (selectedIndex === i && blink) ? '#ffffff' : getColor(i);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, angle, angle + sliceAngle, false);
        ctx.arc(cx, cy, innerRadius, angle + sliceAngle, angle, true); // trou intérieur
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle + sliceAngle / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "white";
        ctx.font = "bold 30px sans-serif";
        ctx.fillText(items[i], radius - 10, 5);
        ctx.restore();
    }

    // Taquet (triangle en haut)
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius - 10);
    ctx.lineTo(cx - 10, cy - radius - 25);
    ctx.lineTo(cx + 10, cy - radius - 25);
    ctx.closePath();
    ctx.fillStyle = "red";
    ctx.fill();
}

function getColor(i) {
    const colors = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#e67e22', '#1abc9c', '#34495e'];
    return colors[i % colors.length];
}

function showAndSpinWheel() {
    wheelAngle = 0;
    drawWheel();
    wheelContainer.classList.remove('hidden');

    const spinTo = Math.random() * 360 + 1080; // minimum 3 tours
    const start = performance.now();

    const animate = (now) => {
        const elapsed = now - start;
        const t = Math.min(elapsed / spinDuration, 1);
        const eased = 1 - Math.pow(1 - t, 2);
        wheelAngle = (spinTo * eased * Math.PI / 180) % (2 * Math.PI);
        drawWheel();

        if (t < 1) {
            requestAnimationFrame(animate);
        } else {
            // === Fin du spin : calcul de l'élément sélectionné ===
            const spinWheelPointerAngle = -1 * (Math.PI / 2);
            const index = Math.floor((wheelItems.length - (((wheelAngle + spinWheelPointerAngle) / (2 * Math.PI)) * wheelItems.length)) % wheelItems.length);

            // === Clignotement de l'élément sélectionné ===
            let blinkCount = 0;
            const blinkInterval = setInterval(() => {
                drawWheel(index, blinkCount % 2 === 0);
                blinkCount++;
                if (blinkCount >= 6) {
                    clearInterval(blinkInterval);
                    drawWheel(index, false);
                }
            }, 250);
        }
    };

    requestAnimationFrame(animate);
}


// === Settings ===
settingsButton.addEventListener('click', () => {
    wheelTextarea.value = wheelItems.join('\n');
    settingsModal.classList.remove('hidden');
});

saveSettingsBtn.addEventListener('click', () => {
    const lines = wheelTextarea.value.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 1) {
        wheelItems = lines;
        saveWheelItems(wheelItems);
        drawWheel();
    }
    settingsModal.classList.add('hidden');
});

function saveWheelItems(items) {
    localStorage.setItem('spin-wheel-items', JSON.stringify(items));
}

function loadWheelItems() {
    const saved = localStorage.getItem('spin-wheel-items');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch {
            return ['👅','👀','👉','🐽','💋','💦'];
        }
    }
    return ['👅','👀','👉','🐽','💋','💦'];
}

// === Responsive Resize ===
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// === Animate Scene ===
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();
