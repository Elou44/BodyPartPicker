import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ========== INITIALISATION DE LA SCÈNE 3D ==========

// 1. Éléments du DOM
const canvas = document.getElementById('render-canvas');
const spinButton = document.getElementById('spin-button');

// 2. Scène et Caméra
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0); // Fond gris clair

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 3.5; // Ajuster cette valeur selon la taille du modèle

// 3. Moteur de rendu
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Pour les écrans haute résolution

// 4. Éclairage
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Lumière ambiante douce
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Lumière directionnelle pour les ombres
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);


// ========== CHARGEMENT DU MODÈLE 3D ==========

const loader = new GLTFLoader();
let model = null; // Variable pour stocker notre mannequin

loader.load(
    'human-model.glb', // Nom du fichier du modèle
    (gltf) => {
        model = gltf.scene;

        // Centrer et redimensionner le modèle
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.0 / maxDim; // Vise une hauteur de 2 unités Three.js

        model.scale.set(scale, scale, scale);
        model.position.sub(center.multiplyScalar(scale));
        
        scene.add(model);
        console.log("Modèle chargé et centré !");
    },
    undefined, // Fonction de progression (non utilisée ici)
    (error) => {
        console.error("Une erreur est survenue lors du chargement du modèle:", error);
        alert("Impossible de charger le modèle 3D. Vérifiez que le fichier 'human-model.glb' est dans le bon dossier.");
    }
);


// ========== LOGIQUE D'INTERACTION ==========

spinButton.addEventListener('click', () => {
    if (!model) return; // Ne rien faire si le modèle n'est pas encore chargé

    // 1. Désactiver le bouton
    spinButton.disabled = true;

    // 2. Calculer une rotation cible aléatoire (plusieurs tours complets)
    const targetRotation = {
        x: model.rotation.x + (Math.random() - 0.5) * 4 * Math.PI, // Rotation aléatoire sur X
        y: model.rotation.y + (Math.random() * 4 + 4) * Math.PI, // Rotation principale sur Y (au moins 2 tours)
        z: model.rotation.z + (Math.random() - 0.5) * 4 * Math.PI  // Rotation aléatoire sur Z
    };

    // 3. Animer la rotation avec GSAP pour un effet fluide
    gsap.to(model.rotation, {
        x: targetRotation.x,
        y: targetRotation.y,
        z: targetRotation.z,
        duration: 3, // Durée de l'animation en secondes
        ease: "power2.out", // Ralentissement à la fin
        onComplete: () => {
            // 4. Réactiver le bouton une fois l'animation terminée
            spinButton.disabled = false;
        }
    });
});


// ========== GESTION DU RESPONSIVE DESIGN ==========

window.addEventListener('resize', () => {
    // Mettre à jour la taille du canvas
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Mettre à jour le ratio de la caméra
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});


// ========== BOUCLE D'ANIMATION ==========

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate(); // Démarrer la boucle de rendu