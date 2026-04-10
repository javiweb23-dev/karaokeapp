let allSongs = [];

document.addEventListener('DOMContentLoaded', () => {
    if (typeof songsDatabase !== 'undefined') {
        allSongs = [...songsDatabase];
        applyFilters();
    }
    setupEventListeners();
    registerServiceWorker();
});

function renderSongs(songs) {
    const tbody = document.getElementById('songsTableBody');
    const loading = document.getElementById('loading');
    const noResults = document.getElementById('noResults');
    
    if (loading) loading.style.display = 'none';
    tbody.innerHTML = '';

    if (songs.length === 0) {
        noResults.style.display = 'block';
        return;
    }
    noResults.style.display = 'none';

    songs.forEach(song => {
        const row = document.createElement('tr');
        const waMsg = encodeURIComponent(`Hola! Quiero cantar: ${song.number} - ${song.artist} - ${song.title}`);
        row.innerHTML = `
            <td>#${song.number}</td>
            <td>${song.artist}</td>
            <td>${song.title}</td>
            <td>${song.genre}</td>
            <td>${song.language}</td>
            <td><a href="https://wa.me/584121591072?text=${waMsg}" target="_blank">PEDIR 📲</a></td>
        `;
        tbody.appendChild(row);
    });
}

function applyFilters() {
    const term = document.getElementById('searchInput').value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const lang = document.getElementById('languageFilter').value.toLowerCase();

    const filtered = allSongs.filter(s => {
        const matchLang = lang === "" || s.language.toLowerCase().includes(lang);
        const cleanA = s.artist.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const cleanT = s.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const matchSearch = term === "" || cleanA.includes(term) || cleanT.includes(term) || s.number.toString().includes(term);
        return matchLang && matchSearch;
    });
    renderSongs(filtered);
}

function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('languageFilter').addEventListener('change', applyFilters);
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js');
    }
}