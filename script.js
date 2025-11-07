/* Archivo: script.js */

// ====================================================================
// 1. CONFIGURACIÓN
// ====================================================================

// Clave API corregida. Asegúrate de que esta clave sea válida.
const CLIMA_API_KEY = "8021f3ea002eb793d2918ddde1f260e2"; 

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
    // La clave CLIMA_API_KEY ahora es sintácticamente correcta
    const climaUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${CLIMA_API_KEY}`;

    try {
        const respuesta = await fetch(climaUrl);
        
        // Verifica que la respuesta HTTP sea 200 (OK)
        if (!respuesta.ok) {
            // Un error 401 aquí significa que la clave API es incorrecta.
            if (respuesta.status === 401) {
                 throw new Error('Clave API incorrecta o expirada.');
            }
            throw new Error('No se pudo obtener datos del clima.');
        }
        
        const datos = await respuesta.json();

        // Actualizar el DOM con los datos obtenidos
        document.getElementById('ubicacion-nombre').textContent = datos.name;

        const temperatura = Math.round(datos.main.temp);
        document.getElementById('temperatura').textContent = `${temperatura}°C`;
        document.getElementById('descripcion-clima').textContent = datos.weather[0].description;
        
        const iconoCode = datos.weather[0].icon;
        // Corrección: Usar HTTPS para la URL del ícono por seguridad en GitHub Pages
        document.getElementById('icono-clima').src = `https://openweathermap.org/img/wn/${iconoCode}@2x.png`;
        
        const vientoVelocidad = datos.wind.speed.toFixed(1);
        document.getElementById('velocidad-viento').textContent = `Viento: ${vientoVelocidad} m/s`;

    } catch (error) {
        console.error("Error en mostrarClima:", error);
        document.getElementById('ubicacion-nombre').textContent = "Error al obtener datos.";
        document.getElementById('descripcion-clima').textContent = error.message || "Verifique la clave API.";
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