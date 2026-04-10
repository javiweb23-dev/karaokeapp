function applyFilters() {
  const searchInput = document.getElementById('searchInput');
  const languageFilter = document.getElementById('languageFilter');

  // Convertimos la búsqueda a minúsculas y quitamos acentos
  const searchTerm = searchInput.value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  const selectedLanguage = languageFilter.value.toLowerCase();

  filteredSongs = allSongs.filter(song => {
      const matchesLanguage = song.language.toLowerCase().includes(selectedLanguage);

      // Función auxiliar para limpiar el texto de la base de datos (artista, título, etc.)
      const cleanText = (text) => 
        text.toString().toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

      const matchesSearch = searchTerm === '' || 
          cleanText(song.artist).includes(searchTerm) ||
          cleanText(song.title).includes(searchTerm) ||
          song.number.toString().includes(searchTerm);

      return matchesLanguage && matchesSearch;
  });

  renderSongs(filteredSongs);
}