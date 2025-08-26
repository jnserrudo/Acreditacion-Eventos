// src/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { EventoABM } from "./Pages/EventoABM";
import { EventoDetalle } from "./Pages/EventoDetalle";
import { AcreditacionMode } from "./Pages/AcreditacionMode";
// import LoginPage from './pages/LoginPage'; // Si hay login
// import PrivateRoute from './components/common/PrivateRoute'; // Para proteger rutas

import "antd/dist/reset.css";

import "./style.css";
import { Layout, Typography } from "antd"; // Importa Layout y Typography

const { Header, Content } = Layout; // Extrae los componentes de Layout
const { Title } = Typography;
import { Toaster } from 'react-hot-toast'; // Importa Toaster


// Importa la pantalla de restricción
import RestrictedScreen from './Components/RestrictedScreen'; // Asegúrate que la ruta sea correcta


// --- Error Boundary ---
import { ErrorBoundary } from 'react-error-boundary'; // Importa de la librería
import ErrorFallback from './Components/ErrorFallback'; // Importa tu componente de fallback
// ---------------------
// Función para loguear errores (opcional pero recomendada)
const logError = (error, info) => {
  // Puedes enviar esto a un servicio de logging (Sentry, LogRocket, etc.)
  console.error("Error capturado por ErrorBoundary:", error, info);
};

// --- CONTROL DE LA PANTALLA DE RESTRICCIÓN ---
// Cambia a 'false' cuando quieras ver tu aplicación normal
const SHOW_RESTRICTED_SCREEN = false; 
// ----------------------------------------------


function App() {
  // const { isAuthenticated } = useAuth(); // Ejemplo si usas contexto de autenticación


 // Si quieres controlarlo con estado para cambiarlo sin recompilar (ej. desde devtools o una condición):
  // const [showRestricted, setShowRestricted] = useState(true);

  // Si la pantalla de restricción debe mostrarse, renderízala y nada más.
  if (SHOW_RESTRICTED_SCREEN) {
    // if (showRestricted) { // si usas el estado
      return <RestrictedScreen />;
    }

  return (
    <Router>
      {/* Podrías tener un Navbar/Layout común aquí */}

      <Layout>
 {/* Componente Toaster para manejar las notificaciones */}
 <Toaster
            position="top-center" // Posición (top-center, bottom-left, etc.)
            reverseOrder={false} // Orden de aparición
            gutter={8}          // Espacio entre toasts
            toastOptions={{     // Opciones por defecto
              // className: '', // Clases CSS personalizadas
              duration: 3000, // Duración por defecto
              style: {          // Estilos CSS inline
                background: '#363636',
                color: '#fff',
                marginTop: '60px'
              },
              // Estilos específicos por tipo
              success: {
                duration: 3000,
                theme: {
                  primary: 'green',
                  secondary: 'black',
                },
              },
               error: {
                duration: 4000, // Quizás mostrar errores un poco más
              },
            }}
          />
        
        {" "}
        {/* Envuelve todo en el Layout de AntD */}
        {/* Opcional: Un Header simple */}
        <Header
          style={{
            display: "flex",
            alignItems: "center",
            background: "#001529",
            padding: "0 20px",
          }}
        >
          <Title level={3} style={{ color: "white", margin: 0 }}>
            Sistema de Acreditación
          </Title>
          {/* Podrías añadir un logo o navegación aquí si fuera necesario */}
        </Header>
        <ErrorBoundary
           FallbackComponent={ErrorFallback} // Componente a mostrar en error
           onError={logError}                // Función para loguear el error
           onReset={() => {
              // Podrías intentar resetear algún estado global aquí si fuera necesario
              console.log("Intentando resetear estado desde ErrorBoundary onReset...");
           }}
        >
        {/* Contenido Principal */}
        <Content
          style={{ padding: "20px 30px", width: "100%", margin: "0 auto" }}
        >
          {" "}
          {/* Añade padding general */}
          {/* Contenedor interno para centrar y limitar ancho */}
          <div
            style={{
              background: "#fff",
              padding: "24px",
              minHeight: "calc(100vh - 64px - 40px)",
              /* header - padding Y */ borderRadius: "8px",
              
              
            }}
          >
            {" "}
            {/* Fondo blanco, padding, altura mínima, bordes, ancho máximo y centrado */}
            <Routes>
              {/* Ruta de Login (si aplica) */}
              {/* <Route path="/login" element={<LoginPage />} /> */}
              {/* Ruta Principal - Dashboard de Eventos */}
              <Route path="/events" element={<EventoABM />} />
              {/* <Route path="/events" element={ <PrivateRoute><EventsDashboard /></PrivateRoute> } /> */}{" "}
              {/* Con autenticación */}
              {/* Ruta Detalle de Evento */}
              <Route path="/events/:eventId" element={<EventoDetalle />} />
              {/* <Route path="/events/:eventId" element={ <PrivateRoute><EventDetail /></PrivateRoute> } /> */}
              {/* Ruta Modo Acreditación */}
              <Route
                path="/events/:eventId/accredit"
                element={<AcreditacionMode />}
              />
              {/* <Route path="/events/:eventId/accredit" element={ <PrivateRoute><AccreditationMode /></PrivateRoute> } /> */}
              {/* Redirección por defecto */}
              <Route path="*" element={<Navigate to="/events" replace />} />
              {/* O redireccionar a /login si no está autenticado */}
              {/* <Route path="*" element={<Navigate to={isAuthenticated ? "/events" : "/login"} replace />} /> */}
            </Routes>
          </div>
        </Content>
        </ErrorBoundary>
      </Layout>
    </Router>
  );
}

export default App;
