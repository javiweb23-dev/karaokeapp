const SUPABASE_URL = 'https://mefrjbmjfdphdqndpzcw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Xfq71bq0xH8DQ62OHekwCQ_B5dAPsz8';
const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allSongs = [];

document.addEventListener('DOMContentLoaded', () => {
    if (typeof songsDatabase !== 'undefined') {
        allSongs = [...songsDatabase];
        applyFilters();
    }
    setupEventListeners();
});

async function prepararPedido(number, artist, title) {
    let userName = localStorage.getItem('karaoke_user_name');

    if (!userName || userName.trim() === "") {
        userName = prompt("Tu nombre para la lista:");
        if (userName && userName.trim() !== "") {
            localStorage.setItem('karaoke_user_name', userName.trim());
        } else {
            return;
        }
    }

    const { error } = await _supabase
        .from('Solicitudes')
        .insert([
            { 
                nombre_usuario: userName, 
                cancion_info: `${artist} - ${title}`, 
                numero_cancion: number.toString(),
                estado: 'pendiente' 
            }
        ]);

    if (error) {
        alert("Error: " + error.message);
    } else {
        alert("¡Recibido! Tu canción ya está en la lista.");
    }
}

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
        const cleanArtist = song.artist.replace(/'/g, "\\'");
        const cleanTitle = song.title.replace(/'/g, "\\'");
        
        row.innerHTML = `
            <td>${song.number}</td>
            <td><strong>${song.artist}</strong></td>
            <td>${song.title}</td>
            <td style="color:#888">${song.genre}</td>
            <td><button class="btn-pedir" onclick="prepararPedido('${song.number}', '${cleanArtist}', '${cleanTitle}')">PEDIR</button></td>
        `;
        fragment.appendChild(row);
    });
    
    tbody.appendChild(fragment);
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