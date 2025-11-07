/* Archivo: script.js (SOLUCIÓN FINAL: Hora, Doble Clima y Pronóstico) */

// ====================================================================
// 1. CONFIGURACIÓN
// ====================================================================

const HORA_API_URL = "https://worldtimeapi.org/api/ip"; // API para sincronizar la hora

// Coordenadas de Rosario del Tala, Entre Ríos, Argentina (Fallback para ubicación)
const ROSARIO_DEL_TALA_COORD = { 
    lat: -32.3083, 
    lon: -58.9189,
    nombre: 'Rosario del Tala'
};

// ====================================================================
// 2. LÓGICA DEL RELOJ DIGITAL (Sincronización con Internet)
// ====================================================================

let tiempoSincronizado = new Date(); 
let relojInterval;

function actualizarUI() {
    // Incrementa el tiempo en 1 segundo
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
    // Capitaliza la primera letra del día de la semana
    document.getElementById('fecha-actual').textContent = fecha.charAt(0).toUpperCase() + fecha.slice(1);
}

async function sincronizarHora() {
    try {
        const respuesta = await fetch(HORA_API_URL);
        if (!respuesta.ok) {
             throw new Error("No se pudo obtener la hora de internet.");
        }
        const datos = await respuesta.json();
        // Inicializa el tiempo con la hora obtenida de internet
        tiempoSincronizado = new Date(datos.utc_datetime); 
        
        if (!relojInterval) {
            actualizarUI(); 
            // Inicia el intervalo para actualizar la hora cada segundo
            relojInterval = setInterval(actualizarUI, 1000);
        }

    } catch (error) {
        console.error("Fallo de sincronización de hora. Usando hora local del PC.");
        // Si falla la API, usa la hora local del dispositivo como respaldo
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
    // Intenta obtener la ubicación actual del navegador
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            obtenerClimaLocal, 
            manejarErrorYFallback, // Si falla, usa Rosario del Tala
            { enableHighAccuracy: true, timeout: 5000 } 
        );
    } else {
        // Si el navegador no soporta Geolocation, usa el fallback
        manejarErrorYFallback();
    }
}

// Fallback: Si la geolocalización falla o es denegada, usa Rosario del Tala
function manejarErrorYFallback(error) {
    if (error) {
        console.warn(`Error de geolocalización: Código ${error.code}. Usando fallback a Rosario del Tala.`);
    } else {
        console.warn("Geolocalización no soportada o fallida. Usando fallback a Rosario del Tala.");
    }
    
    // Configura el nombre de la ubicación inmediatamente en la UI
    document.getElementById('ubicacion-nombre').textContent = `${ROSARIO_DEL_TALA_COORD.nombre} (Ubicación por defecto)`;

    // Llama a la función de clima con datos de Rosario del Tala y la bandera de fallback
    obtenerClimaLocal({
        coords: {
            latitude: ROSARIO_DEL_TALA_COORD.lat,
            longitude: ROSARIO_DEL_TALA_COORD.lon
        },
        esFallback: true 
    });
}


async function obtenerClimaSajaroff() {
    const ciudad = 'Ingeniero Sajaroff, Argentina'; 
    await fetchClima(ciudad, 'sajaroff');
}

// Función Central de Obtención de Clima usando wttr.in
async function fetchClima(ciudad, widgetId) {
    
    // wttr.in: %t (temperatura) + %C (descripción) + %w (viento)
    const climaUrl = `https://wttr.in/${ciudad}?format=%t+%C+%w`; 

    // wttr.in: Pronóstico extendido (Fecha:%D + Temp Min-Max:%t + Descripción:%C)
    const pronosticoUrl = `https://wttr.in/${ciudad}?format=Fecha:%D+%t+%C\nFecha:%D+%t+%C\nFecha:%D+%t+%C`; 
    
    try {
        const climaResp = await fetch(climaUrl);
        const climaTexto = await climaResp.text();
        const partes = climaTexto.trim().split(' ');
        
        const temperatura = partes[0];
        const descripcionRaw = partes.slice(1, partes.length - 2).join(' '); 
        const vientoTexto = partes.length > 2 ? partes[partes.length - 2] + ' ' + partes[partes.length - 1] : '-- km/h';

        const pronosticoResp = await fetch(pronosticoUrl);
        const pronosticoTexto = await pronosticoResp.text();
        const lineasPronostico = pronosticoTexto.trim().split('\n');
        
        const iconoHTML = obtenerIconoClima(descripcionRaw);

        const prefix = widgetId === 'actual' ? '' : 'sajaroff-';
        
        if (widgetId === 'actual') {
             // Actualiza los elementos del widget local
             document.getElementById('temperatura').textContent = temperatura; 
             document.getElementById('descripcion-clima').textContent = descripcionRaw;
             document.getElementById('velocidad-viento').textContent = `Viento: ${vientoTexto}`;
             document.getElementById('icono-clima').innerHTML = iconoHTML;
        } else {
            // Actualiza los elementos del widget de Sajaroff
            document.getElementById(`${prefix}nombre`).textContent = ciudad;
            document.getElementById(`${prefix}temp`).textContent = temperatura; 
            document.getElementById(`${prefix}desc`).textContent = descripcionRaw; 
        }

        // Actualiza el pronóstico para el widget correspondiente
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
        const prefix = widgetId === 'actual' ? '' : 'sajaroff-';
        document.getElementById(`${prefix}desc`).textContent = "Error de carga.";
        document.getElementById(`${prefix}temp`).textContent = "-- °C";
        if (widgetId === 'actual') {
            document.getElementById('icono-clima').innerHTML = '❌';
        }
    }
}

// Función para obtener el nombre de la ubicación (si no es fallback) y llamar a fetchClima
async function obtenerClimaLocal(posicion) {
    const lat = posicion.coords.latitude;
    const lon = posicion.coords.longitude;
    const esFallback = posicion.esFallback || false;
    
    let ciudad;

    if (esFallback) {
        // Si es fallback, ya tenemos el nombre y solo necesitamos llamar a fetchClima con las coordenadas
        ciudad = ROSARIO_DEL_TALA_COORD.nombre;
        await fetchClima(ciudad, 'actual');
        return;
    }

    // 1. Geocodificación inversa para obtener la ciudad (Nominatim)
    const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;

    try {
        const geoResp = await fetch(geoUrl);
        const geoDatos = await geoResp.json();
        
        // Prioriza ciudad, pueblo o aldea
        ciudad = geoDatos.address.city || geoDatos.address.town || geoDatos.address.village || 'Tu Ubicación';
        
        document.getElementById('ubicacion-nombre').textContent = ciudad;
        await fetchClima(ciudad, 'actual');

    } catch (error) {
        console.error("Error en geocodificación. Usando coordenadas crudas:", error);
        // Si la geocodificación falla, usamos las coordenadas para wttr.in
        ciudad = `${lat},${lon}`;
        document.getElementById('ubicacion-nombre').textContent = "Ubicación sin nombre";
        await fetchClima(ciudad, 'actual');
    }
}


// ====================================================================
// 4. INICIALIZACIÓN
// ====================================================================

window.onload = function() {
    // Estas tres funciones deben ejecutarse al cargarse la página
    sincronizarHora();        
    obtenerUbicacion();       // Carga el clima local (o Rosario del Tala como fallback)
    obtenerClimaSajaroff();   // Carga el clima de Sajaroff
};
