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
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (songs.length === 0) {
        if (noResults) noResults.style.display = 'block';
        return;
    }
    if (noResults) noResults.style.display = 'none';

    const fragment = document.createDocumentFragment();

    songs.forEach(song => {
        const row = document.createElement('tr');
        
        const btn = document.createElement('button');
        btn.className = 'btn-pedir';
        btn.innerHTML = 'PEDIR 📲';
        btn.onclick = () => prepararPedido(song.number, song.artist, song.title);

        row.innerHTML = `
            <td>#${song.number}</td>
            <td>${song.artist}</td>
            <td>${song.title}</td>
            <td>${song.genre}</td>
            <td>${song.language}</td>
        `;
        
        const tdBtn = document.createElement('td');
        tdBtn.appendChild(btn);
        row.appendChild(tdBtn);
        fragment.appendChild(row);
    });
    
    tbody.appendChild(fragment);
}

function prepararPedido(number, artist, title) {
    let userName = localStorage.getItem('karaoke_user_name');

    if (!userName || userName.trim() === "") {
        userName = prompt("¡Hola! ¿Cuál es tu nombre para anunciarte?");
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
    const searchInput = document.getElementById('searchInput');
    const langFilter = document.getElementById('languageFilter');
    
    const term = searchInput ? searchInput.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
    const lang = langFilter ? langFilter.value.toLowerCase() : "";

    const filtered = allSongs.filter(s => {
        const matchLang = lang === "" || s.language.toLowerCase().includes(lang);
        const cleanA = s.artist.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const cleanT = s.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const matchSearch = term === "" || 
                           cleanA.includes(term) || 
                           cleanT.includes(term) || 
                           s.number.toString().includes(term);
        return matchLang && matchSearch;
    });
    renderSongs(filtered);
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const langFilter = document.getElementById('languageFilter');
    
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (langFilter) langFilter.addEventListener('change', applyFilters);
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js').catch(err => console.log("SW error:", err));
    }
}