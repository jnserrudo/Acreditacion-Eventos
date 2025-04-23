// src/services/config.js

// Lee la variable de entorno específica para la URL de la API.
// En Create React App sería REACT_APP_API_URL, en Vite es VITE_API_URL.
// Asegúrate de crear un archivo .env en la raíz de tu proyecto frontend.
const API_URL_FROM_ENV = import.meta.env.VITE_API_URL; // Para Vite
// const API_URL_FROM_ENV = process.env.REACT_APP_API_URL; // Para Create React App

// URL de desarrollo local (si la variable de entorno no está definida)
const LOCAL_API_URL = 'http://localhost:3001/api'; // Asumiendo que tu backend corre en 3001

// La URL base de tu API backend
export const entorno = API_URL_FROM_ENV || LOCAL_API_URL;

console.log(`API Entorno: ${entorno}`); // Para verificar qué URL se está usando