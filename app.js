let allSongs = [];
let filteredSongs = [];
let currentSort = { column: null, direction: 'asc' };

document.addEventListener('DOMContentLoaded', () => {
  allSongs = [...songsDatabase];
  applyFilters(); 
  setupSearch();
  setupLanguageFilter();
  setupSortingHeaders();
  setupKeyboardHandling();
  hideLoading();
  registerServiceWorker();
});

function renderSongs(songs) {
  const tbody = document.getElementById('songsTableBody');
  const noResults = document.getElementById('noResults');
  tbody.innerHTML = '';
  if (songs.length === 0) {
      noResults.style.display = 'block';
      return;
  }
  noResults.style.display = 'none';
  songs.forEach(song => {
      const mensaje = `Hola, mi nombre es ____ y quiero la canción numero ${song.number}: ${song.artist} - ${song.title}`;
      const urlWA = `https://wa.me/584121591072?text=${encodeURIComponent(mensaje)}`;
      const row = document.createElement('tr');
      row.innerHTML = `
          <td>${song.number}</td>
          <td>${song.artist}</td>
          <td>${song.title}</td>
          <td>${song.genre}</td>
          <td>${song.language}</td>
          <td style="text-align: center;"><a href="${urlWA}" target="_blank" style="text-decoration: none; font-size: 20px;">📲</a></td>
      `;
      tbody.appendChild(row);
  });
}

function applyFilters() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
  const selectedLanguage = document.getElementById('languageFilter').value.toLowerCase();
  filteredSongs = allSongs.filter(song => {
      const matchesLanguage = song.language.toLowerCase().includes(selectedLanguage);
      const matchesSearch = searchTerm === '' || 
          song.artist.toLowerCase().includes(searchTerm) ||
          song.title.toLowerCase().includes(searchTerm) ||
          song.number.toString().includes(searchTerm);
      return matchesLanguage && matchesSearch;
  });
  renderSongs(filteredSongs);
}

function setupSearch() { document.getElementById('searchInput').addEventListener('input', applyFilters); }
function setupLanguageFilter() { document.getElementById('languageFilter').addEventListener('change', applyFilters); }
function hideLoading() { document.getElementById('loading').style.display = 'none'; }
function setupKeyboardHandling() { /* Mantenlo vacío por ahora para simplificar */ }
function setupSortingHeaders() { /* Mantenlo vacío por ahora para simplificar */ }

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').then(reg => {
      reg.onupdatefound = () => {
        const installingWorker = reg.installing;
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            window.location.reload();
          }
        };
      };
    });
  }
}