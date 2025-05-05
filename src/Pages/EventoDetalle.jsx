// src/Pages/EventoDetalle.js
import React, { useState, useEffect, useCallback, useRef } from "react"; // Importa useCallback
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Typography,
  Button,
  Row,
  Col,
  Descriptions,
  Card,
  Tag,
  Spin,
  Alert,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  // QUITAR: message as antdMessage (ya no se usa)
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  // QUITAR: CheckCircleOutlined (no se usa directamente aquí)
  DownloadOutlined,
  UserAddOutlined,
  SafetyOutlined,
  // QUITAR: EditOutlined, DeleteOutlined (pertenecen a EventoABM o lista)
} from "@ant-design/icons";
// QUITAR: Importación de variables globales simuladas
// import { currentEvents, currentParticipants } from './EventoABM';
import { ImportarParticipantes } from "../Components/ImportarParticipantes"; // Ajusta ruta
import { ParticipantesListas } from "../Components/ParticipantesListas"; // Ajusta ruta
import { ParticipanteForm } from "../Components/ParticipanteForm"; // Ajusta ruta
import dayjs from "dayjs";
import { toast } from "react-hot-toast"; // Para notificaciones
import jsPDF from "jspdf"; // Para reportes PDF
import autoTable from "jspdf-autotable"; // Para tablas en PDF

import { utils, writeFile } from "xlsx"; // <-- LÍNEA CORRECTA: Añadir 'utils'

// Importar Servicios de API
import { getEventoById } from "../services/evento.services.js";
import {
  getParticipantesByEventoId,
  createParticipante,
  cancelPendingAmountParticipante,
  updatePrecioEntradaParticipante,
  assignNuevaEntradaParticipante,
} from "../services/participante.services.js";

import { io } from "socket.io-client"; // Importa io client
import { entorno as apiBaseUrl } from "../services/config.js";
/* import Input from "antd/es/input/Input.js";
 */ const socketUrl = apiBaseUrl.replace(/\/api$/, ""); // URL para Socket.IO

const { Title, Paragraph, Text } = Typography;

// Fuera del componente EventoDetalle
const PRECIO_ENTRADA_ACTUAL = 50000;

export const EventoDetalle = () => {
  const { eventId } = useParams(); // Obtiene el ID del evento de la URL
  const navigate = useNavigate();

  // --- Estados Locales ---
  const [evento, setEvento] = useState(null); // Detalles del evento actual
  const [participantes, setParticipantes] = useState([]); // Lista de participantes del evento
  const [loading, setLoading] = useState(true); // Estado de carga para datos iniciales
  const [error, setError] = useState(null); // Estado para errores de carga o API

  // Estados para el modal de añadir participante
  const [isParticipantModalVisible, setIsParticipantModalVisible] =
    useState(false);
  const [isSubmittingParticipant, setIsSubmittingParticipant] = useState(false); // Loading del botón OK del modal
  const [participantForm] = Form.useForm(); // Instancia del formulario AntD

  // Dentro de EventoDetalle
  const [searchTerm, setSearchTerm] = useState(""); // Estado para el input de búsqueda

  // --- Estados para Modal Editar Precio ---
  const [editingPrecioInfo, setEditingPrecioInfo] = useState({
    visible: false,
    participante: null,
    loading: false,
  });
  const [precioForm] = Form.useForm(); // Formulario para el modal de precio

  // --- NUEVO: Estados para Modal Asignar Nueva Entrada ---
  const [assigningEntradaInfo, setAssigningEntradaInfo] = useState({
    visible: false,
    participante: null,
    loading: false,
  });
  const [nuevaEntradaFormValue, setNuevaEntradaFormValue] = useState(""); // Estado para el input del modal
  // ------------------------------------------------------

  const socketRef = useRef(null); // Ref para el socket

  // --- Función para Cargar Datos del Evento y Participantes (API) ---
  // Usamos useCallback para evitar recrear la función en cada render si eventId no cambia
  const cargarDatos = useCallback(async () => {
    // Valida que eventId sea un número antes de llamar a la API
    const numericEventId = parseInt(eventId);
    if (isNaN(numericEventId)) {
      setError("ID de evento inválido.");
      setLoading(false);
      toast.error("El ID del evento en la URL no es válido.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const eventoData = await getEventoById(numericEventId);
      setEvento(eventoData);
      // Solo busca participantes DESPUÉS de obtener el evento
      if (eventoData) {
        const participantesData = await getParticipantesByEventoId(
          numericEventId
        );
        setParticipantes(participantesData);
        setError(null); // <--- ¡AQUÍ! Limpia el error si todo fue bien

      } else {
        setParticipantes([]); // Limpia participantes si no hay evento
      }
    } catch (err) {
      console.error("Error al cargar datos del evento y participantes:", err);
      const errorMessage =
        err.message ||
        `Error al cargar datos para el evento ${numericEventId}.`;
      setError(errorMessage);
      toast.error(errorMessage);
      // Si el evento no existe (error 404 usualmente), el servicio debería lanzar error
      if (err.message?.toLowerCase().includes("no encontrado")) {
        // Podrías redirigir si el evento no existe
        // navigate('/events', { replace: true });
      }
    } finally {
      setLoading(false); // Finaliza la carga
    }
  }, [eventId, navigate]); // Depende de eventId y navigate (para redirección opcional)

  // --- Efecto para Ejecutar la Carga al Montar o Cambiar eventId ---
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]); // Llama a la función definida con useCallback

  // --- EFECTO PARA WEBSOCKETS (Similar a AcreditacionMode) ---
  useEffect(() => {
    const numericEventId = parseInt(eventId);
    if (isNaN(numericEventId) || !socketUrl) return;

    // Conectar
    if (!socketRef.current) {
      console.log(`EventoDetalle: Conectando socket a ${socketUrl}`);
      socketRef.current = io(socketUrl, {
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });
    }
    const socket = socketRef.current;

    // Listeners de conexión/desconexión
    const handleConnect = () => {
      console.log("EventoDetalle: Socket conectado", socket.id);
      socket.emit("join_event_room", numericEventId);
    };
    const handleDisconnect = (reason) => {
      console.log(
        "EventoDetalle: Socket desconectado",
        reason
      ); /* ... toast opcional ... */
    };
    const handleConnectError = (err) => {
      console.error("EventoDetalle: Error conexión Socket", err);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    // --- Listener para NUEVOS participantes ---
    const handleParticipantCreated = (nuevoParticipante) => {
      console.log("Recibido [participant_created]:", nuevoParticipante);
      if (nuevoParticipante?.eventoId !== numericEventId) return;

      // Añade el nuevo participante al principio de la lista local
      setParticipantes((prev) => [nuevoParticipante, ...prev]);
      toast(
        `Nuevo participante añadido: ${nuevoParticipante.nombre} ${nuevoParticipante.apellido}`,
        { icon: "👤" }
      );
    };

    // --- Listener para participantes ACTUALIZADOS (acreditados) ---
    const handleParticipantUpdated = (updatedParticipant) => {
      console.log("Recibido [participant_updated]:", updatedParticipant);
      if (updatedParticipant?.eventoId !== numericEventId) return;

      // Actualiza el participante en la lista local
      setParticipantes((prev) =>
        prev.map((p) =>
          p.id === updatedParticipant.id ? updatedParticipant : p
        )
      );
      // Muestra un toast informativo si la actualización fue acreditación
      if (updatedParticipant.acreditado) {
        toast.success(
          `"${updatedParticipant.nombre} ${updatedParticipant.apellido}" fue acreditado.`
        );
      }
      // Podrías añadir lógica para otros tipos de updates si los hubiera
    };

    // Registrar ambos listeners
    socket.on("participant_created", handleParticipantCreated);
    socket.on("participant_updated", handleParticipantUpdated);

    // --- Limpieza ---
    return () => {
      console.log("EventoDetalle: Limpiando efecto WebSocket...");
      if (socket) {
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
        socket.off("connect_error", handleConnectError);
        socket.off("participant_created", handleParticipantCreated); // Limpia este listener
        socket.off("participant_updated", handleParticipantUpdated); // Limpia este listener

        socket.emit("leave_event_room", numericEventId);
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [eventId, socketUrl]); // Depende solo de estos para la conexión

  // --- Handlers CRUD Participante Manual ---
  const showAddParticipantModal = () => {
    participantForm.resetFields();
    // Establece defaults para nuevos participantes manuales
    participantForm.setFieldsValue({
      precioEntrada: PRECIO_ENTRADA_ACTUAL,
      montoPagado: 0, // O podría ser PRECIO_ENTRADA_ACTUAL si pagan todo al registrarse manualmente
    });
    setIsParticipantModalVisible(true);
  };
  const handleCancelParticipantModal = () =>
    setIsParticipantModalVisible(false);
  const handleAddParticipantOk = async () => {
    try {
      const values = await participantForm.validateFields();
      // Asegura que los montos sean números antes de enviar si InputNumber no lo hace
      const dataToSend = {
        ...values,
        precioEntrada: parseFloat(values.precioEntrada),
        montoPagado: parseFloat(values.montoPagado),
      };
      setIsSubmittingParticipant(true);
      try {
        const numericEventId = parseInt(eventId);
        const nuevoParticipante = await createParticipante(
          numericEventId,
          dataToSend
        );
        // Ya no actualiza localmente, confía en WebSocket 'participant_created'
        toast.success(
          `Participante "${nuevoParticipante.nombre} ${nuevoParticipante.apellido}" añadido.`
        );
        setIsParticipantModalVisible(false);
      } catch (apiError) {
        toast.error(apiError.message || "No se pudo añadir.");
      }
    } catch (validationError) {
      console.log("Error validación form");
    } finally {
      setIsSubmittingParticipant(false);
    }
  };

  // --- Handlers NUEVAS Acciones ---

  // Handler para la acción "Cancelar Saldo"
  const handleCancelPendingAmount = async (
    participanteId,
    medioPagoSeleccionado
  ) => {
    const participante = participantes.find((p) => p.id === participanteId); // Para el mensaje
    const nombreCompleto = participante
      ? `${participante.nombre} ${participante.apellido}`
      : `ID ${participanteId}`;
    const toastId = toast.loading(
      `Registrando pago total para ${nombreCompleto}...`
    );
    try {
      // Llama al servicio API
      const participanteActualizado = await cancelPendingAmountParticipante(
        participanteId,
        medioPagoSeleccionado
      );
      // Actualiza estado local para feedback inmediato (WebSocket actualizará para otros)
      setParticipantes((prev) =>
        prev.map((p) => (p.id === participanteId ? participanteActualizado : p))
      );
      toast.success(`Pago total registrado para ${nombreCompleto}.`, {
        id: toastId,
      });
    } catch (error) {
      console.error("Error al cancelar saldo:", error);
      toast.error(error.message || "No se pudo registrar el pago total.", {
        id: toastId,
      });
    }
  };

  // Handler para ABRIR el modal de editar precio
  const showEditPrecioModal = (participante) => {
    setEditingPrecioInfo({
      visible: true,
      participante: participante,
      loading: false,
    });
    // Establece valor inicial (puede ser null)
    precioForm.setFieldsValue({
      nuevoPrecioForm:
        participante.precioEntrada !== null
          ? parseFloat(participante.precioEntrada)
          : null,
    });
  };
  // Handler para CERRAR el modal de editar precio
  const handleCancelPrecioModal = () => {
    setEditingPrecioInfo({
      visible: false,
      participante: null,
      loading: false,
    });
    precioForm.resetFields();
  };
  // Handler para el OK del modal de editar precio (llama a la API)
  const handleUpdatePrecioOk = async () => {
    const participanteId = editingPrecioInfo.participante?.id;
    if (!participanteId) return;

    try {
      const values = await precioForm.validateFields();
      const nuevoPrecio = values.nuevoPrecioForm; // Puede ser número o null
      setEditingPrecioInfo((prev) => ({ ...prev, loading: true })); // Activa loading del modal

      const toastId = toast.loading(`Actualizando precio...`);
      try {
        // Llama al servicio API
        const participanteActualizado = await updatePrecioEntradaParticipante(
          participanteId,
          nuevoPrecio
        );
        // Actualiza localmente
        setParticipantes((prev) =>
          prev.map((p) =>
            p.id === participanteId ? participanteActualizado : p
          )
        );
        toast.success("Precio de entrada actualizado.", { id: toastId });
        handleCancelPrecioModal(); // Cierra el modal en éxito
      } catch (apiError) {
        console.error("Error API al actualizar precio:", apiError);
        toast.error(apiError.message || "No se pudo actualizar el precio.", {
          id: toastId,
        });
        // No cerrar modal en error
      }
    } catch (validationError) {
      console.log("Error de validación de precio:", validationError);
    } finally {
      setEditingPrecioInfo((prev) => ({ ...prev, loading: false })); // Desactiva loading del modal
    }
  };

  // Handler para la acción "Asignar Nueva Entrada"
  const handleAssignNewEntry = async (participanteId, nuevaEntrada) => {
    const participante = participantes.find((p) => p.id === participanteId);
    const nombreCompleto = participante
      ? `${participante.nombre} ${participante.apellido}`
      : `ID ${participanteId}`;
    const toastId = toast.loading(
      `Asignando nueva entrada a ${nombreCompleto}...`
    );
    try {
      const participanteActualizado = await assignNuevaEntradaParticipante(
        participanteId,
        nuevaEntrada
      );
      // Actualiza localmente
      setParticipantes((prev) =>
        prev.map((p) => (p.id === participanteId ? participanteActualizado : p))
      );
      toast.success(`Nueva entrada '${nuevaEntrada}' asignada.`, {
        id: toastId,
      });
      // No necesita devolver nada, el modal interno se cierra solo en éxito (si así lo programaste)
    } catch (error) {
      console.error("Error al asignar nueva entrada:", error);
      toast.error(error.message || "No se pudo asignar la nueva entrada.", {
        id: toastId,
      });
      throw error; // Lanza error para que el modal interno no se cierre
    }
  };

  // --- NUEVO: Handlers para Modal ASIGNAR NUEVA ENTRADA ---
  const showAssignEntradaModal = (participante) => {
    setAssigningEntradaInfo({
      visible: true,
      participante: participante,
      loading: false,
    });
    setNuevaEntradaFormValue(""); // Limpia el input al abrir
  };

  const handleCancelAssignEntradaModal = () => {
    setAssigningEntradaInfo({
      visible: false,
      participante: null,
      loading: false,
    });
    setNuevaEntradaFormValue("");
  };

  const handleAssignEntradaOk = async () => {
    const participanteId = assigningEntradaInfo.participante?.id;
    const nombreCompleto = assigningEntradaInfo.participante
      ? `${assigningEntradaInfo.participante.nombre} ${assigningEntradaInfo.participante.apellido}`
      : `ID ${participanteId}`;
    const nuevaEntrada = nuevaEntradaFormValue.trim(); // Usa el valor del estado del input

    if (!participanteId) return;
    if (!nuevaEntrada) {
      toast.error("El nuevo número de entrada no puede estar vacío.");
      return;
    }

    setAssigningEntradaInfo((prev) => ({ ...prev, loading: true })); // Activa loading
    const toastId = toast.loading(
      `Asignando nueva entrada a ${nombreCompleto}...`
    );

    try {
      // Llama al servicio API con ID y NUEVO VALOR
      const participanteActualizado = await assignNuevaEntradaParticipante(
        participanteId,
        nuevaEntrada
      );
      // Actualiza localmente
      setParticipantes((prev) =>
        prev.map((p) => (p.id === participanteId ? participanteActualizado : p))
      );
      toast.success(`Nueva entrada '${nuevaEntrada}' asignada.`, {
        id: toastId,
      });
      handleCancelAssignEntradaModal(); // Cierra el modal en éxito
    } catch (error) {
      console.error("Error al asignar nueva entrada:", error);
      toast.error(error.message || "No se pudo asignar la nueva entrada.", {
        id: toastId,
      });
      // No cerrar el modal en caso de error
    } finally {
      setAssigningEntradaInfo((prev) => ({ ...prev, loading: false })); // Desactiva loading
    }
  };
  // ----------------------------------------------------------

  // --- Manejo Post-Importación Masiva (Llamado por ImportarParticipantes) ---
  // Esta función ahora solo refresca la lista si hubo éxito
  const handleImportComplete = (successCount, errorCount, duplicateCount) => {
    console.log(
      `Resumen importación: ${successCount} éxito(s), ${errorCount} error(es), ${duplicateCount} duplicado(s).`
    );
    // Si se importó al menos uno, volvemos a cargar la lista completa para verlos
    if (successCount > 0) {
      toast.success(`${successCount} participante(s) importado(s) con éxito.`);
      cargarDatos(); // Vuelve a llamar a la función que carga todo
    }
    // Muestra mensajes informativos sobre duplicados o errores si ocurrieron
    if (duplicateCount > 0) {
      toast.info(
        `${duplicateCount} participante(s) ya existían o tenían datos duplicados y fueron omitidos por el servidor.`
      );
    }
    if (errorCount > 0) {
      toast.error(
        `Ocurrieron ${errorCount} error(es) durante la importación de algunas filas.`
      );
    }
    if (successCount === 0 && duplicateCount === 0 && errorCount === 0) {
      toast.info("No se procesaron nuevos participantes desde el archivo.");
    }
  };

  // --- Manejo Descarga de Reporte PDF (Usa datos de la API) ---
  const handleDownloadReport = () => {
    if (!evento || !participantes || participantes.length === 0) {
      toast.error("No hay datos de participantes para generar el reporte.");
      return;
    }
    const loadingToastId = toast.loading("Generando reporte PDF...");
    try {
      const doc = new jsPDF();
      // Título y Detalles (usa 'evento' del estado)
      doc.setFontSize(16);
      doc.text(`Reporte: ${evento.nombre}`, 14, 22);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(
        `Fecha: ${
          evento.fecha ? dayjs(evento.fecha).format("DD/MM/YYYY") : "N/A"
        }`,
        14,
        30
      );
      doc.text(`Lugar: ${evento.lugar || "N/A"}`, 14, 36);

      // Estadísticas (usa 'participantes' del estado)
      const totalParticipantes = participantes.length;
      const accreditedCount = participantes.filter((p) => p.acreditado).length; // boolean
      doc.text(`Total Participantes: ${totalParticipantes}`, 14, 42);
      doc.text(
        `Acreditados: ${accreditedCount} (${
          Math.round((accreditedCount / totalParticipantes) * 100) || 0
        }%)`,
        14,
        48
      );

      // Columnas de la tabla (asegúrate que coincidan con los campos del modelo)
      const tableColumn = [
        "Nombre",
        "Apellido",
        "DNI",
        "Nro Entrada",
        "Estado",
        "Medio Pago",
        "Medio Pago Cancelación",
        "Rubro",
        "Precio Entrada",
        "Monto Pagado",
        "Estado Pago",
        "Nueva Entrada",
      ];
      const tableRows = [];
      // Itera sobre 'participantes' del estado
      participantes.forEach((p) => {
        const monto = parseFloat(p.montoPagado || 0);
        const precio = parseFloat(p.precioEntrada); // NaN si es null
        let estadoPago = "N/A (Sin Precio)";
        if (!isNaN(precio)) {
          if (monto >= precio) estadoPago = "Total";
          else if (monto > 0) estadoPago = "Parcial";
          else estadoPago = "Pendiente";
        }

        tableRows.push([
          p.nombre,
          p.apellido,
          p.dni,
          p.numeroEntrada, // Corregido nombre de campo
          p.acreditado ? "Acreditado" : "Pendiente",
          p.medioPago || "-", // Muestra '-' si es null/undefined
          p.medioPagoCancelacion || "-", // Muestra '-' si es null/undefined
          p.rubro || "-", // Muestra '-' si es null/undefined
          p.precioEntrada !== null
            ? parseFloat(p.precioEntrada).toLocaleString("es-AR")
            : "-", // Formateado
          p.montoPagado !== null
            ? parseFloat(p.montoPagado).toLocaleString("es-AR")
            : "-", // Formateado
          estadoPago, // <- Columna Estado Pago Calculada
          p.nuevaEntrada || "-", // Muestra '-' si es null/undefined
        ]);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 55, // Posición inicial de la tabla
        theme: "grid", // Estilo visual
        headStyles: { fillColor: [0, 100, 200] }, // Color de cabecera (azul)
        margin: { top: 10 },
      });

      // Nombre del archivo
      const safeEventName = evento.nombre
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();
      doc.save(`reporte_participantes_${safeEventName}_${evento.id}.pdf`);

      toast.success("Reporte PDF generado.", { id: loadingToastId });
    } catch (pdfError) {
      console.error("Error generando PDF:", pdfError);
      toast.error("Error al generar el reporte PDF.", { id: loadingToastId });
    }
  };

  // --- NUEVA FUNCIÓN: Manejo Descarga de Reporte Excel ---
  const handleDownloadExcelReport = () => {
    if (!evento || !participantes || participantes.length === 0) {
      toast.error(
        "No hay datos de participantes para generar el reporte Excel."
      );
      return;
    }
    const toastId = toast.loading("Generando reporte Excel...");

    try {
      // Asegúrate que las cabeceras y los datos incluyan precioEntrada
      const headers = [
        "Nombre",
        "Apellido",
        "DNI",
        "Nro Entrada",
        "Precio Entrada",
        "Monto Pagado",
        "Estado Pago",
        "Acreditado",
        "Teléfono",
        "Correo",
        "Medio Pago",
        "Medio Pago Cancelación",
        "Rubro",
        "Nueva Entrada",
      ];
      const dataRows = participantes.map((p) => {
        const monto = parseFloat(p.montoPagado || 0);
        const precio = parseFloat(p.precioEntrada);
        let estadoPago = "N/A (Sin Precio)";
        if (!isNaN(precio)) {
          if (monto >= precio) estadoPago = "Total";
          else if (monto > 0) estadoPago = "Parcial";
          else estadoPago = "Pendiente";
        }

        return [
          p.nombre,
          p.apellido,
          p.dni,
          p.numeroEntrada,
          p.precioEntrada !== null ? parseFloat(p.precioEntrada) : "", // Muestra número o vacío
          monto,
          estadoPago,
          p.acreditado ? "SI" : "NO",
          p.telefono || "",
          p.correo || "",
          p.medioPago || "",
          p.medioPagoCancelacion || "",
          p.rubro || "",
          p.nuevaEntrada || "",
        ];
      });
      const worksheet = utils.aoa_to_sheet([headers, ...dataRows]);
      // Formatear columnas numéricas
      dataRows.forEach((_, rowIndex) => {
        const precioCellRef = utils.encode_cell({ c: 4, r: rowIndex + 1 });
        const montoCellRef = utils.encode_cell({ c: 5, r: rowIndex + 1 });
        if (worksheet[precioCellRef] && worksheet[precioCellRef].v !== "")
          worksheet[precioCellRef].t = "n"; // Solo si no está vacío
        if (worksheet[montoCellRef]) worksheet[montoCellRef].t = "n";
      });
      worksheet["!cols"] = headers.map(() => ({ wch: 15 }));

      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "Participantes");
      const safeEventName = evento.nombre
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();
      writeFile(workbook, `reporte_${safeEventName}_${evento.id}.xlsx`);
      toast.success("Reporte Excel generado.", { id: toastId });
    } catch (excelError) {
      console.error("Error generando Excel:", excelError);
      toast.error("Error al generar el reporte Excel.", { id: toastId });
    }
  };

  // --- Renderizado ---
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
        <Spin size="large" tip="Cargando detalles del evento..." />
      </div>
    );
  }

  // Si hubo error y el evento no se cargó
  if (error && !evento) {
    return (
      <div style={{ padding: "20px" }}>
        <Link to="/events">
          <Button icon={<ArrowLeftOutlined />} style={{ marginBottom: "20px" }}>
            Volver a Eventos
          </Button>
        </Link>
        <Alert
          message="Error al Cargar el Evento"
          description={error}
          type="error"
          showIcon
          style={{ marginTop: "20px" }}
        />
      </div>
    );
  }

  // Si no hubo error pero el evento es null (ej. ID inválido manejado antes)
  if (!evento) {
    return (
      <div style={{ padding: "20px" }}>
        <Link to="/events">
          <Button icon={<ArrowLeftOutlined />}>Volver a Eventos</Button>
        </Link>
        <Alert
          message="Evento no encontrado"
          description="No se pudo encontrar un evento con el ID proporcionado."
          type="warning"
          showIcon
          style={{ marginTop: "20px" }}
        />
      </div>
    );
  }

  // Calcular estadísticas (ahora con 'participantes' del estado)
  const totalParticipants = participantes.length;
  const accreditedParticipants = participantes.filter(
    (p) => p.acreditado
  ).length; // Usa boolean 'acreditado'

  // Antes del return final del componente EventoDetalle
  const filteredParticipants = participantes.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true; // Si no hay término, mostrar todos

    // Busca en los campos relevantes (ignora mayúsculas/minúsculas)
    return (
      p.nombre?.toLowerCase().includes(term) ||
      p.apellido?.toLowerCase().includes(term) ||
      p.dni?.toLowerCase().includes(term) ||
      // Podrías añadir más campos si quieres:
      p.numeroEntrada?.toLowerCase().includes(term)
      // || p.correo?.toLowerCase().includes(term)
    );
  });

  // ... luego en el return usas <ParticipantesListas participants={filteredParticipants} />

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Fila Título y Volver */}
      <Row justify="space-between" align="middle" wrap gutter={[0, 16]}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            {evento.nombre}
          </Title>
          <Text type="secondary">ID: {evento.id}</Text>
        </Col>
        <Col>
          <Link to="/events">
            <Button icon={<ArrowLeftOutlined />}>Volver a Eventos</Button>
          </Link>
        </Col>
      </Row>

      {/* Card Detalles y Acciones */}
      <Card>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Title level={4}>Detalles del Evento</Title>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Fecha">
                {evento.fecha
                  ? dayjs(evento.fecha).format("DD/MM/YYYY")
                  : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Lugar">
                {evento.lugar || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Descripción">
                {evento.descripcion || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Participantes">
                <Tag color="blue">{totalParticipants}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Acreditados">
                <Tag color="green">{accreditedParticipants}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} md={12}>
            <Title level={4}>Acciones</Title>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Space wrap>
                {/* Pasa el eventId real y el callback actualizado */}
                <ImportarParticipantes
                  eventoId={evento.id}
                  onImportComplete={handleImportComplete}
                />
                <Button
                  icon={<UserAddOutlined />}
                  onClick={showAddParticipantModal}
                >
                  Añadir Manual
                </Button>
              </Space>
              <Space wrap>
                <Button
                  type="primary"
                  icon={<UserOutlined />}
                  onClick={() => navigate(`/events/${evento.id}/accredit`)}
                >
                  Modo Acreditación
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadReport}
                  disabled={participantes.length === 0}
                >
                  Descargar Reporte PDF
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadExcelReport}
                  disabled={participantes.length === 0}
                >
                  Descargar Excel {/* <-- NUEVO BOTÓN */}
                </Button>
              </Space>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Card Lista Participantes */}
      <Card title="Lista de Participantes">
        {/* Input de Búsqueda */}

        <Input.Search
          placeholder="Buscar por Nombre, Apellido, N° de Entrada o DNI..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={(value) => setSearchTerm(value)} // Opcional: buscar al presionar enter/botón
          allowClear
          style={{ marginBottom: "16px", maxWidth: "400px" }} // Estilo opcional
        />

        {/* Muestra error si falló carga de participantes pero no del evento */}
        {error && evento && (
          <Alert
            message="Error al cargar participantes"
            description={error} // Muestra el error específico de participantes
            type="warning"
            showIcon
            closable
            onClose={() => setError(null)} // Permite cerrar la alerta
            style={{ marginBottom: "16px" }}
          />
        )}
        {/* Pasa la lista de participantes real */}
        {/* <ParticipantesListas participants={participantes} /> */}

        {/* Pasar lista FILTRADA a ParticipantesListas */}
        <ParticipantesListas
          participants={filteredParticipants}
          onCancelPayment={handleCancelPendingAmount} // Pasa la función correcta
          onAssignNewEntry={showAssignEntradaModal} // Pasa la función correcta
          onUpdatePrecioEntrada={showEditPrecioModal} // Pasa la función que ABRE el modal de editar precio
        />
      </Card>

      {/* Modal Añadir Participante Manual */}
      <Modal
        title="Añadir Nuevo Participante"
        open={isParticipantModalVisible}
        onOk={handleAddParticipantOk}
        confirmLoading={isSubmittingParticipant} // Loading del botón OK
        onCancel={handleCancelParticipantModal}
        destroyOnClose
        maskClosable={false}
      >
        <ParticipanteForm form={participantForm} />
      </Modal>
      {/* --- AÑADIR ESTE MODAL PARA EDITAR PRECIO --- */}
      <Modal
        title={`Editar Precio Entrada: ${editingPrecioInfo.participante?.nombre} ${editingPrecioInfo.participante?.apellido}`}
        open={editingPrecioInfo.visible} // Controlado por estado
        onOk={handleUpdatePrecioOk} // Llama al handler de actualización
        onCancel={handleCancelPrecioModal} // Llama al handler de cancelar/cerrar
        confirmLoading={editingPrecioInfo.loading} // Usa el loading específico
        okText="Actualizar Precio"
        cancelText="Cancelar"
        destroyOnClose
        maskClosable={false}
      >
        {/* Contenido del Modal: Formulario para el nuevo precio */}
        <Form form={precioForm} layout="vertical" name="edit_precio_form">
          <p>Participante DNI: {editingPrecioInfo.participante?.dni}</p>
          <Form.Item
            name="nuevoPrecioForm" // Nombre del campo en este form
            label="Nuevo Precio de Entrada (0 = Gratis, Vacío = Quitar)"
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (value === null || value === undefined || value === "")
                    return Promise.resolve();
                  if (isNaN(value) || value < 0) {
                    return Promise.reject(
                      new Error("Debe ser número válido (0 o mayor)")
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <InputNumber
              placeholder="Ej: 45000 o 0"
              style={{ width: "100%" }}
              min={0}
              step={1000}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value?.replace(/\$\s?|(,*)/g, "") ?? ""}
            />
          </Form.Item>
        </Form>
        <Text type="secondary" style={{ fontSize: "0.85em" }}>
          Nota: Si el participante ya pagó más que este nuevo precio, su monto
          pagado no cambiará.
        </Text>
      </Modal>
      {/* --- FIN MODAL EDITAR PRECIO --- */}

      {/* --- NUEVO: Modal para Asignar Nueva Entrada --- */}
      <Modal
        title={`Asignar Nueva Entrada a ${assigningEntradaInfo.participante?.nombre} ${assigningEntradaInfo.participante?.apellido}`}
        open={assigningEntradaInfo.visible}
        onOk={handleAssignEntradaOk} // Llama al handler que ejecuta la API
        onCancel={handleCancelAssignEntradaModal}
        confirmLoading={assigningEntradaInfo.loading}
        okText="Asignar"
        cancelText="Cancelar"
        destroyOnClose
        maskClosable={false}
      >
        <p>Participante DNI: {assigningEntradaInfo.participante?.dni}</p>
        <p>
          Entrada Original: {assigningEntradaInfo.participante?.numeroEntrada}
        </p>
        <p>
          Nueva Entrada Actual:{" "}
          {assigningEntradaInfo.participante?.nuevaEntrada || "Ninguna"}
        </p>
        <Input
          placeholder="Ingrese el nuevo Nro de Entrada"
          value={nuevaEntradaFormValue} // Controlado por estado
          onChange={(e) => setNuevaEntradaFormValue(e.target.value)} // Actualiza estado del input
        />
      </Modal>
      {/* --- FIN MODAL ASIGNAR NUEVA ENTRADA --- */}
    </Space>
  );
};
