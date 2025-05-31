const toggleDarkBtn = document.getElementById('toggleDark');
toggleDarkBtn.addEventListener('click', () => {
  document.documentElement.classList.toggle('dark');
  toggleDarkBtn.textContent = document.documentElement.classList.contains('dark') ? 'Light Mode' : 'Dark Mode';
});

const form = document.getElementById('userForm');
const input = document.getElementById('usernameInput');
const loading = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const profileSection = document.getElementById('profile');
const chartsSection = document.getElementById('charts');

const avatarImg = document.getElementById('avatar');
const nameEl = document.getElementById('name');
const bioEl = document.getElementById('bio');
const followersEl = document.getElementById('followers');
const followingEl = document.getElementById('following');
const publicReposEl = document.getElementById('publicRepos');
const profileUrlEl = document.getElementById('profileUrl');

let starsChartInstance = null;
let langChartInstance = null;

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = input.value.trim();
  if (!username) return;

  errorDiv.classList.add('hidden');
  profileSection.classList.add('hidden');
  chartsSection.classList.add('hidden');
  loading.classList.remove('hidden');
  loading.textContent = 'Loading...';

  try {
    const profileRes = await fetch(`https://api.github.com/users/${username}`);
    if (!profileRes.ok) throw new Error('User not found');
    const profile = await profileRes.json();

    let repos = [];
    let page = 1;
    while (true) {
      const repoRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&page=${page}`);
      if (!repoRes.ok) break;
      const data = await repoRes.json();
      if (data.length === 0) break;
      repos = repos.concat(data);
      if (data.length < 100) break;
      page++;
    }

    avatarImg.src = profile.avatar_url;
    nameEl.textContent = profile.name || profile.login;
    bioEl.textContent = profile.bio || '';
    followersEl.textContent = profile.followers;
    followingEl.textContent = profile.following;
    publicReposEl.textContent = profile.public_repos;
    profileUrlEl.href = profile.html_url;

    profileSection.classList.remove('hidden');

    const starsData = repos.map(r => ({ name: r.name, stars: r.stargazers_count }));
    starsData.sort((a, b) => b.stars - a.stars);
    const topStars = starsData.slice(0, 10);

    const langCount = {};
    repos.forEach(r => {
      if (r.language) langCount[r.language] = (langCount[r.language] || 0) + 1;
    });

    const starsCtx = document.getElementById('starsChart').getContext('2d');
    if (starsChartInstance) starsChartInstance.destroy();
    starsChartInstance = new Chart(starsCtx, {
      type: 'bar',
      data: {
        labels: topStars.map(r => r.name),
        datasets: [{
          label: 'Stars',
          data: topStars.map(r => r.stars),
          backgroundColor: 'rgba(99, 102, 241, 0.7)',
          borderRadius: 5,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });

    const langCtx = document.getElementById('langChart').getContext('2d');
    if (langChartInstance) langChartInstance.destroy();
    langChartInstance = new Chart(langCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(langCount),
        datasets: [{
          label: 'Repositories',
          data: Object.values(langCount),
          backgroundColor: [
            '#6366F1', '#EF4444', '#10B981', '#F59E0B', '#3B82F6',
            '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#22C55E'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right' }
        }
      }
    });

    chartsSection.classList.remove('hidden');
  } catch (err) {
    errorDiv.textContent = err.message;
    errorDiv.classList.remove('hidden');
  } finally {
    loading.classList.add('hidden');
  }
});
