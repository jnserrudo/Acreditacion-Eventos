// src/components/ErrorFallback.js (o donde prefieras)
import React from 'react';
import { Result, Button } from 'antd';

function ErrorFallback({ error, resetErrorBoundary }) {
  // Función para redirigir a la página principal de eventos
  const goHome = () => {
    window.location.href = '/events'; // Redirección simple y efectiva
  };

  // Función para intentar recargar la página actual (ofrecida por resetErrorBoundary)
  const tryAgain = () => {
    resetErrorBoundary(); // La librería intentará re-renderizar
    // Si el error persiste, el ErrorBoundary lo volverá a capturar.
    // Alternativamente, podrías forzar un reload completo:
    // window.location.reload();
  };

  // Loguear el error en la consola (útil para debugging)
  console.error("Error capturado:", error);

  return (
    <Result
      status="error"
      title="¡Ups! Algo salió mal."
      subTitle="Lo sentimos, encontramos un problema inesperado. Puedes intentar recargar o volver al inicio."
      extra={[
        <Button type="primary" key="home" onClick={goHome}>
          Ir a Eventos
        </Button>,
        <Button key="retry" onClick={tryAgain}>
          Intentar de nuevo
        </Button>,
      ]}
      style={{ padding: '40px 15px' }} // Añadir algo de padding
    >
      {/* Opcional: Mostrar detalles del error SOLO en desarrollo */}
      {process.env.NODE_ENV === 'development' && error && (
        <pre style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all', // Para que no se desborde el contenedor
          background: '#fffbe6', // Fondo amarillo pálido
          border: '1px solid #ffe58f', // Borde amarillo
          padding: '10px 15px',
          marginTop: '20px',
          fontSize: '0.85em',
          maxHeight: '300px', // Limitar altura y hacer scroll
          overflowY: 'auto',
          textAlign: 'left',
          color: '#6b4d04' // Color oscuro para texto
         }}>
          <strong>Detalles del Error (Solo Desarrollo):</strong><br />
          {error.toString()}
          <br /><br />
          {error.stack}
        </pre>
      )}
    </Result>
  );
}

export default ErrorFallback;