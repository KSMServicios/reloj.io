/* Archivo: script.js */

// ====================================================================
// 1. CONFIGURACIÓN
// ====================================================================

// Reemplaza "TU_CLAVE_DE_OPENWEATHERMAP" con tu clave API
const CLIMA_API_KEY = "8021f3ea002eb793d2918ddde1f260e2; 

// ====================================================================
// 2. LÓGICA DEL RELOJ DIGITAL (Hora Local)
// ====================================================================

function actualizarReloj() {
    // La hora local se obtiene al instante y es precisa
    const ahora = new Date();
    
    // Formato HH:MM:SS (24 horas)
    const hora = ahora.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
    });
    document.getElementById('hora-actual').textContent = hora;

    // Formato de Fecha (Ej: Viernes, 8 de Noviembre de 2024)
    const fecha = ahora.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    // Pone la primera letra en mayúscula
    document.getElementById('fecha-actual').textContent = fecha.charAt(0).toUpperCase() + fecha.slice(1);
}

// ====================================================================
// 3. LÓGICA DE GEOLOCALIZACIÓN Y CLIMA
// ====================================================================

function obtenerUbicacion() {
    if (navigator.geolocation) {
        // Pide permiso de geolocalización
        navigator.geolocation.getCurrentPosition(
            mostrarClima, 
            manejarError, 
            { enableHighAccuracy: true } 
        );
    } else {
        document.getElementById('ubicacion-nombre').textContent = "Geolocalización no soportada por el navegador.";
    }
}

function manejarError(error) {
    let mensaje = "Error al obtener la ubicación.";
    if (error.code === 1) {
        mensaje = "Permiso de ubicación denegado por el usuario. No se puede obtener el clima.";
    } else if (error.code === 2) {
        mensaje = "Ubicación no disponible.";
    }
    document.getElementById('ubicacion-nombre').textContent = mensaje;
}

async function mostrarClima(posicion) {
    const lat = posicion.coords.latitude;
    const lon = posicion.coords.longitude;
    
    // Construcción de la URL de la API de clima
    const climaUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${CLIMA_API_KEY}`;

    try {
        const respuesta = await fetch(climaUrl);
        if (!respuesta.ok) {
            throw new Error('La clave API no es válida o hay un problema con la respuesta.');
        }
        const datos = await respuesta.json();

        // Actualizar el DOM con los datos obtenidos
        document.getElementById('ubicacion-nombre').textContent = datos.name;

        const temperatura = Math.round(datos.main.temp);
        document.getElementById('temperatura').textContent = `${temperatura}°C`;
        document.getElementById('descripcion-clima').textContent = datos.weather[0].description;
        
        const iconoCode = datos.weather[0].icon;
        document.getElementById('icono-clima').src = `http://openweathermap.org/img/wn/${iconoCode}@2x.png`;
        
        const vientoVelocidad = datos.wind.speed.toFixed(1);
        document.getElementById('velocidad-viento').textContent = `Viento: ${vientoVelocidad} m/s`;

    } catch (error) {
        console.error("Error al obtener datos del clima:", error);
        document.getElementById('ubicacion-nombre').textContent = "Error de API o clave incorrecta.";
        document.getElementById('descripcion-clima').textContent = "No se pudo cargar el clima.";
    }
}

// ====================================================================
// 4. INICIALIZACIÓN
// ====================================================================

window.onload = function() {
    obtenerUbicacion();       // Inicia el proceso de geolocalización y carga de clima
    actualizarReloj();        // Muestra la hora inmediatamente
    setInterval(actualizarReloj, 1000); // Actualiza el reloj cada 1 segundo
};