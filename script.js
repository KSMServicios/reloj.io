// ====================================================================
// 3. LÓGICA DE GEOLOCALIZACIÓN Y CLIMA (SECCIÓN CORREGIDA)
// ====================================================================

// ... (obtenerUbicacion y manejarError no cambian)

async function mostrarClima(posicion) {
    const lat = posicion.coords.latitude;
    const lon = posicion.coords.longitude;
    const climaUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${CLIMA_API_KEY}`;

    try {
        const respuesta = await fetch(climaUrl);
        
        if (!respuesta.ok) {
            // --- GESTIÓN DE ERRORES MEJORADA ---
            document.getElementById('ubicacion-nombre').textContent = "Error de Servidor API.";

            if (respuesta.status === 401) {
                // Mensaje específico si el error es de autenticación
                document.getElementById('descripcion-clima').textContent = '⚠️ Clave API activa, pero en latencia. Espere.';
            } else if (respuesta.status === 404) {
                // Si la ubicación no se encuentra (no debería pasar con lat/lon)
                document.getElementById('descripcion-clima').textContent = 'Servicio de Clima no encontrado (404).';
            } else {
                // Error genérico HTTP
                document.getElementById('descripcion-clima').textContent = `Fallo HTTP: ${respuesta.status}.`;
            }
            throw new Error(`Fallo de API: HTTP ${respuesta.status}`);
        }
        
        const datos = await respuesta.json();

        // Actualizar el DOM con los datos obtenidos (Resto del código correcto)
        document.getElementById('ubicacion-nombre').textContent = datos.name;
        document.getElementById('temperatura').textContent = `${Math.round(datos.main.temp)}°C`;
        document.getElementById('descripcion-clima').textContent = datos.weather[0].description;
        
        const iconoCode = datos.weather[0].icon;
        document.getElementById('icono-clima').src = `https://openweathermap.org/img/wn/${iconoCode}@2x.png`;
        
        document.getElementById('velocidad-viento').textContent = `Viento: ${datos.wind.speed.toFixed(1)} m/s`;

    } catch (error) {
        console.error("Error en mostrarClima:", error);
    }
}
