const SUPABASE_URL = 'https://mefrjbmjfdphdqndpzcw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Xfq71bq0xH8DQ62OHekwCQ_B5dAPsz8';
const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allSongs = [];

document.addEventListener('DOMContentLoaded', () => {
    // Le damos un respiro de 100ms al navegador para asegurar que songs.js cargó bien
    setTimeout(() => {
        if (typeof songsDatabase !== 'undefined') {
            allSongs = [...songsDatabase];
            applyFilters();
        } else {
            document.getElementById('loading').innerText = "Error al leer las canciones. Refresca la página.";
        }
        setupEventListeners();
    }, 100);
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

    // El select() es vital para obtener el ID de la canción que acabamos de pedir
    const { data, error } = await _supabase
        .from('Solicitudes')
        .insert([
            { 
                nombre_usuario: userName, 
                cancion_info: `${artist} - ${title}`, 
                numero_cancion: number.toString(),
                estado: 'pendiente' 
            }
        ])
        .select();

    if (error) {
        alert("Error: " + error.message);
    } else {
        alert("¡Recibido! Tu canción ya está en la lista. Mantén esta página abierta para avisarte cuando te toque.");

        // INICIO DE LA ALERTA DE PREPARACIÓN
        if (data && data.length > 0) {
            const idUnico = data[0].id;

            _supabase
                .channel('radar-cancion-' + idUnico)
                .on(
                    'postgres_changes',
                    { 
                        event: 'UPDATE', 
                        schema: 'public', 
                        table: 'Solicitudes',
                        filter: `id=eq.${idUnico}`
                    },
                    (payload) => {
                        if (payload.new.estado === 'preparate') {
                            alert(`🎤 ¡PREPÁRATE ${userName.toUpperCase()}!\n\nTu canción "${title}" es la siguiente.\n\n¡Ve acercándote al DJ!`);
                        }
                    }
                )
                .subscribe();
        }
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
        
        // Limpiamos comillas por seguridad para que el botón no se rompa
        const safeArtist = song.artist ? song.artist.replace(/'/g, "\\'") : "Desconocido";
        const safeTitle = song.title ? song.title.replace(/'/g, "\\'") : "Desconocido";
        
        row.innerHTML = `
            <td><button class="btn-pedir" onclick="prepararPedido('${song.number}', '${safeArtist}', '${safeTitle}')">PEDIR</button></td>
            <td><strong>${song.artist}</strong></td>
            <td>${song.title}</td>
            <td style="color:#888">${song.genre}</td>
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