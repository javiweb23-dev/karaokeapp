// 1. Agrega la librería de Supabase en tu index.html
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const SUPABASE_URL = 'https://mefrjbmjfdphdqndpzcw.supabase.co';
const SUPABASE_KEY = 'PEGA_AQUI_TU_LLAVE_PUBLISHABLE_COMPLETA';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// El resto de tu código sigue igual...

async function prepararPedido(number, artist, title) {
    let userName = localStorage.getItem('karaoke_user_name');

    if (!userName || userName.trim() === "") {
        userName = prompt("¡Hola! ¿Cuál es tu nombre para anunciarte?");
        if (userName && userName.trim() !== "") {
            localStorage.setItem('karaoke_user_name', userName.trim());
        } else { return; }
    }

    // EN LUGAR DE WHATSAPP, GUARDAMOS EN LA DB
    const { data, error } = await supabase
        .from('solicitudes')
        .insert([
            { 
                nombre_usuario: userName, 
                cancion_info: `${artist} - ${title}`,
                numero_cancion: number,
                estado: 'pendiente' 
            }
        ]);

    if (error) {
        alert("Error al enviar: " + error.message);
    } else {
        alert("¡Recibido! Tu canción está en la lista de espera.");
        // Aquí podrías disparar la vista de "Ver mi lugar en la cola"
    }
}