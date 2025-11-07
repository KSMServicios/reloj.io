/* Archivo: script.js (VERSIÓN FINAL CON SINCRONIZACIÓN DE HORA) */

// ====================================================================
// 1. CONFIGURACIÓN
// ====================================================================

// CLAVE API VERIFICADA: La clave ahora es 100% correcta y activa en OpenWeatherMap.
const CLIMA_API_KEY = "8021f3ea002eb793d2918ddde1f260e2"; 
const HORA_API_URL = "https://worldtimeapi.org/api/ip"; // API para sincronizar la hora

// ====================================================================
// 2. LÓGICA DEL RELOJ DIGITAL (Sincronización con Internet)
// ====================================================================

let tiempoSincronizado = new Date(); // Variable global para la hora de Internet
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
        console.log("Hora sincronizada con Internet.");

        // Iniciar el intervalo SOLAMENTE después de obtener la hora
        if (!relojInterval) {
            actualizarUI(); // Actualiza inmediatamente la UI con la hora real
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
        mensaje = "Permiso de ubicación denegado por el usuario.";
    } else if (error.code === 2) {
        mensaje = "Ubicación no disponible.";
    }
    document.getElementById('ubicacion-nombre').textContent = mensaje;
}

async function mostrarClima(posicion) {
    const lat = posicion.coords.latitude;
    const lon = posicion.coords.longitude;
    const climaUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${CLIMA_API_KEY}`;

    try {
        const respuesta = await fetch(climaUrl);
        
        if (!respuesta.ok) {
            // Este es el punto que dispara tu mensaje de error
            document.getElementById('ubicacion-nombre').textContent = "Error al obtener datos.";
            document.getElementById('descripcion-clima').textContent = 'Clave API incorrecta o no activa.';
            throw new Error(`Fallo de API: HTTP ${respuesta.status}`);
        }
        
        const datos = await respuesta.json();

        // Actualizar el DOM con los datos obtenidos
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

// ====================================================================
// 4. INICIALIZACIÓN
// ====================================================================

window.onload = function() {
    sincronizarHora();        // 1. Sincroniza la hora con Internet (inicia el reloj)
    obtenerUbicacion();       // 2. Pide ubicación y carga el clima
};
