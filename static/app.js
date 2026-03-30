const CHART_DEFAULTS = {
  color: "#fff",
  borderColor: "rgba(255,255,255,0.1)",
  plugins: { legend: { display: false } },
};

Chart.defaults.color = "#b3b3b3";
Chart.defaults.borderColor = "rgba(255,255,255,0.08)";

const GREEN = "#1DB954";
const GREEN_ALPHA = "rgba(29,185,84,0.15)";

// ── Tab navigation ──────────────────────────────────────────────────────────
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((t) => t.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
  });
});

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatTime(isoString) {
  return new Date(isoString).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatDuration(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const AXIS_TITLE = (text) => ({
  display: true,
  text,
  color: "#b3b3b3",
  font: { size: 11 },
  padding: { top: 6, bottom: 0 },
});

function barChartConfig(labels, data, label, yLabel) {
  return {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label,
        data,
        backgroundColor: GREEN_ALPHA,
        borderColor: GREEN,
        borderWidth: 1.5,
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.y} ${label.toLowerCase()}`,
          },
        },
      },
      scales: {
        x: { grid: { color: "rgba(255,255,255,0.05)" } },
        y: {
          grid: { color: "rgba(255,255,255,0.05)" },
          beginAtZero: true,
          ticks: { precision: 0 },
          title: AXIS_TITLE(yLabel),
        },
      },
    },
  };
}

function horizontalBarConfig(labels, data, label, xLabel) {
  return {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label,
        data,
        backgroundColor: GREEN_ALPHA,
        borderColor: GREEN,
        borderWidth: 1.5,
        borderRadius: 4,
      }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.x} ${label.toLowerCase()}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.05)" },
          beginAtZero: true,
          ticks: { precision: 0 },
          title: AXIS_TITLE(xLabel),
        },
        y: { grid: { display: false } },
      },
    },
  };
}

// ── Recently Played ──────────────────────────────────────────────────────────
let hourChart, dowChart, artistChart, dailyChart;

async function loadRecentHistory() {
  const res = await fetch("/api/recently-played");
  const tracks = await res.json();

  // Hour of day
  const hourCounts = Array(24).fill(0);
  tracks.forEach((t) => hourCounts[t.hour]++);
  const hourLabels = Array.from({ length: 24 }, (_, i) => {
    const h = i % 12 || 12;
    return `${h}${i < 12 ? "am" : "pm"}`;
  });
  if (hourChart) hourChart.destroy();
  hourChart = new Chart(document.getElementById("hourChart"), barChartConfig(hourLabels, hourCounts, "Plays", "Number of plays"));

  // Day of week
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const dowCounts = Object.fromEntries(days.map((d) => [d, 0]));
  tracks.forEach((t) => { if (dowCounts[t.day_of_week] !== undefined) dowCounts[t.day_of_week]++; });
  if (dowChart) dowChart.destroy();
  dowChart = new Chart(document.getElementById("dowChart"), barChartConfig(days.map((d) => d.slice(0, 3)), days.map((d) => dowCounts[d]), "Plays", "Number of plays"));

  // Top artists from recent plays
  const artistCounts = {};
  tracks.forEach((t) => { artistCounts[t.artist] = (artistCounts[t.artist] || 0) + 1; });
  const topArtists = Object.entries(artistCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (artistChart) artistChart.destroy();
  artistChart = new Chart(document.getElementById("artistChart"), horizontalBarConfig(topArtists.map((a) => a[0]), topArtists.map((a) => a[1]), "Plays", "Number of plays"));

  // Activity over days
  const dayCounts = {};
  tracks.forEach((t) => { dayCounts[t.day] = (dayCounts[t.day] || 0) + 1; });
  const sortedDays = Object.keys(dayCounts).sort();
  const dayLabels = sortedDays.map((d) => new Date(d + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }));
  if (dailyChart) dailyChart.destroy();
  dailyChart = new Chart(document.getElementById("dailyChart"), {
    type: "line",
    data: {
      labels: dayLabels,
      datasets: [{
        label: "Plays",
        data: sortedDays.map((d) => dayCounts[d]),
        borderColor: GREEN,
        backgroundColor: GREEN_ALPHA,
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: GREEN,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.y} plays`,
          },
        },
      },
      scales: {
        x: { grid: { color: "rgba(255,255,255,0.05)" } },
        y: {
          grid: { color: "rgba(255,255,255,0.05)" },
          beginAtZero: true,
          ticks: { precision: 0 },
          title: AXIS_TITLE("Number of plays"),
        },
      },
    },
  });

  // Track list
  const list = document.getElementById("track-list");
  list.innerHTML = tracks.map((t) => `
    <div class="track-item">
      ${t.album_image
        ? `<img src="${t.album_image}" class="track-thumb" alt="${t.album}" />`
        : `<div class="track-thumb-placeholder"></div>`}
      <div class="track-info">
        <div class="track-name">
          <a href="${t.url}" target="_blank" rel="noopener">${t.name}</a>
        </div>
        <div class="track-artist">${t.artist} · ${t.album}</div>
      </div>
      <div class="track-time">${formatTime(t.played_at_local)}</div>
    </div>
  `).join("");
}

// ── Top Tracks ───────────────────────────────────────────────────────────────
let topTracksChart;
let currentTracksRange = "short_term";

async function loadTopTracks(timeRange) {
  currentTracksRange = timeRange;
  const res = await fetch(`/api/top-tracks?time_range=${timeRange}`);
  const tracks = await res.json();

  if (topTracksChart) topTracksChart.destroy();
  topTracksChart = new Chart(document.getElementById("topTracksChart"), horizontalBarConfig(
    tracks.slice(0, 10).map((t) => t.name.length > 25 ? t.name.slice(0, 25) + "…" : t.name),
    tracks.slice(0, 10).map((t) => t.popularity),
    "Popularity",
    "Spotify popularity score (0–100)"
  ));

  const list = document.getElementById("top-tracks-list");
  list.innerHTML = tracks.map((t) => `
    <div class="ranked-item">
      <span class="rank-num ${t.rank <= 3 ? "top3" : ""}">${t.rank}</span>
      ${t.album_image
        ? `<img src="${t.album_image}" class="ranked-thumb square" alt="${t.name}" />`
        : `<div class="ranked-thumb-placeholder" style="border-radius:4px"></div>`}
      <div class="ranked-info">
        <div class="ranked-name"><a href="${t.url}" target="_blank" rel="noopener">${t.name}</a></div>
        <div class="ranked-sub">${t.artist}</div>
      </div>
      <div class="popularity-bar"><div class="popularity-fill" style="width:${t.popularity}%"></div></div>
    </div>
  `).join("");
}

// ── Top Artists ────────────────────────────────────────────���─────────────────
let topArtistsChart;
let currentArtistsRange = "short_term";

async function loadTopArtists(timeRange) {
  currentArtistsRange = timeRange;
  const res = await fetch(`/api/top-artists?time_range=${timeRange}`);
  const artists = await res.json();

  if (topArtistsChart) topArtistsChart.destroy();
  topArtistsChart = new Chart(document.getElementById("topArtistsChart"), horizontalBarConfig(
    artists.slice(0, 10).map((a) => a.name.length > 20 ? a.name.slice(0, 20) + "…" : a.name),
    artists.slice(0, 10).map((a) => a.popularity),
    "Popularity",
    "Spotify popularity score (0–100)"
  ));

  const list = document.getElementById("top-artists-list");
  list.innerHTML = artists.map((a) => `
    <div class="ranked-item">
      <span class="rank-num ${a.rank <= 3 ? "top3" : ""}">${a.rank}</span>
      ${a.image
        ? `<img src="${a.image}" class="ranked-thumb" alt="${a.name}" />`
        : `<div class="ranked-thumb-placeholder"></div>`}
      <div class="ranked-info">
        <div class="ranked-name"><a href="${a.url}" target="_blank" rel="noopener">${a.name}</a></div>
        <div class="ranked-sub">${a.genres.join(", ") || "—"}</div>
      </div>
      <div class="popularity-bar"><div class="popularity-fill" style="width:${a.popularity}%"></div></div>
    </div>
  `).join("");
}

// ── Range buttons ─────────────────────────────────────────────────────────────
document.querySelectorAll("#tab-top-tracks .range-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#tab-top-tracks .range-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    loadTopTracks(btn.dataset.range);
  });
});

document.querySelectorAll("#tab-top-artists .range-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#tab-top-artists .range-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    loadTopArtists(btn.dataset.range);
  });
});

// ── Init ─────────────────────────────────────────────────────────────────────
loadRecentHistory();
loadTopTracks("short_term");
loadTopArtists("short_term");
