// src/Components/RestrictedScreen.jsx
import React from 'react';

const RestrictedScreen = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>
        Sitio Web Restringido por el Desarrollador Debido a Pagos Pendientes de Desarrollo.
      </h1>
      <p style={styles.subtitle}>
        Si eres el propietario del sitio, contacta al desarrollador y realiza el pago,
        <br />
        Después de cierta fecha se perderán todos los datos del sitio web.
      </p>
      <button style={styles.button}>
        Contactar al Desarrollador
      </button>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#1a0000', // Un rojo muy oscuro, ajusta según la imagen
    color: '#ff6b6b', // Un rojo/naranja claro para el texto, ajusta
    padding: '20px',
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif', // O la fuente que más se parezca
    position: 'fixed', // Para cubrir toda la pantalla
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 9999, // Para asegurar que esté encima de todo
  },
  title: {
    fontSize: 'clamp(1.8rem, 5vw, 3rem)', // Tamaño responsivo
    fontWeight: 'bold',
    margin: '0 0 20px 0',
    lineHeight: '1.3',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)', // Sombra para el texto
  },
  subtitle: {
    fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)',
    margin: '0 0 30px 0',
    maxWidth: '700px',
    lineHeight: '1.5',
  },
  button: {
    backgroundColor: '#cc0000', // Rojo más brillante para el botón
    color: 'white',
    border: 'none',
    padding: '12px 25px',
    borderRadius: '5px',
    fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
    cursor: 'pointer',
    fontWeight: 'bold',
    boxShadow: '0px 4px 8px rgba(0,0,0,0.3)',
  },
};

export default RestrictedScreen;