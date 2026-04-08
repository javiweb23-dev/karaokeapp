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
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${song.number}</td>
            <td>${song.artist}</td>
            <td>${song.title}</td>
            <td>${song.genre}</td>
            <td>${song.language}</td>
            <td>${song.vocalist || 'N/A'}</td>
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
        // Filtro de búsqueda
        const matchesSearch = searchTerm === '' || 
            song.artist.toLowerCase().includes(searchTerm) ||
            song.title.toLowerCase().includes(searchTerm) ||
            song.genre.toLowerCase().includes(searchTerm) ||
            song.language.toLowerCase().includes(searchTerm) ||
            song.number.toString().includes(searchTerm) ||
            (song.vocalist && song.vocalist.toLowerCase().includes(searchTerm));
        
        // Filtro de idioma
        const matchesLanguage = selectedLanguage === 'todos' || 
            song.language.toLowerCase().includes(selectedLanguage);
        
        // Filtro de vocalista
        const matchesVocalist = selectedVocalist === 'todos' || 
            (song.vocalist && song.vocalist.toLowerCase().includes(selectedVocalist));
        
        return matchesSearch && matchesLanguage && matchesVocalist;
    });
    
    // Aplicar el ordenamiento actual si existe
    if (currentSort.column) {
        sortSongs(currentSort.column, currentSort.direction, false);
    } else {
        renderSongs(filteredSongs);
    }
}

// Configurar búsqueda en tiempo real
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', () => {
        applyFilters();
    });
}

// Configurar filtro de idioma
function setupLanguageFilter() {
    const languageFilter = document.getElementById('languageFilter');
    
    languageFilter.addEventListener('change', () => {
        applyFilters();
    });
}

// Configurar filtro de vocalista
function setupVocalistFilter() {
    const vocalistFilter = document.getElementById('vocalistFilter');
    
    vocalistFilter.addEventListener('change', () => {
        applyFilters();
    });
}

// Configurar manejo del teclado en iPad
function setupKeyboardHandling() {
    const searchInput = document.getElementById('searchInput');
    const tableContainer = document.getElementById('tableContainer');
    const header = document.getElementById('header');
    
    // Detectar cuando se abre el teclado
    searchInput.addEventListener('focus', function() {
        // Pequeño delay para que el teclado se muestre primero
        setTimeout(() => {
            // Scroll para asegurar que el input sea visible
            searchInput.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // En iPad horizontal, reducir altura de la tabla
            if (window.innerWidth > window.innerHeight && window.innerWidth >= 768) {
                tableContainer.style.maxHeight = 'calc(100vh - 350px)';
            }
        }, 300);
    });
    
    // Detectar cuando se cierra el teclado
    searchInput.addEventListener('blur', function() {
        setTimeout(() => {
            // Restaurar altura normal de la tabla
            tableContainer.style.maxHeight = 'calc(100vh - 220px)';
        }, 100);
    });
    
    // Detectar cambios de orientación
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

// Configurar encabezados para ordenamiento
function setupSortingHeaders() {
    const headers = document.querySelectorAll('.songs-table th');
    
    headers.forEach((header, index) => {
        header.addEventListener('click', () => {
            const columns = ['number', 'artist', 'title', 'genre', 'language', 'vocalist'];
            const column = columns[index];
            
            // Determinar dirección del ordenamiento
            let direction = 'asc';
            if (currentSort.column === column && currentSort.direction === 'asc') {
                direction = 'desc';
            }
            
            sortSongs(column, direction);
            updateSortIndicators(index, direction);
        });
    });
}

// Ordenar canciones
function sortSongs(column, direction, shouldRender = true) {
    currentSort = { column, direction };
    
    filteredSongs.sort((a, b) => {
        let valueA = a[column];
        let valueB = b[column];
        
        // Para números, comparar como números
        if (column === 'number') {
            valueA = parseInt(valueA);
            valueB = parseInt(valueB);
        } else {
            // Para texto, convertir a minúsculas para comparación
            valueA = valueA ? valueA.toString().toLowerCase() : '';
            valueB = valueB ? valueB.toString().toLowerCase() : '';
        }
        
        if (valueA < valueB) {
            return direction === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
            return direction === 'asc' ? 1 : -1;
        }
        return 0;
    });
    
    if (shouldRender) {
        renderSongs(filteredSongs);
    }
}

// Actualizar indicadores visuales de ordenamiento
function updateSortIndicators(activeIndex, direction) {
    const headers = document.querySelectorAll('.songs-table th');
    
    headers.forEach((header, index) => {
        header.classList.remove('sort-asc', 'sort-desc');
        if (index === activeIndex) {
            header.classList.add(direction === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    });
}

// Ocultar loading
function hideLoading() {
    const loading = document.getElementById('loading');
    loading.style.display = 'none';
}

// Registrar Service Worker para PWA
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => console.log('Service Worker registrado'))
            .catch(error => console.log('Error al registrar Service Worker:', error));
    }
}