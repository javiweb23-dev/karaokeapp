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

    // El .select() al final es vital: nos devuelve el ID exacto que Supabase le dio a esta canción
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

        // === INICIO DE LA MAGIA DEL AVISO ===
        // Si el pedido se guardó bien, activamos el "radar" en el teléfono del cliente
        if (data && data.length > 0) {
            const idUnico = data[0].id; // Tomamos el ID de la base de datos

            _supabase
                .channel('radar-cancion-' + idUnico)
                .on(
                    'postgres_changes',
                    { 
                        event: 'UPDATE', 
                        schema: 'public', 
                        table: 'Solicitudes',
                        filter: `id=eq.${idUnico}` // Solo escuchamos cambios de ESTA canción
                    },
                    (payload) => {
                        // Si el DJ cambia manualmente el estado a 'preparate'
                        if (payload.new.estado === 'preparate') {
                            alert(`🎤 ¡PREPÁRATE ${userName.toUpperCase()}!\n\nTu canción "${title}" es la siguiente.\n\n¡Ve acercándote al DJ!`);
                        }
                    }
                )
                .subscribe();
        }
        // === FIN DE LA MAGIA ===
    }
}