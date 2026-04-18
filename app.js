let allSongs = [];
const WHATSAPP_NUMBER = "584121591072";

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

    const fragment = document.createDocumentFragment();

    songs.forEach(song => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${song.number}</td>
            <td>${song.artist}</td>
            <td>${song.title}</td>
            <td>${song.genre}</td>
            <td>${song.language}</td>
            <td><button class="btn-pedir" onclick="prepararPedido('${song.number}', '${song.artist.replace(/'/g, "\\'")}', '${song.title.replace(/'/g, "\\')}')">PEDIR 📲</button></td>
        `;
        fragment.appendChild(row);
    });
    
    tbody.appendChild(fragment);
}

function prepararPedido(number, artist, title) {
    let userName = localStorage.getItem('karaoke_user_name');

    if (!userName || userName.trim() === "") {
        userName = prompt("¡Hola! ¿Cuál es tu nombre para anunciarte en el escenario?");
        if (userName && userName.trim() !== "") {
            localStorage.setItem('karaoke_user_name', userName.trim());
        } else {
            return;
        }
    }

    const text = `Hola, soy ${userName} y quiero cantar: ${number} - ${artist} - ${title}`;
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
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