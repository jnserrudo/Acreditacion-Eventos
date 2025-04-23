// src/services/participante.services.js
import { entorno } from "./config.js";

// Nota: La mayoría de las rutas de participantes están anidadas bajo eventos
const RUTA_BASE_EVENTOS = `${entorno}/eventos`;
const RUTA_BASE_PARTICIPANTES = `${entorno}/participantes`; // Para acciones directas

/**
 * Obtiene todos los participantes de un evento específico.
 * @param {number|string} eventoId El ID del evento.
 * @returns {Promise<Array>} Una promesa que resuelve a un array de participantes.
 * @throws {Error} Si la respuesta de la red no es OK.
 */
export const getParticipantesByEventoId = async (eventoId) => {
  try {
    const response = await fetch(`${RUTA_BASE_EVENTOS}/${eventoId}/participantes`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Error ${response.status}` }));
       if (response.status === 404) { // Si el evento no existe
          throw new Error('Evento no encontrado para obtener participantes');
       }
      throw new Error(errorData.message || `Error al obtener participantes del evento ${eventoId}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error en getParticipantesByEventoId (eventoId: ${eventoId}):`, error);
    throw error;
  }
};

/**
 * Crea un nuevo participante asociado a un evento.
 * Se usará para carga manual y para cada fila de la carga masiva desde el frontend.
 * @param {number|string} eventoId El ID del evento al que pertenece.
 * @param {object} participanteData Los datos del participante (ej. { nombre, apellido, dni, numeroEntrada, ... }).
 * @returns {Promise<object>} Una promesa que resuelve al objeto del nuevo participante creado.
 * @throws {Error} Si la respuesta de la red no es OK (ej. 400 Bad Request, 404 Evento no encontrado, 409 Conflicto DNI/Entrada).
 */
export const createParticipante = async (eventoId, participanteData) => {
  try {
    const response = await fetch(`${RUTA_BASE_EVENTOS}/${eventoId}/participantes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(participanteData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Error ${response.status}` }));
      // El backend debería devolver códigos específicos para errores comunes
      if (response.status === 404) {
          throw new Error(errorData.message || 'Evento no encontrado para añadir participante');
       }
       if (response.status === 409) { // Conflicto (Duplicado)
         throw new Error(errorData.message || 'Conflicto al crear participante (DNI o Nro. Entrada ya existen)');
       }
       if (response.status === 400) { // Datos inválidos
         throw new Error(errorData.message || 'Datos del participante inválidos o incompletos');
       }
      throw new Error(errorData.message || `Error al crear participante: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error en createParticipante (eventoId: ${eventoId}):`, error);
    throw error;
  }
};

/**
 * Marca a un participante como acreditado.
 * @param {number|string} participanteId El ID del participante a acreditar.
 * @returns {Promise<object>} Una promesa que resuelve al objeto del participante actualizado.
 * @throws {Error} Si la respuesta de la red no es OK (ej. 404 Participante no encontrado).
 */
export const acreditarParticipante = async (participanteId) => {
  try {
    // Nota: No enviamos body, solo actualizamos el estado en el backend
    const response = await fetch(`${RUTA_BASE_PARTICIPANTES}/${participanteId}/acreditar`, {
      method: "PUT",
      headers: { // A veces útil incluir Content-Type incluso sin body para evitar problemas de servidor
          "Content-Type": "application/json",
      },
    });
     if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Error ${response.status}` }));
      if (response.status === 404) {
         throw new Error('Participante no encontrado para acreditar');
      }
      throw new Error(errorData.message || `Error al acreditar participante ${participanteId}: ${response.statusText}`);
    }
    return await response.json(); // Devuelve el participante actualizado con acreditado = true
  } catch (error) {
    console.error(`Error en acreditarParticipante (id: ${participanteId}):`, error);
    throw error;
  }
};

// --- Opcional: Buscar participante para acreditación ---
// Aunque la búsqueda se hace en el componente AcreditacionMode,
// podrías tener un servicio si la lógica se repite mucho.
// Sin embargo, la búsqueda actual usa el estado local, no una llamada API.
// Si necesitaras buscar EN EL BACKEND (ej. para bases de datos muy grandes):
/*
export const buscarParticipanteParaAcreditar = async (eventoId, searchTerm) => {
  try {
    // Asumiendo que creas un endpoint en el backend: GET /api/eventos/:eventoId/participantes/buscar?term=...
    const response = await fetch(`${RUTA_BASE_EVENTOS}/${eventoId}/participantes/buscar?term=${encodeURIComponent(searchTerm)}`);
    if (!response.ok) {
       if (response.status === 404) return null; // No encontrado devuelve null
       const errorData = await response.json().catch(() => ({ message: `Error ${response.status}` }));
       throw new Error(errorData.message || `Error al buscar participante: ${response.statusText}`);
    }
    // Si devuelve 200 OK pero sin cuerpo (porque no se encontró), podría necesitar manejo especial
    const data = await response.json();
    return data; // Devuelve el participante encontrado o quizás null/undefined si la API lo maneja así
  } catch (error) {
    console.error(`Error en buscarParticipanteParaAcreditar (eventoId: ${eventoId}, term: ${searchTerm}):`, error);
    throw error;
  }
}
*/