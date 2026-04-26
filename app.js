const SUPABASE_URL = 'https://mefrjbmjfdphdqndpzcw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Xfq71bq0xH8DQ62OHekwCQ_B5dAPsz8';
const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allSongs = [];

document.addEventListener('DOMContentLoaded', () => {
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

// FUNCIÓN DE ALERTA ELEGANTE
function mostrarAlertaElegante(mensaje) {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0'; modal.style.left = '0'; modal.style.width = '100%'; modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.85)';
    modal.style.display = 'flex'; modal.style.justifyContent = 'center'; modal.style.alignItems = 'center';
    modal.style.zIndex = '9999';

    const box = document.createElement('div');
    box.style.backgroundColor = '#1a1a1a';
    box.style.padding = '25px';
    box.style.borderRadius = '12px';
    box.style.border = '2px solid #ff6600';
    box.style.textAlign = 'center';
    box.style.maxWidth = '85%';
    box.style.color = 'white';
    box.style.boxShadow = '0 10px 25px rgba(255, 102, 0, 0.2)';

    const title = document.createElement('h3');
    title.innerText = '🎤 Karaoke Latino Dice:';
    title.style.color = '#ff6600';
    title.style.margin = '0 0 15px 0';

    const text = document.createElement('p');
    text.innerText = mensaje;
    text.style.whiteSpace = 'pre-line'; // Respeta los saltos de línea
    text.style.fontSize = '16px';
    text.style.lineHeight = '1.5';
    text.style.wordBreak = 'break-word'; // Evita que los textos largos se corten en los bordes

    const btn = document.createElement('button');
    btn.innerText = 'ACEPTAR';
    btn.style.backgroundColor = '#ff6600';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.padding = '12px 25px';
    btn.style.borderRadius = '8px';
    btn.style.marginTop = '20px';
    btn.style.cursor = 'pointer';
    btn.style.fontWeight = 'bold';
    btn.style.fontSize = '16px';
    btn.onclick = () => document.body.removeChild(modal);

    box.appendChild(title);
    box.appendChild(text);
    box.appendChild(btn);
    modal.appendChild(box);
    document.body.appendChild(modal);
}

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
        mostrarAlertaElegante("❌ Error: " + error.message);
    } else {
        // MENSAJE DE "RECIBIDO" AHORA ES ELEGANTE
        mostrarAlertaElegante("✅ ¡Recibido!\n\nTu canción ya está en la lista.\n\nMantén esta página abierta para avisarte cuando te toque cantar.");

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
                            mostrarAlertaElegante(`¡PREPÁRATE ${userName.toUpperCase()}!\n\nTu canción "${title}" es la siguiente.\n\nPendiente, puedes levantar la mano para ubicarte y que te lleven el micrófono.`);
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