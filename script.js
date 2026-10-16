const GITHUB_USERNAME = 'pullmanss';
let allRepos = [];

// 1. Старт при загрузке
document.addEventListener('DOMContentLoaded', () => {
    startClock();
    initCanvasParticles();
    loadGitHubData();

    // Живой поиск
    document.getElementById('search-input').addEventListener('input', (e) => {
        filterRepos(e.target.value.toLowerCase());
    });
});

// 2. Живые часы UTC
function startClock() {
    const clockEl = document.getElementById('clock');
    setInterval(() => {
        const now = new Date();
        clockEl.textContent = now.toUTCString().split(' ')[4] + ' UTC';
    }, 1000);
}

// 3. Загрузка данных с GitHub API
async function loadGitHubData() {
    try {
        // Данные профиля
        const userRes = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}`);
        if (userRes.ok) {
            const user = await userRes.json();
            document.getElementById('user-name').textContent = user.name || user.login;
            document.getElementById('followers-count').textContent = user.followers;
            document.getElementById('avatar').src = user.avatar_url;
        }

        // Репозитории
        const repoRes = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`);
        if (!repoRes.ok) throw new Error('API Rate limit');
        allRepos = await repoRes.json();

        document.getElementById('repo-count').textContent = allRepos.length;
        renderRepos(allRepos);

    } catch (err) {
        console.warn('GitHub API rate limit, using fallback', err);
        // Фолбэк-данные, если сеть или лимиты API ограничены
        allRepos = [
            { name: 'pullmanss.github.io', language: 'JavaScript', stargazers_count: 5, description: 'Personal Cyberpunk Developer Hub & Portfolio', html_url: `https://github.com/${GITHUB_USERNAME}/pullmanss.github.io` },
            { name: 'smart-contracts-sec', language: 'Solidity', stargazers_count: 14, description: 'DeFi security research, invariant fuzzing suite and audit checklist', html_url: '#' },
            { name: 'web3-tooling', language: 'TypeScript', stargazers_count: 8, description: 'High-speed EVM transaction decoder and calldata analyzer', html_url: '#' }
        ];
        document.getElementById('repo-count').textContent = allRepos.length;
        renderRepos(allRepos);
    }
}

// 4. Отрисовка карточек проектов
function renderRepos(repos) {
    const container = document.getElementById('projects-container');
    container.innerHTML = '';

    if (repos.length === 0) {
        container.innerHTML = '<div class="loading-state">РЕПОЗИТОРИИ НЕ НАЙДЕНЫ</div>';
        return;
    }

    repos.forEach(repo => {
        const card = document.createElement('div');
        card.className = 'repo-card';
        card.innerHTML = `
      <div>
        <div class="card-top">
          <h3 class="repo-name">${repo.name}</h3>
          <span class="repo-lang">${repo.language || 'Code'}</span>
        </div>
        <p class="repo-desc">${repo.description || 'Описание проекта пока не добавлено.'}</p>
      </div>
      <div class="card-bottom">
        <span>★ ${repo.stargazers_count || 0}</span>
        <a href="${repo.html_url}" target="_blank">СМОТРЕТЬ КОД →</a>
      </div>
    `;
        container.appendChild(card);
    });
}

// 5. Фильтрация поиска
function filterRepos(query) {
    const filtered = allRepos.filter(r =>
        r.name.toLowerCase().includes(query) ||
        (r.language && r.language.toLowerCase().includes(query)) ||
        (r.description && r.description.toLowerCase().includes(query))
    );
    renderRepos(filtered);
}

// 6. Интерактивные частицы на чистом Canvas (без Three.js)
function initCanvasParticles() {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let width, height, particles;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        particles = Array.from({ length: 65 }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            size: Math.random() * 2 + 1
        }));
    }

    window.addEventListener('resize', resize);
    resize();

    function animate() {
        ctx.clearRect(0, 0, width, height);

        ctx.fillStyle = '#00f0ff';
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

            // Линии между близкими частицами
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                if (dist < 130) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
}