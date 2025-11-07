/* Archivo: script.js (SOLUCIÓN FINAL: Hora, Doble Clima y Pronóstico) */

// ====================================================================
// 1. CONFIGURACIÓN
// ====================================================================

// **Se ha eliminado la CLAVE API de OpenWeatherMap.**
const HORA_API_URL = "https://worldtimeapi.org/api/ip"; // API para sincronizar la hora

// ====================================================================
// 2. LÓGICA DEL RELOJ DIGITAL (Sincronización con Internet)
// ====================================================================

let tiempoSincronizado = new Date(); 
let relojInterval;

function actualizarUI() {
    tiempoSincronizado.setSeconds(tiempoSincronizado.getSeconds() + 1);
    const ahora = tiempoSincronizado;
    
    const hora = ahora.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
    });
    document.getElementById('hora-actual').textContent = hora;

    const fecha = ahora.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    document.getElementById('fecha-actual').textContent = fecha.charAt(0).toUpperCase() + fecha.slice(1);
}

async function sincronizarHora() {
    try {
        const respuesta = await fetch(HORA_API_URL);
        if (!respuesta.ok) {
             throw new Error("No se pudo obtener la hora de internet.");
        }
        const datos = await respuesta.json();
        tiempoSincronizado = new Date(datos.utc_datetime); 
        
        if (!relojInterval) {
            actualizarUI(); 
            relojInterval = setInterval(actualizarUI, 1000);
        }

    } catch (error) {
        console.error("Fallo de sincronización de hora. Usando hora local del PC.");
        tiempoSincronizado = new Date(); 
        if (!relojInterval) {
            actualizarUI(); 
            relojInterval = setInterval(actualizarUI, 1000);
        }
    }
}


// ====================================================================
// 3. LÓGICA DE GEOLOCALIZACIÓN Y CLIMA (wttr.in)
// ====================================================================

// Función para mapear la descripción de wttr.in a un ícono emoji
function obtenerIconoClima(descripcion) {
    descripcion = descripcion.toLowerCase();
    if (descripcion.includes('sol') || descripcion.includes('clear')) return '☀️';
    if (descripcion.includes('parcialmente nublado') || descripcion.includes('partly cloud')) return '🌤️';
    if (descripcion.includes('nube') || descripcion.includes('cloud')) return '☁️';
    if (descripcion.includes('lluvia') || descripcion.includes('rain') || descripcion.includes('chubasco')) return '🌧️';
    if (descripcion.includes('niebla') || descripcion.includes('fog')) return '🌫️';
    if (descripcion.includes('nieve') || descripcion.includes('snow')) return '❄️';
    if (descripcion.includes('tormenta') || descripcion.includes('thunder')) return '⛈️';
    return '🌡️'; 
}

function obtenerUbicacion() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            obtenerClimaLocal, 
            manejarError, 
            { enableHighAccuracy: true } 
        );
    } else {
        document.getElementById('ubicacion-nombre').textContent = "Geolocalización no soportada.";
    }
}

function manejarError(error) {
    let mensaje = "Error al obtener la ubicación.";
    if (error.code === 1) {
        mensaje = "Permiso de ubicación denegado.";
    } else if (error.code === 2) {
        mensaje = "Ubicación no disponible.";
    }
    document.getElementById('ubicacion-nombre').textContent = mensaje;
    document.getElementById('temperatura').textContent = "-- °C";
    document.getElementById('descripcion-clima').textContent = "Ubicación requerida.";
    document.getElementById('icono-clima').innerHTML = '📍'; 
}

async function obtenerClimaSajaroff() {
    const ciudad = 'Ingeniero Sajaroff, Argentina'; 
    await fetchClima(ciudad, 'sajaroff');
}

// Función Central de Obtención de Clima
async function fetchClima(ciudad, widgetId) {
    
    // wttr.in: %t (temperatura) + %C (descripción) + %w (viento)
    const climaUrl = `https://wttr.in/${ciudad}?format=%t+%C+%w`; 

    // wttr.in: Pronóstico extendido (Fecha:%D + Temp Min-Max:%t + Descripción:%C)
    const pronosticoUrl = `https://wttr.in/${ciudad}?format=Fecha:%D+%t+%C\nFecha:%D+%t+%C\nFecha:%D+%t+%C`; 
    
    try {
        // 1. Obtener datos actuales
        const climaResp = await fetch(climaUrl);
        const climaTexto = await climaResp.text();
        const partes = climaTexto.trim().split(' ');
        
        const temperatura = partes[0];
        // Extrae la descripción (partes del medio) y el viento (últimas dos partes)
        const descripcionRaw = partes.slice(1, partes.length - 2).join(' '); 
        const vientoTexto = partes.length > 2 ? partes[partes.length - 2] + ' ' + partes[partes.length - 1] : '-- km/h';

        // 2. Obtener pronóstico extendido
        const pronosticoResp = await fetch(pronosticoUrl);
        const pronosticoTexto = await pronosticoResp.text();
        const lineasPronostico = pronosticoTexto.trim().split('\n');
        
        // 3. Obtener el ícono
        const iconoHTML = obtenerIconoClima(descripcionRaw);

        // 4. Actualizar el DOM
        const prefix = widgetId === 'actual' ? '' : 'sajaroff-';

        document.getElementById(`${prefix}nombre`).textContent = ciudad;
        document.getElementById(`${prefix}temp`).textContent = temperatura; 
        document.getElementById(`${prefix}desc`).textContent = descripcionRaw; 
        
        if (widgetId === 'actual') {
            document.getElementById('velocidad-viento').textContent = `Viento: ${vientoTexto}`;
            document.getElementById('icono-clima').innerHTML = iconoHTML;
        }

        document.getElementById(`${widgetId}-pronostico`).innerHTML = `
            <h4>Pronóstico Extendido (3 Días):</h4>
            <ul>
                <li>${lineasPronostico[0]}</li>
                <li>${lineasPronostico[1]}</li>
                <li>${lineasPronostico[2]}</li>
            </ul>
        `;
        
    } catch (error) {
        console.error(`Error al obtener datos de ${ciudad}:`, error);
        // Fallback de UI
        const prefix = widgetId === 'actual' ? '' : 'sajaroff-';
        document.getElementById(`${prefix}desc`).textContent = "Error de carga.";
        document.getElementById(`${prefix}temp`).textContent = "-- °C";
        if (widgetId === 'actual') {
            document.getElementById('icono-clima').innerHTML = '❌';
        }
    }
}

// Función para el clima de la ubicación actual
async function obtenerClimaLocal(posicion) {
    const lat = posicion.coords.latitude;
    const lon = posicion.coords.longitude;
    
    // 1. Geocodificación inversa para obtener la ciudad (Nominatim)
    const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;

    try {
        const geoResp = await fetch(geoUrl);
        const geoDatos = await geoResp.json();
        
        const ciudad = geoDatos.address.city || geoDatos.address.town || geoDatos.address.village || 'Tu Ubicación';
        
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
    obtenerUbicacion();       // Carga el clima local
    obtenerClimaSajaroff();   // Carga el clima de Sajaroff
};
