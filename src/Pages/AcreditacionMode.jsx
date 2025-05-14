// src/Pages/AcreditacionMode.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Input,
  Button,
  Spin,
  Typography,
  Alert,
  Space,
  Card,
  Tag,
  Row,
  Col,
  Descriptions,
} from "antd";
import { ArrowLeftOutlined, SearchOutlined } from "@ant-design/icons";
import { toast } from "react-hot-toast";
// QUITAR: Importación de variables globales simuladas
// import { currentEvents, currentParticipants } from "./EventoABM";

// Importar Servicios de API
import { getEventoById } from "../services/evento.services.js"; // Para obtener nombre del evento
import {
  getParticipantesByEventoId,
  acreditarParticipante,
} from "../services/participante.services.js"; // Para lista y acreditar

import { io } from "socket.io-client"; // <--- 1. Importa io de socket.io-client
// Cerca del principio, junto a otros imports de servicios
import { entorno as apiBaseUrl } from "../services/config.js";

const { Title, Text, Paragraph } = Typography;

// --- DERIVAR URL PARA SOCKET.IO ---
// Quita '/api' del final si existe, para obtener la URL base del servidor
const socketUrl = apiBaseUrl.replace(/\/api$/, "");
// Ejemplo:
// Si apiBaseUrl = 'http://localhost:3001/api', socketUrl = 'http://localhost:3001'
// Si apiBaseUrl = 'https://....onrender.com/api', socketUrl = 'https://....onrender.com'
// -----------------------------------

export const AcreditacionMode = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  // --- Estados Locales ---
  const [eventoNombre, setEventoNombre] = useState("");
  const [participantes, setParticipantes] = useState([]); // Lista REAL de participantes del evento
  const [loading, setLoading] = useState(true); // Carga inicial de datos
  const [error, setError] = useState(null); // Error de carga inicial

  // Estados para la funcionalidad de búsqueda/acreditación
  const [dniInput, setDniInput] = useState(""); // Input de búsqueda
  const [searchStatus, setSearchStatus] = useState("idle"); // Estado de la búsqueda/resultado
  const [foundParticipant, setFoundParticipant] = useState(null); // Participante encontrado
  const [isProcessing, setIsProcessing] = useState(false); // Estado para la llamada API de acreditar

  const socketRef = useRef(null); // <--- 3. Ref para guardar la instancia del socket

  const dniInputRef = useRef(null); // Referencia al input para foco

  // --- EFECTO PARA CONEXIÓN/DESCONEXIÓN DEL SOCKET ---
  useEffect(() => {
    const numericEventId = parseInt(eventId);
    if (isNaN(numericEventId) || !socketUrl) return;

    // Conecta solo si no está ya conectado
    if (!socketRef.current) {
      console.log(`Conectando socket a: ${socketUrl}`);
      socketRef.current = io(socketUrl, {
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });
    }

    const socket = socketRef.current;

    // --- Listener para conexión ---
    const handleConnect = () => {
      console.log("Socket conectado:", socket.id);
      socket.emit("join_event_room", numericEventId);
    };

    // --- Listener para desconexión ---
    const handleDisconnect = (reason) => {
      console.log("Socket desconectado:", reason);
      if (reason !== "io client disconnect") {
        toast.error("Conexión perdida (tiempo real).", { duration: 4000 });
      }
    };

    // --- Listener para errores ---
    const handleConnectError = (err) => {
      console.error("Error conexión Socket:", err);
    };

    // Registrar listeners básicos de conexión
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    // --- Función de Limpieza ---
    // Se ejecuta SOLO cuando eventId o socketUrl cambian, o al desmontar
    return () => {
      console.log("Limpiando efecto de CONEXIÓN WebSocket...");
      if (socket) {
        console.log(
          `Emitiendo leave_event_room para ${numericEventId} y desconectando.`
        );
        socket.emit("leave_event_room", numericEventId);
        socket.disconnect(); // Desconecta el socket
        socketRef.current = null; // Limpia la referencia
        // Quita los listeners básicos también
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
        socket.off("connect_error", handleConnectError);
      }
    };
    // SOLO depende de eventId y socketUrl
  }, [eventId, socketUrl]);

  // --- EFECTO PARA ESCUCHAR ACTUALIZACIONES ---
  // Este efecto se ejecuta una vez (o si el socket cambia, lo cual no debería pasar a menudo)
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return; // Si no hay socket, no hagas nada

    const numericEventId = parseInt(eventId); // Necesitamos el ID aquí también

    // --- Listener para actualizaciones ---
    const handleParticipantUpdate = (updatedParticipant) => {
      console.log(`[${socket.id}] RECIBIDO participant_updated en ${window.location.pathname}:`, updatedParticipant);


      console.log("Recibido [participant_updated]:", updatedParticipant);
      if (updatedParticipant?.eventoId !== numericEventId) return;

      // Actualiza la lista principal de participantes
      setParticipantes((prev) =>
        prev.map((p) =>
          p.id === updatedParticipant.id ? updatedParticipant : p
        )
      );

      // Actualiza el participante encontrado (SI existe y coincide el ID)
      // Es importante usar el valor MÁS RECIENTE de foundParticipant aquí.
      // React asegura que setFoundParticipant use el valor actual en el momento de la actualización.
      setFoundParticipant((prevFound) => {
        if (prevFound?.id === updatedParticipant.id) {
          // Revisa si el estado de búsqueda necesita cambiar AHORA
          if (!prevFound.acreditado && updatedParticipant.acreditado) {
            // Si estaba 'found' (pendiente) y ahora está acreditado
            setSearchStatus("already_accredited");
            toast(
              `"${updatedParticipant.nombre} ${updatedParticipant.apellido}" fue acreditado por otro usuario.`,
              { icon: "ℹ️" }
            );
          }
          return updatedParticipant; // Actualiza el participante encontrado
        }
        return prevFound; // Mantiene el participante encontrado si no es el actualizado
      });
    };

    // Registrar el listener de actualizaciones
    socket.on("participant_updated", handleParticipantUpdate);

    // --- Limpieza para ESTE efecto ---
    // Quita SOLO el listener de actualizaciones al desmontar o si el socket cambia
    return () => {
      console.log("Quitando listener participant_updated...");
      if (socket) {
        socket.off("participant_updated", handleParticipantUpdate);
      }
    };
    // Este efecto depende de 'eventId' para asegurar que el ID usado en el listener es correcto
    // Y también de 'foundParticipant' y 'searchStatus' para que la lógica DENTRO del listener
    // que los usa, se re-evalúe con los valores más recientes si esos estados cambian
    // (aunque la actualización principal del estado se hace con la función setter que ya tiene el valor correcto).
    // Probemos quitando foundParticipant y searchStatus de aquí a ver si funciona estable:
  }, [eventId]); // <-- Dependencia reducida

  // --- Función para Cargar Datos Iniciales (Nombre Evento y Lista Participantes) ---
  const cargarDatosIniciales = useCallback(async () => {
    const numericEventId = parseInt(eventId);
    if (isNaN(numericEventId)) {
      setError("ID de evento inválido.");
      setLoading(false);
      toast.error("ID de evento inválido.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Llama a ambas APIs en paralelo
      const [eventoData, participantesData] = await Promise.all([
        getEventoById(numericEventId),
        getParticipantesByEventoId(numericEventId),
      ]);
      setEventoNombre(eventoData.nombre);
      setParticipantes(participantesData); // Guarda la lista completa de participantes
    } catch (err) {
      console.error("Error al cargar datos para acreditación:", err);
      const errorMessage = err.message || `Error al cargar datos iniciales.`;
      setError(errorMessage);
      toast.error(errorMessage);
      // Considerar redirección si falla la carga
      // if (errorMessage.toLowerCase().includes('no encontrado')) {
      //   navigate('/events', { replace: true });
      // }
    } finally {
      setLoading(false);
      dniInputRef.current?.focus(); // Foco en el input al terminar
    }
  }, [eventId, navigate]);

  // --- Efecto para Cargar Datos al Montar ---
  useEffect(() => {
    cargarDatosIniciales();
  }, [cargarDatosIniciales]);

  // --- Efecto para Limpiar Búsqueda Automáticamente ---
  useEffect(() => {
    let timer;
    // Ajusta los delays como prefieras
    const delay = searchStatus === "success_accredited" ? 2000 : 4000;
    if (
      ["success_accredited", "not_found", "already_accredited"].includes(
        searchStatus
      )
    ) {
      timer = setTimeout(resetSearch, delay); // Limpia después de un tiempo
    }
    // No incluimos 'error' aquí, ya que el error es de carga inicial
    return () => clearTimeout(timer);
  }, [searchStatus]);

  // --- Búsqueda (LOCAL en la lista 'participantes' del estado) ---
  const handleSearch = () => {
    if (!dniInput.trim()) return;

    setSearchStatus("searching"); // Indica que se está buscando
    setFoundParticipant(null);
    setIsProcessing(false); // No estamos procesando API aquí

    const searchTerm = dniInput.trim().toLowerCase(); // Normaliza término de búsqueda

    // Busca en la lista de participantes cargada en el estado
    const participant = participantes.find(
      (p) =>
        p.dni?.toLowerCase() === searchTerm ||
        p.numeroEntrada?.toLowerCase() === searchTerm ||
        p.nuevaEntrada?.toLowerCase() === searchTerm
    );

    // Simula un pequeño delay si quieres feedback visual incluso en búsquedas rápidas
    setTimeout(() => {
      if (participant) {
        setFoundParticipant(participant); // Guarda el encontrado
        // Define el estado basado en si ya está acreditado (campo 'acreditado' booleano)
        setSearchStatus(
          participant.acreditado ? "already_accredited" : "found"
        );
      } else {
        setSearchStatus("not_found"); // No se encontró
      }
    }, 50); // Delay mínimo
  };

  // --- Acreditar (Llamada a la API) ---
  const handleAccredit = async () => {
    // Verifica que haya un participante encontrado, que no esté ya acreditado y que no se esté procesando
    if (!foundParticipant || foundParticipant.acreditado || isProcessing) {
      return;
    }

    setIsProcessing(true); // Inicia estado de carga para la API
    const participantId = foundParticipant.id;
    const participantName = `${foundParticipant.nombre} ${foundParticipant.apellido}`;

    try {
      // --- LLAMADA API: ACREDITAR PARTICIPANTE ---
      const participanteActualizado = await acreditarParticipante(
        participantId
      );

      // Si la API tuvo éxito:
      // 1. Actualiza la lista local 'participantes' para consistencia futura
      setParticipantes((prev) =>
        prev.map((p) =>
          p.id === participantId ? { ...p, acreditado: true } : p
        )
      );
      // 2. Actualiza el 'foundParticipant' para que la UI muestre el estado correcto
      setFoundParticipant(participanteActualizado);
      // 3. Cambia el estado para mostrar éxito
      setSearchStatus("success_accredited");
      toast.success(`¡${participantName} acreditado!`);
    } catch (apiError) {
      // Si la API falla
      console.error("Error al acreditar vía API:", apiError);
      toast.error(apiError.message || "No se pudo acreditar al participante.");
      // Podrías volver al estado 'found' para permitir reintentar, o dejarlo como está
      // setSearchStatus('found');
    } finally {
      setIsProcessing(false); // Finaliza estado de carga de la API
    }
  };

  // --- Resetear Búsqueda ---
  const resetSearch = () => {
    setDniInput("");
    setSearchStatus("idle");
    setFoundParticipant(null);
    setIsProcessing(false); // Asegura resetear estado de procesamiento
    dniInputRef.current?.focus(); // Foco de nuevo en el input
  };

  // --- Renderizado del Resultado de Búsqueda/Acreditación ---
  const renderResult = () => {
    // El switch case permanece igual, usa los estados actualizados
    switch (searchStatus) {
      case "searching":
        return (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin tip="Buscando..." />
          </div>
        );
      case "not_found":
        return (
          <Alert
            message="No Encontrado"
            description={`No se encontró participante con DNI o Nro. Entrada "${dniInput}" para este evento.`}
            type="warning"
            showIcon
          />
        );
      case "already_accredited":
        return (
          <Alert
            message="Participante Ya Acreditado"
            description={
              <Text>
                <strong>
                  {foundParticipant?.nombre} {foundParticipant?.apellido}
                </strong>{" "}
                (DNI: {foundParticipant?.dni} / Entrada:{" "}
                {foundParticipant?.numeroEntrada}) ya fue acreditado.
              </Text>
            }
            type="info"
            showIcon
          />
        );
      case "success_accredited": // Muestra éxito después de acreditar
        return (
          <Alert
            message="¡Acreditado Correctamente!"
            description={
              <Text strong style={{ fontSize: "1.1em" }}>
                <strong>
                  {foundParticipant?.nombre} {foundParticipant?.apellido}
                </strong>{" "}
                (DNI: {foundParticipant?.dni} / Entrada:{" "}
                {foundParticipant?.numeroEntrada})
              </Text>
            }
            type="success"
            showIcon
          />
        );
      case "found": // Muestra participante encontrado y botón para acreditar
        // --- Lógica para determinar estado de pago ---
        const monto = parseFloat(foundParticipant?.montoPagado || 0);
        // Intenta parsear precioEntrada, será NaN si es null o inválido
        const precio = parseFloat(foundParticipant?.precioEntrada);
        let estadoPagoTag = <Tag color="default">N/A (Sin Precio)</Tag>;
        let pagoIncompleto = true; // Asume incompleto por defecto o si no hay precio

        if (!isNaN(precio)) {
          // Solo si hay un precio de entrada válido
          if (monto >= precio) {
            estadoPagoTag = <Tag color="success">Total</Tag>;
            pagoIncompleto = false; // Pago completo
          } else if (monto > 0) {
            estadoPagoTag = <Tag color="warning">Parcial</Tag>;
            pagoIncompleto = true;
          } else {
            estadoPagoTag = <Tag color="error">Pendiente</Tag>;
            pagoIncompleto = true;
          }
        } else {
          // Si no hay precio, no se puede acreditar (según lógica backend)
          pagoIncompleto = true;
        }
        // -----------------------------------------

        return (
          <Card
            title={
              <Title level={4} style={{ margin: 0 }}>
                Participante Encontrado
              </Title>
            }
            bordered
            style={{ borderColor: "#1890ff" }}
          >
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              {/* --- Alerta si el pago está incompleto o falta precio --- */}
              {pagoIncompleto && (
                <Alert
                  message={
                    isNaN(precio)
                      ? "Precio de Entrada no asignado"
                      : "Pago Incompleto"
                  }
                  description={
                    isNaN(precio)
                      ? "Asigne un precio de entrada para poder acreditar."
                      : `Falta pagar: $${(precio - monto).toLocaleString(
                          "es-AR"
                        )}`
                  }
                  type="warning"
                  showIcon
                />
              )}
              {/* ---------------------------------------------------- */}

              <Descriptions column={1} size="small">
                <Descriptions.Item label="Nombre">
                  {foundParticipant?.nombre} {foundParticipant?.apellido}
                </Descriptions.Item>
                <Descriptions.Item label="DNI">
                  {foundParticipant?.dni}
                </Descriptions.Item>
                <Descriptions.Item label="Nro. Entrada">
                  {foundParticipant?.numeroEntrada}
                </Descriptions.Item>
                {/* Opcional: Mostrar otros datos si son útiles aquí */}
                {foundParticipant?.medioPago && (
                  <Descriptions.Item label="Medio Pago">
                    {foundParticipant.medioPago}
                  </Descriptions.Item>
                )}
                {foundParticipant?.rubro && (
                  <Descriptions.Item label="Rubro">
                    {foundParticipant.rubro}
                  </Descriptions.Item>
                )}

                {/* --- NUEVOS CAMPOS MOSTRADOS --- */}
                <Descriptions.Item label="Precio Entrada">
                  {foundParticipant?.precioEntrada !== null
                    ? `$${parseFloat(
                        foundParticipant.precioEntrada
                      ).toLocaleString("es-AR")}`
                    : "No asignado"}
                </Descriptions.Item>
                <Descriptions.Item label="Monto Pagado">
                  {`$${monto.toLocaleString("es-AR")}`}
                </Descriptions.Item>
                <Descriptions.Item label="Estado Pago">
                  {estadoPagoTag}
                </Descriptions.Item>
                <Descriptions.Item label="Medio Pago">
                  {foundParticipant?.medioPago || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Rubro">
                  {foundParticipant?.rubro || "-"}
                </Descriptions.Item>
                {foundParticipant?.nuevaEntrada && (
                  <Descriptions.Item label="Nueva Entrada">
                    <Tag color="blue">{foundParticipant.nuevaEntrada}</Tag>
                  </Descriptions.Item>
                )}
                {/* --- FIN NUEVOS CAMPOS --- */}
                <Descriptions.Item label="Estado">
                  <Tag color="volcano">PENDIENTE ACREDITACIÓN</Tag>
                </Descriptions.Item>
              </Descriptions>
              <Button
                type="primary"
                onClick={handleAccredit} // Llama a la función que llama a la API
                loading={isProcessing} // Muestra loading mientras se acredita
                disabled={isProcessing} // Deshabilita mientras se acredita
                size="large"
                block
              >
                {isProcessing ? "Acreditando..." : "Confirmar Acreditación"}
              </Button>
            </Space>
          </Card>
        );
      case "idle":
      default:
        return (
          <Paragraph
            style={{ color: "#888", textAlign: "center", padding: "40px 0" }}
          >
            Ingrese DNI o Nro. de Entrada para buscar.
          </Paragraph>
        );
    }
  };

  // --- Renderizado Principal del Componente ---
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "300px",
        }}
      >
        <Spin size="large" tip="Cargando modo acreditación..." />
      </div>
    );
  }

  // Si hubo error cargando datos iniciales
  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        {/* Permite volver incluso si hay error */}
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/events/${eventId}`)}
          style={{ marginBottom: "20px" }}
        >
          Volver al Detalle
        </Button>
        <Alert
          message="Error de Carga"
          description={error}
          type="error"
          showIcon
          style={{ marginTop: "20px" }}
        />
      </div>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Encabezado */}
      <Row justify="space-between" align="middle" wrap gutter={[0, 16]}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            Modo Acreditación
          </Title>
          <Text type="secondary">Evento: {eventoNombre}</Text>
        </Col>
        <Col>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/events/${eventId}`)}
          >
            Volver al Detalle
          </Button>
        </Col>
      </Row>

      {/* Card de Búsqueda */}
      <Card>
        <Title level={4}>Buscar Asistente</Title>
        <Space.Compact style={{ width: "100%" }}>
          <Input
            ref={dniInputRef}
            placeholder="Ingrese DNI o Nro. de Entrada"
            value={dniInput}
            onChange={(e) => setDniInput(e.target.value)}
            onPressEnter={handleSearch} // Busca al presionar Enter
            // Deshabilitar input si se está procesando API o si ya se mostró un resultado final
            disabled={
              isProcessing ||
              ["success_accredited", "already_accredited"].includes(
                searchStatus
              )
            }
            size="large"
            allowClear
            autoFocus
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
            loading={searchStatus === "searching"} // Loading solo mientras busca localmente
            disabled={isProcessing || !dniInput.trim()} // Deshabilitado si procesa API o input vacío
            size="large"
          >
            Buscar
          </Button>
        </Space.Compact>
        {/* Botón Limpiar */}
        {searchStatus !== "idle" && (
          <Button
            type="link"
            onClick={resetSearch}
            disabled={isProcessing}
            style={{ marginTop: "10px" }}
          >
            Limpiar / Nueva Búsqueda
          </Button>
        )}
      </Card>

      {/* Card de Resultados */}
      <Card
        title="Resultado de la Búsqueda"
        style={{ minHeight: "200px", background: "#f9f9f9" }}
      >
        {renderResult()}
      </Card>
    </Space>
  );
};
