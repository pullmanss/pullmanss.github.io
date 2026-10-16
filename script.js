// Конфигурация профиля
const GITHUB_USERNAME = 'pullmanss';

// Цвета технологий для планет
const LANG_COLORS = {
    Solidity: 0xaa00ff,
    TypeScript: 0x0099ff,
    JavaScript: 0xffdd00,
    Python: 0x33cc66,
    HTML: 0xff5500,
    CSS: 0xff00bb,
    Rust: 0xff4422,
    Shell: 0x00ffcc,
    Default: 0x00f0ff
};

let scene, camera, renderer, controls, raycaster, mouse;
let planetMeshes = [];
let hoveredMesh = null;

// Инициализация
init();
fetchGitHubData();

function init() {
    const container = document.getElementById('canvas-container');

    // 1. Сцена и камера
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030308, 0.0018);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 180, 260);

    // 2. Рендерер
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 3. Управление камерой (OrbitControls)
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 600;
    controls.minDistance = 20;

    // 4. Освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const centerLight = new THREE.PointLight(0x00ffff, 3, 400);
    scene.add(centerLight);

    // 5. Фоновые звезды
    createStarField();

    // 6. Мышь и Raycasting
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);

    document.getElementById('close-card').addEventListener('click', () => {
        document.getElementById('repo-card').classList.add('hidden');
    });

    animate();
}

// Фоновые звезды (1500 микро-частиц)
function createStarField() {
    const starGeo = new THREE.BufferGeometry();
    const count = 1500;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 1200;
        positions[i + 1] = (Math.random() - 0.5) * 800;
        positions[i + 2] = (Math.random() - 0.5) * 1200;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x557799, size: 1.5, transparent: true, opacity: 0.6 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);
}

// Запрос к живому GitHub API
async function fetchGitHubData() {
    const statsElem = document.getElementById('stats-counter');
    try {
        const res = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`);
        if (!res.ok) throw new Error('API Rate limit or user not found');
        const repos = await res.json();

        statsElem.textContent = `СИСТЕМА: ${repos.length} ПЛАНЕТ В СИСТЕМЕ`;
        buildGalaxy(repos);
    } catch (err) {
        console.warn('GitHub API fallback:', err);
        statsElem.textContent = `РЕЖИМ: ОФЛАЙН КЕШ`;
        // Демо-планеты на случай лимитов API
        buildGalaxy([
            { name: 'pullmanss.github.io', language: 'JavaScript', stargazers_count: 3, forks_count: 0, updated_at: '2025-01-01', description: 'Interactive 3D Galaxy Portfolio' },
            { name: 'defi-security-core', language: 'Solidity', stargazers_count: 12, forks_count: 2, updated_at: '2024-12-10', description: 'Smart Contract audit engines' },
            { name: 'web3-tooling', language: 'TypeScript', stargazers_count: 5, forks_count: 1, updated_at: '2024-11-20', description: 'Automation scripts and fuzzers' }
        ]);
    }
}

// Построение 3D-системы
function buildGalaxy(repos) {
    // 1. Центральное ядро (Super Core - Профиль пользователя)
    const coreGeo = new THREE.SphereGeometry(12, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // Свечение ядра
    const glowGeo = new THREE.SphereGeometry(15, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x0066aa, transparent: true, opacity: 0.35 });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glow);

    // 2. Размещение планет (репозиториев) по золотой спирали
    repos.forEach((repo, index) => {
        const angle = index * 0.85; // угол спирали
        const distance = 35 + (index * 9); // отдаление от центра

        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        const y = (Math.random() - 0.5) * 15; // легкий разброс по высоте

        const colorHex = LANG_COLORS[repo.language] || LANG_COLORS.Default;
        const size = Math.max(2.5, Math.min(6, 2.5 + (repo.stargazers_count || 0) * 0.5));

        // Геометрия планеты
        const planetGeo = new THREE.SphereGeometry(size, 16, 16);
        const planetMat = new THREE.MeshStandardMaterial({
            color: colorHex,
            emissive: colorHex,
            emissiveIntensity: 0.4,
            roughness: 0.3,
            metalness: 0.8
        });

        const planet = new THREE.Mesh(planetGeo, planetMat);
        planet.position.set(x, y, z);
        planet.userData = repo; // Сохраняем данные для клика

        // Орбитальное светящееся кольцо
        const ringGeo = new THREE.RingGeometry(distance - 0.2, distance + 0.2, 64);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x1a334d, side: THREE.DoubleSide, transparent: true, opacity: 0.2 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        scene.add(ring);

        scene.add(planet);
        planetMeshes.push(planet);
    });
}

// Обработка курсора
function onMouseMove(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planetMeshes);

    if (intersects.length > 0) {
        document.body.style.cursor = 'pointer';
        if (hoveredMesh !== intersects[0].object) {
            if (hoveredMesh) hoveredMesh.scale.set(1, 1, 1);
            hoveredMesh = intersects[0].object;
            hoveredMesh.scale.set(1.4, 1.4, 1.4);
        }
    } else {
        document.body.style.cursor = 'default';
        if (hoveredMesh) {
            hoveredMesh.scale.set(1, 1, 1);
            hoveredMesh = null;
        }
    }
}

// Клик по планете
function onClick() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planetMeshes);

    if (intersects.length > 0) {
        const repo = intersects[0].object.userData;
        showCard(repo);
    }
}

function showCard(repo) {
    const card = document.getElementById('repo-card');
    document.getElementById('card-title').textContent = repo.name;
    document.getElementById('card-desc').textContent = repo.description || 'Описание проекта отсутствует.';
    document.getElementById('card-lang').textContent = repo.language || 'UNKNOWN';
    document.getElementById('card-stars').textContent = repo.stargazers_count || 0;
    document.getElementById('card-forks').textContent = repo.forks_count || 0;
    document.getElementById('card-date').textContent = new Date(repo.updated_at).toLocaleDateString();
    document.getElementById('card-link').href = repo.html_url || `https://github.com/${GITHUB_USERNAME}/${repo.name}`;

    card.classList.remove('hidden');
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Цикл рендеринга и вращения
function animate() {
    requestAnimationFrame(animate);

    // Медленное фоновое вращение планет
    planetMeshes.forEach((mesh, idx) => {
        mesh.rotation.y += 0.01;
    });

    controls.update();
    renderer.render(scene, camera);
}