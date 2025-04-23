// src/services/evento.services.js
import { entorno } from "./config.js"; // Importa la URL base

const RUTA_EVENTOS = `${entorno}/eventos`; // Ruta base para eventos

/**
 * Obtiene todos los eventos.
 * @returns {Promise<Array>} Una promesa que resuelve a un array de eventos.
 * @throws {Error} Si la respuesta de la red no es OK.
 */
export const getAllEventos = async () => {
  try {
    const response = await fetch(RUTA_EVENTOS);
    if (!response.ok) {
      // Si el servidor devuelve un error (4xx, 5xx), intenta leer el mensaje
      const errorData = await response.json().catch(() => ({ message: `Error ${response.status}` }));
      throw new Error(errorData.message || `Error al obtener eventos: ${response.statusText}`);
    }
    return await response.json(); // Devuelve el array de eventos
  } catch (error) {
    console.error("Error en getAllEventos:", error);
    throw error; // Relanza el error para que el componente lo maneje
  }
};

/**
 * Obtiene un evento específico por su ID.
 * @param {number|string} id El ID del evento.
 * @returns {Promise<object>} Una promesa que resuelve al objeto del evento.
 * @throws {Error} Si la respuesta de la red no es OK (ej. 404 Not Found).
 */
export const getEventoById = async (id) => {
  try {
    const response = await fetch(`${RUTA_EVENTOS}/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Error ${response.status}` }));
       if (response.status === 404) {
          throw new Error('Evento no encontrado');
       }
      throw new Error(errorData.message || `Error al obtener evento ${id}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error en getEventoById (id: ${id}):`, error);
    throw error;
  }
};

/**
 * Crea un nuevo evento.
 * @param {object} eventoData Los datos del evento a crear (ej. { nombre, fecha, lugar, descripcion }).
 * @returns {Promise<object>} Una promesa que resuelve al objeto del nuevo evento creado.
 * @throws {Error} Si la respuesta de la red no es OK (ej. 400 Bad Request).
 */
export const createEvento = async (eventoData) => {
  try {
    console.log("eventoData", eventoData);

    const response = await fetch(RUTA_EVENTOS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventoData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Error ${response.status}` }));
      throw new Error(errorData.message || `Error al crear evento: ${response.statusText}`);
    }
    return await response.json(); // Devuelve el evento creado
  } catch (error) {
    console.error("Error en createEvento:", error);
    throw error;
  }
};

/**
 * Actualiza un evento existente.
 * @param {number|string} id El ID del evento a actualizar.
 * @param {object} eventoData Los datos actualizados del evento.
 * @returns {Promise<object>} Una promesa que resuelve al objeto del evento actualizado.
 * @throws {Error} Si la respuesta de la red no es OK (ej. 404 Not Found, 400 Bad Request).
 */
export const updateEvento = async (id, eventoData) => {
  try {
    const response = await fetch(`${RUTA_EVENTOS}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventoData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Error ${response.status}` }));
       if (response.status === 404) {
          throw new Error('Evento no encontrado para actualizar');
       }
      throw new Error(errorData.message || `Error al actualizar evento ${id}: ${response.statusText}`);
    }
    return await response.json(); // Devuelve el evento actualizado
  } catch (error) {
    console.error(`Error en updateEvento (id: ${id}):`, error);
    throw error;
  }
};

/**
 * Elimina un evento por su ID.
 * @param {number|string} id El ID del evento a eliminar.
 * @returns {Promise<boolean>} Una promesa que resuelve a true si se eliminó con éxito.
 * @throws {Error} Si la respuesta de la red no es OK (ej. 404 Not Found, 409 Conflict).
 */
export const deleteEvento = async (id) => {
  try {
    const response = await fetch(`${RUTA_EVENTOS}/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      // Para DELETE, un 204 No Content es éxito, pero response.ok será true.
      // Si no es ok, hubo un error real.
      const errorData = await response.json().catch(() => ({ message: `Error ${response.status}` }));
      if (response.status === 404) {
         throw new Error('Evento no encontrado para eliminar');
      }
       if (response.status === 409) { // Conflicto (ej. no se puede borrar por participantes)
         throw new Error(errorData.message || 'No se pudo eliminar el evento (posiblemente tiene participantes asociados)');
       }
      throw new Error(errorData.message || `Error al eliminar evento ${id}: ${response.statusText}`);
    }
    // Si la respuesta es ok (podría ser 200 OK o 204 No Content), la eliminación fue exitosa.
    return true;
  } catch (error) {
    console.error(`Error en deleteEvento (id: ${id}):`, error);
    throw error;
  }
};