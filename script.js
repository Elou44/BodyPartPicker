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
let boxHelper = null;

loader.load(
    'human-model.glb', // Nom du fichier du modèle
    (gltf) => {
        model = gltf.scene;

        // --- NOUVELLE MÉTHODE DE CENTRAGE PLUS ROBUSTE ---

        // 1. On calcule la boîte qui entoure l'objet pour trouver son centre.
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());

        // On crée un assistant visuel pour la boîte et on l'ajoute à la scène.
        //const boxHelper = new THREE.Box3Helper(box, 0xffff00); // 0xffff00 est la couleur jaune
        //scene.add(boxHelper);

        // 2. On parcourt tous les éléments du modèle (car il peut y en avoir plusieurs).
       /* model.traverse((child) => {
            // 3. Si l'élément est un maillage visible (un Mesh)...
            if (child.isMesh) {
                // 4. On déplace directement sa GÉOMÉTRIE.
                // On la translate de la valeur inverse du centre.
                // Cela recentre physiquement tous les points du maillage autour de son pivot (0,0,0).
                child.geometry.translate(-center.x, -center.y, -center.z);
            }
        });*/

        const size = box.getSize(new THREE.Vector3());
        console.log(center);
        console.log(size);

        // 2. On parcourt tous les éléments du modèle (car il peut y en avoir plusieurs).
        model.traverse((child) => {
            // 3. Si l'élément est un maillage visible (un Mesh)...
            if (child.isMesh) {
                // 4. On déplace directement sa GÉOMÉTRIE.
                // On la translate de la valeur inverse du centre.
                // Cela recentre physiquement tous les points du maillage autour de son pivot (0,0,0).
                child.geometry.translate(0, 0, center.z); // X: Y:Profondeur=0 Z:
            }
        });

        // Maintenant que la géométrie est centrée, on peut redimensionner le modèle
        // pour qu'il ait une bonne taille dans la scène. L'objet "model" lui-même
        // reste à la position (0,0,0).
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.0 / maxDim;
        model.scale.set(scale, scale, scale);

         

        

        scene.add(model);


        // --- ATTACHER LA BOX AU MODÈLE (NOUVELLE MÉTHODE) ---
        // 1. On utilise BoxHelper qui prend le "model" directement en paramètre.
        boxHelper = new THREE.BoxHelper(model, 0xffff00); // Couleur jaune
        // 2. On l'ajoute à la scène.
        model.add(boxHelper); // attache le boxHelper AU modèle

        console.log("Modèle chargé et géométrie centrée !");
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
        y: model.rotation.y /*+ (Math.random() * 4 + 4) * Math.PI*/, // Rotation principale sur Y (au moins 2 tours) Yaw
        z: model.rotation.z /*+ (Math.random() - 0.5) * 4 * Math.PI*/  // Rotation aléatoire sur Z
    };

    // 3. Animer la rotation avec GSAP pour un effet fluide
    gsap.to(model.rotation, {
        x: targetRotation.x,
        y: targetRotation.y,
        z: targetRotation.z,
        duration: 10, // Durée de l'animation en secondes
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