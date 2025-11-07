/* Archivo: script.js (SOLUCIÓN MEJORADA) */

// ... (secciones 1 y 2 de configuración y reloj sin cambios) ...

// ====================================================================
// 3. LÓGICA DE GEOLOCALIZACIÓN Y CLIMA (ACTUALIZADA)
// ====================================================================

// --- Funciones de error sin cambios ---

function obtenerUbicacion() {
    if (navigator.geolocation) {
        // En lugar de llamar a mostrarClima, llamamos a la función que maneja la ubicación actual
        navigator.geolocation.getCurrentPosition(
            obtenerClimaLocal, 
            manejarError, 
            { enableHighAccuracy: true } 
        );
    } else {
        document.getElementById('ubicacion-nombre').textContent = "Geolocalización no soportada.";
    }
}

async function obtenerClimaSajaroff() {
    // Nombre de la localidad directamente
    const ciudad = 'Ingeniero Sajaroff, Argentina'; 
    const widgetId = 'sajaroff';
    
    // Función central que maneja la API
    await fetchClima(ciudad, widgetId);
}

// *** Función Central de Obtención de Clima (Reutilizable) ***
async function fetchClima(ciudad, widgetId) {
    // wttr.in/Ciudad?format=1 es: Temp + Descripción + Viento. 
    // wttr.in/Ciudad?format=%c%t\n%C es más útil para el pronóstico
    
    // Obtener condiciones actuales
    const climaUrl = `https://wttr.in/${ciudad}?format=%t+%C+%w`; 

    // Obtener pronóstico extendido (3 días con descripción, min/max)
    const pronosticoUrl = `https://wttr.in/${ciudad}?format=%D+%t\n%D+%t\n%D+%t`; 
    
    try {
        // 1. Obtener datos actuales
        const climaResp = await fetch(climaUrl);
        const climaTexto = await climaResp.text();
        const partes = climaTexto.trim().split(' ');

        // 2. Obtener pronóstico extendido (se espera una respuesta multi-línea)
        const pronosticoResp = await fetch(pronosticoUrl);
        const pronosticoTexto = await pronosticoResp.text();
        const lineasPronostico = pronosticoTexto.trim().split('\n');

        // 3. Actualizar el DOM
        if (widgetId === 'actual') {
             // Actualiza el widget principal (tu ubicación)
            document.getElementById('ubicacion-nombre').textContent = ciudad;
            document.getElementById('temperatura').textContent = partes[0]; 
            document.getElementById('descripcion-clima').textContent = partes[1]; 
            document.getElementById('velocidad-viento').textContent = `Viento: ${partes.slice(2).join(' ')}`;
            
            // Mostrar pronóstico en el contenedor separado
            document.getElementById('pronostico-actual').innerHTML = `
                <h4>Pronóstico Extendido:</h4>
                <ul>
                    <li>${lineasPronostico[0]}</li>
                    <li>${lineasPronostico[1]}</li>
                    <li>${lineasPronostico[2]}</li>
                </ul>
            `;
            
        } else if (widgetId === 'sajaroff') {
            // Actualiza el widget de Sajaroff
            document.getElementById('sajaroff-temp').textContent = partes[0];
            document.getElementById('sajaroff-desc').textContent = partes[1];
            document.getElementById('sajaroff-pronostico').innerHTML = `
                <ul>
                    <li>${lineasPronostico[0]}</li>
                    <li>${lineasPronostico[1]}</li>
                    <li>${lineasPronostico[2]}</li>
                </ul>
            `;
        }
        
    } catch (error) {
        console.error(`Error al obtener datos de ${ciudad}:`, error);
        document.getElementById(`${widgetId}-desc`).textContent = "Error de carga.";
        document.getElementById(`${widgetId}-temp`).textContent = "-- °C";
    }
}

// Función para el clima de la ubicación actual
async function obtenerClimaLocal(posicion) {
    const lat = posicion.coords.latitude;
    const lon = posicion.coords.longitude;
    
    // Usar OpenStreetMap para obtener la ciudad (Geocodificación inversa)
    const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;

    try {
        const geoResp = await fetch(geoUrl);
        const geoDatos = await geoResp.json();
        
        const ciudad = geoDatos.address.city || geoDatos.address.town || geoDatos.address.village || 'Tu Ubicación';
        
        // Llamada a la función central con la ciudad obtenida
        await fetchClima(ciudad, 'actual');

    } catch (error) {
        console.error("Error en geocodificación:", error);
        document.getElementById('ubicacion-nombre').textContent = "Ubicación desconocida";
        document.getElementById('descripcion-clima').textContent = "Error de geocodificación.";
    }
}


// ====================================================================
// 4. INICIALIZACIÓN
// ====================================================================

window.onload = function() {
    sincronizarHora();        
    obtenerUbicacion();       // Carga la ubicación y el clima local
    obtenerClimaSajaroff();   // Carga el clima de Sajaroff
    
    // NOTA: El ícono de clima sigue sin mostrarse porque wttr.in no lo proporciona fácilmente.
};
