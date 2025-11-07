/* Archivo: script.js (SOLUCIÓN FINAL: Hora y Clima sin clave API) */

// ====================================================================
// 1. CONFIGURACIÓN
// ====================================================================

// La clave API de OpenWeatherMap fue eliminada. Usamos una API sin clave.
const HORA_API_URL = "https://worldtimeapi.org/api/ip"; // API para sincronizar la hora

// ====================================================================
// 2. LÓGICA DEL RELOJ DIGITAL (Sincronización con Internet)
// ====================================================================

let tiempoSincronizado = new Date(); 
let relojInterval;

function actualizarUI() {
    // Incrementamos la hora sincronizada en 1 segundo (esto es lo que permite que avance)
    tiempoSincronizado.setSeconds(tiempoSincronizado.getSeconds() + 1);
    const ahora = tiempoSincronizado;
    
    // Formato HH:MM:SS (24 horas)
    const hora = ahora.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
    });
    document.getElementById('hora-actual').textContent = hora;

    // Formato de Fecha
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
        // Inicializa la hora base con la hora UTC de internet
        tiempoSincronizado = new Date(datos.utc_datetime); 
        
        // Iniciar el intervalo SOLAMENTE después de obtener la hora
        if (!relojInterval) {
            actualizarUI(); 
            relojInterval = setInterval(actualizarUI, 1000);
        }

    } catch (error) {
        console.error("Fallo de sincronización de hora. Usando hora local del PC.");
        tiempoSincronizado = new Date(); // Fallback a la hora del PC
        if (!relojInterval) {
            actualizarUI(); 
            relojInterval = setInterval(actualizarUI, 1000);
        }
    }
}


// ====================================================================
// 3. LÓGICA DE GEOLOCALIZACIÓN Y CLIMA
// ====================================================================

function obtenerUbicacion() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            mostrarClima, 
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
    // Limpia la fuente del ícono en caso de error
    document.getElementById('icono-clima').src = ""; 
}

// *** FUNCIÓN CLIMA MODIFICADA PARA USAR wttr.in (SIN CLAVE API) ***
async function mostrarClima(posicion) {
    const lat = posicion.coords.latitude;
    const lon = posicion.coords.longitude;
    
    // 1. Geocodificación inversa: obtener la ciudad usando OpenStreetMap
    const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;

    try {
        // Obtiene el nombre de la ciudad
        const geoResp = await fetch(geoUrl);
        const geoDatos = await geoResp.json();
        
        // Busca la ciudad, pueblo o aldea en el resultado
        const ciudad = geoDatos.address.city || geoDatos.address.town || geoDatos.address.village || 'Ubicación';
        document.getElementById('ubicacion-nombre').textContent = ciudad;

        // 2. Obtener el clima de wttr.in (sin clave)
        // Formato: %t (temperatura) + %C (descripción) + %w (viento)
        const climaUrl = `https://wttr.in/${ciudad}?format=%t+%C+%w`; 
        
        const climaResp = await fetch(climaUrl);
        if (!climaResp.ok) {
            throw new Error(`Fallo al obtener el clima de wttr.in. HTTP ${climaResp.status}`);
        }
        
        const climaTexto = await climaResp.text();
        const partes = climaTexto.trim().split(' ');

        // Actualizar el DOM
        document.getElementById('temperatura').textContent = partes[0]; // Ej: +15°C
        
        // La descripción es la segunda parte
        document.getElementById('descripcion-clima').textContent = partes[1]; 
        
        // El viento es la tercera parte en adelante
        const vientoTexto = partes.length > 2 ? partes.slice(2).join(' ') : '-- km/h';
        document.getElementById('velocidad-viento').textContent = `Viento: ${vientoTexto}`;

        // NOTA: wttr.in no ofrece íconos, limpiamos el src para evitar errores
        document.getElementById('icono-clima').src = "";
        document.getElementById('icono-clima').alt = "Clima cargado";


    } catch (error) {
        console.error("Error al obtener datos del clima:", error);
        document.getElementById('ubicacion-nombre').textContent = "Error al cargar el clima.";
        document.getElementById('descripcion-clima').textContent = "No se pudo cargar la info de wttr.in.";
        document.getElementById('temperatura').textContent = "-- °C";
    }
}

// ====================================================================
// 4. INICIALIZACIÓN
// ====================================================================

window.onload = function() {
    sincronizarHora();        
    obtenerUbicacion();       
};
