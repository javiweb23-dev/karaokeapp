let allSongs = [];
let filteredSongs = [];
let currentSort = {
  column: null,
  direction: 'asc'
};

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
  allSongs = [...songsDatabase];
  filteredSongs = [...allSongs];
  renderSongs(filteredSongs);
  setupSearch();
  setupLanguageFilter();
  setupVocalistFilter();
  setupSortingHeaders();
  setupKeyboardHandling();
  hideLoading();
  registerServiceWorker();
});

// Renderizar canciones en la tabla
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
      // Configuración del mensaje de WhatsApp
      const numeroWA = "584121591072";
      const mensaje = `Hola, mi nombre es ____ y quiero la canción numero ${song.number}: ${song.artist} - ${song.title}`;
      const urlWA = `https://wa.me/${numeroWA}?text=${encodeURIComponent(mensaje)}`;

      const row = document.createElement('tr');
      row.innerHTML = `
          <td>${song.number}</td>
          <td>${song.artist}</td>
          <td>${song.title}</td>
          <td>${song.genre}</td>
          <td>${song.language}</td>
          <td>${song.vocalist || 'N/A'}</td>
          <td style="text-align: center;">
            <a href="${urlWA}" target="_blank" style="text-decoration: none; font-size: 20px;">📲</a>
          </td>
      `;
      tbody.appendChild(row);
  });
}

// Aplicar filtros combinados (búsqueda + idioma + vocalista)
function applyFilters() {
  const searchInput = document.getElementById('searchInput');
  const languageFilter = document.getElementById('languageFilter');
  const vocalistFilter = document.getElementById('vocalistFilter');

  const searchTerm = searchInput.value.toLowerCase().trim();
  const selectedLanguage = languageFilter.value.toLowerCase();
  const selectedVocalist = vocalistFilter.value.toLowerCase();

  filteredSongs = allSongs.filter(song => {
      const matchesSearch = searchTerm === '' || 
          song.artist.toLowerCase().includes(searchTerm) ||
          song.title.toLowerCase().includes(searchTerm) ||
          song.genre.toLowerCase().includes(searchTerm) ||
          song.language.toLowerCase().includes(searchTerm) ||
          song.number.toString().includes(searchTerm) ||
          (song.vocalist && song.vocalist.toLowerCase().includes(searchTerm));

      const matchesLanguage = selectedLanguage === 'todos' || 
          song.language.toLowerCase().includes(selectedLanguage);

      const matchesVocalist = selectedVocalist === 'todos' || 
          (song.vocalist && song.vocalist.toLowerCase().includes(selectedVocalist));

      return matchesSearch && matchesLanguage && matchesVocalist;
  });

  if (currentSort.column) {
      sortSongs(currentSort.column, currentSort.direction, false);
  } else {
      renderSongs(filteredSongs);
  }
}

function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', () => {
      applyFilters();
  });
}

function setupLanguageFilter() {
  const languageFilter = document.getElementById('languageFilter');
  languageFilter.addEventListener('change', () => {
      applyFilters();
  });
}

function setupVocalistFilter() {
  const vocalistFilter = document.getElementById('vocalistFilter');
  vocalistFilter.addEventListener('change', () => {
      applyFilters();
    });
}

function setupKeyboardHandling() {
  const searchInput = document.getElementById('searchInput');
  const tableContainer = document.getElementById('tableContainer');

  searchInput.addEventListener('focus', function() {
      setTimeout(() => {
          searchInput.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (window.innerWidth > window.innerHeight && window.innerWidth >= 768) {
              tableContainer.style.maxHeight = 'calc(100vh - 350px)';
          }
      }, 300);
  });
    
  searchInput.addEventListener('blur', function() {
      setTimeout(() => {
            tableContainer.style.maxHeight = 'calc(100vh - 220px)';
      }, 100);
  });
    
  window.addEventListener('resize', function() {
      if (document.activeElement === searchInput) {
          setTimeout(() => {
              searchInput.scrollIntoView({ behavior: 'smooth', block: 'start' });
              if (window.innerWidth > window.innerHeight && window.innerWidth >= 768) {
                  tableContainer.style.maxHeight = 'calc(100vh - 350px)';
              }
          }, 300);
      } else {
          tableContainer.style.maxHeight = 'calc(100vh - 220px)';
      }
  });
}

function setupSortingHeaders() {
  const headers = document.querySelectorAll('.songs-table th');
  headers.forEach((header, index) => {
      // Evitar que la columna de WhatsApp (índice 6) intente ordenar
      if (index < 6) {
          header.addEventListener('click', () => {
              const columns = ['number', 'artist', 'title', 'genre', 'language', 'vocalist'];
              const column = columns[index];
              let direction = 'asc';
              if (currentSort.column === column && currentSort.direction === 'asc') {
                  direction = 'desc';
              }
              sortSongs(column, direction);
              updateSortIndicators(index, direction);
          });
      }
  });
}

function sortSongs(column, direction, shouldRender = true) {
  currentSort = { column, direction };
  filteredSongs.sort((a, b) => {
      let valueA = a[column];
      let valueB = b[column];
      if (column === 'number') {
          valueA = parseInt(valueA);
          valueB = parseInt(valueB);
      } else {
          valueA = valueA ? valueA.toString().toLowerCase() : '';
          valueB = valueB ? valueB.toString().toLowerCase() : '';
      }
      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
      return 0;
  });
  if (shouldRender) {
      renderSongs(filteredSongs);
  }
}

function updateSortIndicators(activeIndex, direction) {
  const headers = document.querySelectorAll('.songs-table th');
  headers.forEach((header, index) => {
      header.classList.remove('sort-asc', 'sort-desc');
      if (index === activeIndex) {
            header.classList.add(direction === 'asc' ? 'sort-asc' : 'sort-desc');
      }
  });
}

function hideLoading() {
  const loading = document.getElementById('loading');
  loading.style.display = 'none';
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    // Usamos '/service-worker.js' porque así aparece en tu código anterior
    navigator.serviceWorker.register('/service-worker.js').then(reg => {
      console.log('Service Worker registrado');

      reg.onupdatefound = () => {
        const installingWorker = reg.installing;
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // El navegador detecta el cambio y se refresca solo
              console.log('Nueva versión detectada. Aplicando cambios...');
              window.location.reload();
            }
          }
        };
      };
    }).catch(error => console.log('Error al registrar Service Worker:', error));
  }
}