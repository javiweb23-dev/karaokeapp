const SUPABASE_URL = 'https://mefrjbmjfdphdqndpzcw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Xfq71bq0xH8DQ62OHekwCQ_B5dAPsz8';
const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allSongs = [];
const ALERT_SOUND_URL = 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg';
let notificationAudio = null;
let notificationAudioReady = false;
let deferredInstallPrompt = null;

document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', unlockNotificationAudio, { once: true });
    document.addEventListener('touchstart', unlockNotificationAudio, { once: true });
    setupInstallAndQr();
    setupStickyOffsets();
    setTimeout(() => {
        if (typeof songsDatabase !== 'undefined') {
            allSongs = [...songsDatabase];
            applyFilters();
        } else {
            document.getElementById('loading').innerText = "Error al leer las canciones. Refresca la página.";
        }
        setupEventListeners();
        startLiveStatusTracking();
    }, 100);
});

function setupStickyOffsets() {
    const syncOffsets = () => {
        const header = document.querySelector('.header');
        const liveBar = document.getElementById('liveStatusBar');
        const headerHeight = header ? `${header.offsetHeight}px` : '0px';
        const liveBarHeight = liveBar ? `${liveBar.offsetHeight}px` : '0px';
        document.documentElement.style.setProperty('--header-height', headerHeight);
        document.documentElement.style.setProperty('--live-status-height', liveBarHeight);
    };
    syncOffsets();
    window.addEventListener('resize', syncOffsets);
}

async function updateLiveStatus() {
    const liveSingerText = document.getElementById('liveSingerText');
    if (!liveSingerText) return;
    const { data, error } = await _supabase
        .from('Solicitudes')
        .select('nombre_usuario')
        .eq('estado', 'preparate')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error || !data || !data.nombre_usuario) {
        liveSingerText.innerText = '🎤 ESPERANDO PRÓXIMO CANTANTE...';
        return;
    }
    liveSingerText.innerText = `🎤 CANTANDO AHORA: ${data.nombre_usuario}`;
}

function startLiveStatusTracking() {
    updateLiveStatus();
    _supabase
        .channel('live-status-aprobada')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Solicitudes' },
            () => {
                updateLiveStatus();
            }
        )
        .subscribe();
}

function generateShareQrUrl(size) {
    const shareUrl = window.location.href;
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(shareUrl)}`;
}

function setupInstallAndQr() {
    const installBtn = document.getElementById('installBtn');
    const installNote = document.getElementById('installNote');
    const openQrBtn = document.getElementById('openQrBtn');
    const closeQrBtn = document.getElementById('closeQrBtn');
    const qrModal = document.getElementById('qrModal');
    const qrModalContent = document.querySelector('.qr-modal-content');
    const qrImage = document.getElementById('qrImage');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

    if (!installBtn || !installNote || !openQrBtn || !closeQrBtn || !qrModal || !qrModalContent || !qrImage) return;

    const setInstallVisibility = (visible) => {
        installBtn.style.display = visible ? 'inline-flex' : 'none';
        installNote.style.display = visible ? 'block' : 'none';
    };

    if (isStandalone) {
        setInstallVisibility(false);
    } else if (isIos) {
        setInstallVisibility(true);
    } else {
        setInstallVisibility(false);
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        if (!isStandalone) {
            setInstallVisibility(true);
        }
    });

    installBtn.addEventListener('click', async () => {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            await deferredInstallPrompt.userChoice;
            deferredInstallPrompt = null;
            setInstallVisibility(false);
            return;
        }
        if (isIos && !isStandalone) {
            mostrarAlertaElegante('Para guardar, pulsa el botón Compartir y luego Añadir a la pantalla de inicio. Tu información permanece privada siempre');
        }
    });

    window.addEventListener('appinstalled', () => {
        setInstallVisibility(false);
    });

    openQrBtn.addEventListener('click', () => {
        const modalWidth = qrModalContent.clientWidth;
        const qrSize = Math.max(180, Math.min(320, modalWidth - 36));
        qrImage.src = generateShareQrUrl(qrSize);
        qrModal.style.display = 'flex';
    });

    closeQrBtn.addEventListener('click', () => {
        qrModal.style.display = 'none';
    });

    qrModal.addEventListener('click', (e) => {
        if (e.target === qrModal) {
            qrModal.style.display = 'none';
        }
    });
}

async function unlockNotificationAudio() {
    if (notificationAudioReady) return;
    notificationAudio = new Audio(ALERT_SOUND_URL);
    notificationAudio.preload = 'auto';
    notificationAudio.volume = 1;
    try {
        await notificationAudio.play();
        notificationAudio.pause();
        notificationAudio.currentTime = 0;
    } catch (e) {}
    notificationAudioReady = true;
}

function playNotificationTwice() {
    if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 300, 500, 200, 500]);
    }
    const playOnce = () => {
        if (notificationAudio) {
            notificationAudio.currentTime = 0;
            notificationAudio.play().catch(() => {});
            return;
        }
        const fallbackAudio = new Audio(ALERT_SOUND_URL);
        fallbackAudio.play().catch(() => {});
    };
    playOnce();
    setTimeout(playOnce, 900);
}

function mostrarAlertaElegante(mensaje, tipo) {
    const accent = tipo === 'error' ? '#dc3545' : '#ff6600';
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0'; 
    modal.style.left = '0'; 
    modal.style.width = '100vw'; // Forzamos el ancho exacto de la pantalla
    modal.style.height = '100vh'; // Forzamos el alto exacto de la pantalla
    modal.style.backgroundColor = 'rgba(0,0,0,0.85)';
    modal.style.display = 'flex'; 
    modal.style.justifyContent = 'center'; 
    modal.style.alignItems = 'center';
    modal.style.zIndex = '9999';
    modal.style.margin = '0'; // Reseteo de seguridad
    modal.style.padding = '0'; // Reseteo de seguridad
    modal.style.boxSizing = 'border-box';

    const box = document.createElement('div');
    box.style.backgroundColor = '#1a1a1a';
    box.style.padding = '25px';
    box.style.borderRadius = '12px';
    box.style.border = '2px solid ' + accent;
    box.style.textAlign = 'center';
    box.style.width = 'calc(100% - 40px)'; // 100% menos 20px de cada lado para que respire
    box.style.maxWidth = '400px'; 
    box.style.boxSizing = 'border-box'; 
    box.style.color = 'white';
    box.style.boxShadow = '0 10px 25px rgba(255, 102, 0, 0.2)';
    box.style.margin = '0'; // <--- EL ANTÍDOTO: Evita que tu style.css lo empuje a la derecha

    const title = document.createElement('h3');
    title.innerText = '🎤 Karaoke Latino Dice:';
    title.style.color = accent;
    title.style.margin = '0 0 15px 0';

    const text = document.createElement('p');
    text.innerText = mensaje;
    text.style.whiteSpace = 'pre-line'; 
    text.style.fontSize = '16px';
    text.style.lineHeight = '1.5';
    text.style.wordBreak = 'break-word';
    text.style.margin = '0'; // Reseteo de seguridad

    const btn = document.createElement('button');
    btn.innerText = 'ACEPTAR';
    btn.style.backgroundColor = accent;
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.padding = '12px 25px';
    btn.style.borderRadius = '8px';
    btn.style.marginTop = '20px';
    btn.style.cursor = 'pointer';
    btn.style.fontWeight = 'bold';
    btn.style.fontSize = '16px';
    btn.onclick = async () => {
        await unlockNotificationAudio();
        document.body.removeChild(modal);
    };

    box.appendChild(title);
    box.appendChild(text);
    box.appendChild(btn);
    modal.appendChild(box);
    document.body.appendChild(modal);
}

async function prepararPedido(number, artist, title) {
    let userName = localStorage.getItem('karaoke_user_name');
    const songId = number.toString();
    const userSongsKey = 'karaoke_requested_song_ids';

    if (!userName || userName.trim() === "") {
        userName = prompt("Tu nombre para la lista:");
        if (userName && userName.trim() !== "") {
            userName = userName.trim();
            localStorage.setItem('karaoke_user_name', userName);
        } else {
            return;
        }
    }

    let requestedSongIds = [];
    try {
        requestedSongIds = JSON.parse(localStorage.getItem(userSongsKey) || '[]');
        if (!Array.isArray(requestedSongIds)) {
            requestedSongIds = [];
        }
    } catch (e) {
        requestedSongIds = [];
    }

    if (requestedSongIds.includes(songId)) {
        mostrarAlertaElegante('¡Ya pediste esta canción! Espera a cantarla antes de pedirla de nuevo');
        return;
    }

    const { data: globalDuplicate, error: globalDuplicateError } = await _supabase
        .from('Solicitudes')
        .select('id')
        .eq('numero_cancion', songId)
        .in('estado', ['pendiente', 'preparate'])
        .limit(1);

    if (globalDuplicateError) {
        mostrarAlertaElegante("❌ Error: " + globalDuplicateError.message);
        return;
    }

    if (globalDuplicate && globalDuplicate.length > 0) {
        mostrarAlertaElegante('Esta canción ya la pidieron, espera a que la canten para que vuelva a estar disponible, intenta con otra canción', 'error');
        return;
    }

    const { count: activePendingCount, error: activePendingError } = await _supabase
        .from('Solicitudes')
        .select('id', { count: 'exact', head: true })
        .eq('nombre_usuario', userName)
        .in('estado', ['pendiente', 'preparate']);

    if (activePendingError) {
        mostrarAlertaElegante("❌ Error: " + activePendingError.message);
        return;
    }

    if ((activePendingCount || 0) >= 3) {
        mostrarAlertaElegante('¡Canta las que tienes en cola antes de pedir más!', 'error');
        return;
    }

    const { data, error } = await _supabase
        .from('Solicitudes')
        .insert([
            { 
                nombre_usuario: userName, 
                cancion_info: `${artist} - ${title}`, 
                numero_cancion: songId,
                estado: 'pendiente' 
            }
        ])
        .select();

    if (error) {
        mostrarAlertaElegante("❌ Error: " + error.message);
    } else {
        mostrarAlertaElegante("✅ ¡Recibido!\n\nTu canción ya está en la lista.\n\nMantén esta página abierta para avisarte cuando te toque cantar.");

        if (data && data.length > 0) {
            requestedSongIds.push(songId);
            localStorage.setItem(userSongsKey, JSON.stringify([...new Set(requestedSongIds)]));
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
                            playNotificationTwice();
                            mostrarAlertaElegante(`¡PREPÁRATE ${userName.toUpperCase()}!\n\nTu canción "${title}" es la siguiente.\n\nPendiente, puedes levantar la mano para ubicarte y que te lleven el micrófono.`);
                        }
                    }
                )
                .subscribe();
        }
    }
}

function manejarClickPedido(button, number, artist, title) {
    if (!button || button.disabled) return;
    const originalText = button.innerText;
    button.disabled = true;
    button.innerText = 'ENVIANDO...';
    setTimeout(() => {
        button.disabled = false;
        button.innerText = originalText;
    }, 3000);
    prepararPedido(number, artist, title);
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
            <td><button class="btn-pedir" onclick="manejarClickPedido(this, '${song.number}', '${safeArtist}', '${safeTitle}')">PEDIR</button></td>
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