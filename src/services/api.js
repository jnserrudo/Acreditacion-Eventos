// src/services/api.js

// Define la URL base de tu API backend.
// Ajústala si tu backend corre en un puerto o dominio diferente.
// Ejemplos:
// const BASE_URL = 'http://localhost:3001/api'; // Si corre localmente en el puerto 3001
// const BASE_URL = '/api'; // Si el frontend se sirve desde el mismo servidor que el backend (usando un proxy)
const BASE_URL = '/api';

// --- Funciones Auxiliares (Opcional, para manejo común de errores) ---
/**
 * Función auxiliar para manejar respuestas de fetch y errores comunes.
 * @param {Response} response - El objeto Response de fetch.
 * @returns {Promise<any>} - El cuerpo de la respuesta parseado como JSON.
 * @throws {Error} - Si la respuesta no es OK, lanza un error con el mensaje del backend o estado HTTP.
 */
const handleResponse = async (response) => {
    if (!response.ok) {
        let errorData;
        try {
            // Intenta obtener detalles del error desde el cuerpo JSON
            errorData = await response.json();
        } catch (e) {
            // Si no hay cuerpo JSON o falla el parseo, usa el statusText
            errorData = { message: response.statusText };
        }
        // Lanza un error con el mensaje específico o el genérico
        throw new Error(errorData?.message || `Error ${response.status}`);
    }
    // Si la respuesta es OK, intenta parsear como JSON
    try {
        // Si el status es 204 (No Content), no hay cuerpo para parsear
        if (response.status === 204) {
            return { success: true }; // O simplemente null o undefined
        }
        return await response.json();
    } catch (e) {
        // Si hay un error al parsear un cuerpo que debería ser JSON (inesperado con response.ok)
        console.error("Error parsing JSON response:", e);
        throw new Error("Error al procesar la respuesta del servidor.");
    }
};

// --- Funciones de API para Eventos ---

/**
 * Obtiene la lista de todos los eventos.
 * @returns {Promise<Array<object>>} - Un array de objetos de evento.
 */
export const getEvents = async () => {
    const response = await fetch(`${BASE_URL}/events`);
    return handleResponse(response); // Usa la función auxiliar
};

/**
 * Crea un nuevo evento.
 * @param {object} eventData - Los datos del evento a crear (ej: { name: '...', date: '...' }).
 * @returns {Promise<object>} - El objeto del evento recién creado.
 */
export const createEvent = async (eventData) => {
    const response = await fetch(`${BASE_URL}/events`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Añadir cabeceras de autenticación si son necesarias
            // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData),
    });
    return handleResponse(response);
};

/**
 * Obtiene los detalles de un evento específico por su ID.
 * @param {string} eventId - El ID del evento.
 * @returns {Promise<object>} - El objeto del evento detallado.
 */
export const getEventDetails = async (eventId) => {
    const response = await fetch(`${BASE_URL}/events/${eventId}`);
    return handleResponse(response);
};

/**
 * (Opcional) Actualiza un evento existente.
 * @param {string} eventId - El ID del evento a actualizar.
 * @param {object} eventData - Los datos actualizados del evento.
 * @returns {Promise<object>} - El objeto del evento actualizado.
 */
export const updateEvent = async (eventId, eventData) => {
    const response = await fetch(`${BASE_URL}/events/${eventId}`, {
        method: 'PUT', // O 'PATCH' si solo envías los campos modificados
        headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData),
    });
    return handleResponse(response);
};

/**
 * (Opcional) Elimina un evento por su ID.
 * @param {string} eventId - El ID del evento a eliminar.
 * @returns {Promise<object>} - Una confirmación de éxito (ej: { success: true }).
 */
export const deleteEvent = async (eventId) => {
    const response = await fetch(`${BASE_URL}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
            // 'Authorization': `Bearer ${token}`
        },
    });
    // DELETE a menudo devuelve 204 No Content, que handleResponse maneja
    return handleResponse(response);
};

// --- Funciones de API para Participantes ---

/**
 * Obtiene la lista de participantes para un evento específico.
 * El backend podría soportar filtros como query params, ej: ?status=accredited
 * @param {string} eventId - El ID del evento.
 * @returns {Promise<Array<object>>} - Un array de objetos de participante (con id, name, dni, isAccredited, etc.).
 */
export const getParticipants = async (eventId) => {
    const response = await fetch(`${BASE_URL}/events/${eventId}/participants`);
    return handleResponse(response);
};

/**
 * Busca un participante dentro de un evento por su DNI.
 * @param {string} eventId - El ID del evento.
 * @param {string} dni - El DNI a buscar.
 * @returns {Promise<object|null>} - El objeto participante si se encuentra, o null si no (devuelto por el backend como 404).
 */
export const searchParticipantByDNI = async (eventId, dni) => {
    const response = await fetch(`${BASE_URL}/events/${eventId}/participants/search?dni=${encodeURIComponent(dni)}`);
    // Manejo especial para 404 (No encontrado)
    if (response.status === 404) {
        return null; // Indica explícitamente que no se encontró
    }
    return handleResponse(response); // Dejar que handleResponse maneje otros errores o éxito
};

/**
 * Marca a un participante como acreditado.
 * @param {string} eventId - El ID del evento.
 * @param {string} participantId - El ID del participante a acreditar.
 * @returns {Promise<object>} - Confirmación o el participante actualizado.
 */
export const accreditParticipant = async (eventId, participantId) => {
    const response = await fetch(`${BASE_URL}/events/${eventId}/participants/${participantId}/accredit`, {
        method: 'POST', // O 'PATCH' o 'PUT' dependiendo de tu diseño de API
        headers: {
            'Content-Type': 'application/json', // Puede no ser necesaria si no hay body
            // 'Authorization': `Bearer ${token}`
        },
        // Body opcional, el backend puede solo necesitar el ID en la URL
        // body: JSON.stringify({ accredited: true })
    });
    return handleResponse(response);
};

/**
 * Sube un archivo de participantes (Excel/CSV) al backend para un evento específico.
 * @param {string} eventId - El ID del evento.
 * @param {File} file - El objeto File (del input o Upload de AntD).
 * @returns {Promise<any>} - La respuesta del backend (ej. { count: 50, message: '...' }).
 */
export const importParticipantsFile = async (eventId, file) => {
    const formData = new FormData();
    formData.append('file', file); // La clave 'file' debe coincidir con el backend

    const response = await fetch(`${BASE_URL}/events/${eventId}/participants/import`, {
        method: 'POST',
        body: formData,
        // NO establecer 'Content-Type', el navegador lo hace por FormData
        headers: {
            // 'Authorization': `Bearer ${token}`
        },
    });
    // No usamos handleResponse aquí directamente porque el manejo de FormData/errores puede ser sutil
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { message: response.statusText };
        }
        throw new Error(errorData?.message || `Error ${response.status} al importar archivo.`);
    }
    try {
        return await response.json();
    } catch (e) {
        // Si el backend devuelve 2xx sin cuerpo JSON válido
        return { success: true, message: 'Importación iniciada o completada.' };
    }
};

// --- (Opcional) Funciones para Reportes ---

/**
 * (Ejemplo) Descarga el reporte de acreditación.
 * Esta función podría simplemente construir la URL para un enlace de descarga.
 * @param {string} eventId - El ID del evento.
 * @returns {string} - La URL para descargar el reporte.
 */
export const getAccreditationReportUrl = (eventId) => {
    // Asume que el backend tiene un endpoint GET que genera y sirve el archivo
    // Puede necesitar incluir token de autenticación si la descarga está protegida
    return `${BASE_URL}/events/${eventId}/report/download`; //?token=${token} si es necesario
};

// Podrías tener una función que *fetch* los datos del reporte si no es una descarga directa:
// export const getAccreditationData = async (eventId) => { ... }