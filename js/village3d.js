import * as THREE from "three";

try {
    const canvas = document.querySelector("#villageCanvas");
    if (!canvas) throw new Error("Missing #villageCanvas element");
    const shell = canvas.closest(".village-shell");
    if (!shell) throw new Error("Missing .village-shell container");

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#b6e3d7");
    scene.fog = new THREE.Fog("#b6e3d7", 18, 34);

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(10, 10, 13);

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    // Lighting
    scene.add(
        new THREE.HemisphereLight("#fff4d1", "#537b40", 2.1)
    );

    const sun = new THREE.DirectionalLight("#fff0c9", 3);
    sun.position.set(-7, 13, 8);
    sun.castShadow = true;
    scene.add(sun);

    // Materials
    const material = (color, options = {}) =>
        new THREE.MeshStandardMaterial({
            color,
            roughness: 0.85,
            ...options
        });

    const grass = material("#6eb64b");
    const earth = material("#9b6236");
    const stone = material("#b9b5a1");
    const roof = material("#a9432b");
    const gold = material("#f4bd39");
    const leaves = material("#388344");
    const trunk = material("#80502c");

    const island = new THREE.Group();
    scene.add(island);

    const buildings = [];

    // Helper for creating a mesh.
    function createMesh(
        geometry,
        meshMaterial,
        x,
        y,
        z,
        parent = island
    ) {
        const object = new THREE.Mesh(geometry, meshMaterial);

        object.position.set(x, y, z);
        object.castShadow = true;
        object.receiveShadow = true;

        parent.add(object);

        return object;
    }

    // Floating island.
    createMesh(
        new THREE.CylinderGeometry(7.3, 6.5, 1, 8),
        earth,
        0, -0.55, 0
    );

    createMesh(
        new THREE.CylinderGeometry(7.3, 7.3, 0.22, 8),
        grass,
        0, -0.02, 0
    );

    // Village road.
    const road = createMesh(
        new THREE.BoxGeometry(1.15, 0.05, 9.8),
        material("#d8b477"),
        -0.15, 0.11, 0.5
    );

    road.rotation.y = -0.48;

    // Trees.
    function createTree(x, z, scale = 1) {
        const tree = new THREE.Group();

        tree.position.set(x, 0, z);
        island.add(tree);

        createMesh(
            new THREE.CylinderGeometry(
                0.12 * scale,
                0.17 * scale,
                0.72 * scale,
                7
            ),
            trunk,
            0, 0.35 * scale, 0,
            tree
        );

        createMesh(
            new THREE.ConeGeometry(0.62 * scale, 1.15 * scale, 7),
            leaves,
            0, 1.05 * scale, 0,
            tree
        );

        createMesh(
            new THREE.ConeGeometry(0.43 * scale, 0.9 * scale, 7),
            material("#55a747"),
            0, 1.55 * scale, 0,
            tree
        );
    }

    [
        [-5, -3, 1],
        [-5, 1, 0.85],
        [5, -3, 0.9],
        [5, 2, 1],
        [-3.8, 4, 0.8],
        [3.7, 4, 0.8]
    ].forEach(tree => createTree(...tree));

    // Central castle.
    createMesh(
        new THREE.BoxGeometry(1.7, 2, 1.7),
        stone,
        0, 1, -2.5
    );

    const castleRoof = createMesh(
        new THREE.ConeGeometry(1.25, 1, 4),
        roof,
        0, 2.5, -2.5
    );

    castleRoof.rotation.y = Math.PI / 4;

    // Clickable buildings connected to the project cards.
    function createHouse(x, z, projectIndex, bodyColor, roofColor) {
        const house = new THREE.Group();

        house.position.set(x, 0, z);
        island.add(house);

        createMesh(
            new THREE.BoxGeometry(1.45, 1.15, 1.3),
            material(bodyColor),
            0, 0.64, 0,
            house
        );

        const houseRoof = createMesh(
            new THREE.ConeGeometry(1.08, 0.82, 4),
            material(roofColor),
            0, 1.62, 0,
            house
        );

        houseRoof.rotation.y = Math.PI / 4;

        createMesh(
            new THREE.BoxGeometry(0.28, 0.56, 0.08),
            trunk,
            0, 0.36, 0.67,
            house
        );

        // Mark all building parts for raycasting.
        house.traverse(object => {
            if (object.isMesh) {
                object.userData.projectIndex = projectIndex;
            }
        });

        buildings.push(house);
    }

    // Generate one clickable house per portfolio project.
    const housePalette = [
        ["#d8d7c7", "#5278b9"],
        ["#e6a46b", "#4e9a58"],
        ["#e2d0a1", "#a9432b"],
        ["#c4d7e8", "#7354a6"],
        ["#d7b7a0", "#2d8b88"],
        ["#e9c5dc", "#4b6b43"]
    ];

    function clearProjectHouses() {
        for (const house of [...buildings]) {
            island.remove(house);
            house.traverse(object => {
                if (object.isMesh) {
                    object.geometry.dispose();
                    // Each house uses its own materials.
                    if (Array.isArray(object.material)) {
                        object.material.forEach(item => item.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        }
        buildings.length = 0;
    }

    function renderProjectHouses(projects = []) {
        clearProjectHouses();

        const count = projects.length;
        if (!count) return;

        // Place houses in a ring around the central castle, keeping them inside the island.
        const radius = count <= 3 ? 2.9 : Math.min(4.15, 2.3 + count * 0.18);
        projects.forEach((project, index) => {
            const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius + 0.15;
            const colors = housePalette[index % housePalette.length];

            createHouse(x, z, index, colors[0], colors[1]);
        });
    }

    // Initial render plus live updates when main.js changes the project data.
    renderProjectHouses(window.portfolioProjects || []);
    window.addEventListener("portfolio:projects-updated", event => {
        renderProjectHouses(event.detail?.projects || window.portfolioProjects || []);
    });

    // Simple stone wall around the island.
    for (let i = 0; i < 16; i++) {
        const angle = i * Math.PI / 8;

        const wall = createMesh(
            new THREE.BoxGeometry(0.62, 0.48, 0.48),
            stone,
            Math.cos(angle) * 5.55,
            0.28,
            Math.sin(angle) * 5.55
        );

        wall.rotation.y = -angle;
    }

    // Gold decorations.
    for (let i = 0; i < 7; i++) {
        const angle = i * 2.4;

        createMesh(
            new THREE.DodecahedronGeometry(0.18),
            gold,
            Math.cos(angle) * 4.4,
            0.22,
            Math.sin(angle) * 4.4
        );
    }

    // Small pond.
    const pond = createMesh(
        new THREE.CylinderGeometry(0.8, 0.8, 0.08, 24),
        material("#55bfd0"),
        -4, 0.14, 3.2
    );

    pond.scale.set(1.25, 1, 0.8);

    // Mouse interaction.
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    function resize() {
        const width = shell.clientWidth;
        const height = canvas.clientHeight;

        renderer.setSize(width, height, false);

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    new ResizeObserver(resize).observe(shell);
    resize();

    canvas.addEventListener("pointermove", event => {
        const rect = canvas.getBoundingClientRect();

        targetX = (
            (event.clientX - rect.left) / rect.width - 0.5
        ) * 0.65;

        targetY = (
            (event.clientY - rect.top) / rect.height - 0.5
        ) * 0.28;

        if (event.pointerType === "mouse") {
            pointer.x =
                ((event.clientX - rect.left) / rect.width) * 2 - 1;

            pointer.y =
                -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(pointer, camera);

            const hits = raycaster.intersectObjects(buildings, true);

            canvas.style.cursor = hits.length ? "pointer" : "grab";
        }
    });

    canvas.addEventListener("pointerleave", () => {
        targetX = 0;
        targetY = 0;
        canvas.style.cursor = "grab";
    });

    // Click a project building to open its project details.
    canvas.addEventListener("click", event => {
        const rect = canvas.getBoundingClientRect();

        pointer.x =
            ((event.clientX - rect.left) / rect.width) * 2 - 1;

        pointer.y =
            -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(pointer, camera);

        const hit = raycaster
            .intersectObjects(buildings, true)
            .find(result =>
                Number.isInteger(result.object.userData.projectIndex)
            );

        if (hit) {
            const index = hit.object.userData.projectIndex;

            document
                .querySelector(`[data-project="${index}"]`)
                ?.click();

            document.querySelector("#coins").textContent =
                (1250 + index * 150).toLocaleString("en-US");
        }
    });

    // Animation loop.
    function animate(time) {
        requestAnimationFrame(animate);

        currentX += (targetX - currentX) * 0.035;
        currentY += (targetY - currentY) * 0.035;

        camera.position.x = 10 + currentX * 5;
        camera.position.y = 10 - currentY * 3;
        camera.lookAt(0, 0.45, 0);

        island.rotation.y = Math.sin(time * 0.00018) * 0.035;

        renderer.render(scene, camera);
    }

    animate(0);

} catch (error) {
    const fallback = document.querySelector("#villageFallback");
    if (fallback) fallback.style.display = "block";
    console.warn("3D village unavailable:", error);
}
