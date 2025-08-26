// src/Pages/EventoABM.js
import React, { useState, useEffect } from "react";
// QUITAR: import { initialEvents, initialParticipants } from '../mockData';
import { EventList } from "../Components/EventList"; // Ajusta la ruta si es necesario
import { EventForm } from "../Components/EventForm"; // Ajusta la ruta si es necesario
import {
  Button,
  Modal,
  Typography,
  Form,
  Space,
  Spin,
  Alert,
  Card,
} from "antd"; // Añadido Spin, Alert, Card
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs"; // Necesario para manejar fechas en el formulario
import { toast } from "react-hot-toast"; // Para notificaciones
import {
  getAllEventos,
  createEvento,
  updateEvento,
  deleteEvento,
} from "../services/evento.services.js"; // Importa los servicios de API

const { Title } = Typography;

// YA NO NECESITAMOS LAS VARIABLES GLOBALES SIMULADAS (currentEvents, currentParticipants)
// NI LAS FUNCIONES updateGlobal...

export const EventoABM = () => {
  // --- Estados Locales ---
  const [eventos, setEventos] = useState([]); // Estado para la lista de eventos REAL
  const [loading, setLoading] = useState(true); // Estado de carga inicial de la lista
  const [error, setError] = useState(null); // Estado para errores de carga o API
  const [isModalVisible, setIsModalVisible] = useState(false); // Visibilidad del modal
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading para el botón OK del modal
  const [editingEvent, setEditingEvent] = useState(null); // Guarda el evento que se está editando
  const [form] = Form.useForm(); // Instancia del formulario de AntD

  const [modal, modalContextHolder] = Modal.useModal();

  // --- Cargar Eventos desde la API al Montar ---
  useEffect(() => {
    const fetchEventos = async () => {
      setLoading(true); // Inicia la carga
      setError(null); // Limpia errores previos
      try {
        const data = await getAllEventos(); // Llama al servicio
        // Asegúrate que el nombre de campo coincida con tu modelo Prisma (nombre, fecha, etc.)
        setEventos(data); // Actualiza el estado con los datos de la API
      } catch (err) {
        console.error("Error al cargar eventos:", err);
        const errorMessage = err.message || `Error al cargar datos.`;

        if (err.status === 503) {
          // Es un error de "servidor ocupado"
          toast.error(
            "El sistema está un poco ocupado, la información podría tardar en cargar. Por favor, espere o intente recargar.",
            { duration: 5000 }
          );
          // NO establezcas el estado 'error' que muestra la Alert intrusiva,
          // o si lo haces, que sea un mensaje diferente y menos alarmante.
          // setError("Servidor temporalmente ocupado. Algunos datos podrían no haberse cargado.");
          // En este caso, podrías dejar los datos como están (o vacíos) y que el usuario reintente.
        } else {
          // Otros errores (404, 400, etc.)
          setError(errorMessage); // Muestra la Alert
          toast.error(errorMessage);
        }
      } finally {
        setLoading(false); // Finaliza la carga
      }
    };
    fetchEventos(); // Ejecuta la carga
  }, []); // El array vacío [] significa que se ejecuta solo una vez cuando el componente se monta

  // --- Manejo del Modal (Sin cambios en la lógica de abrir/cerrar) ---
  const showAddModal = () => {
    setEditingEvent(null); // No estamos editando
    form.resetFields(); // Limpia campos del formulario
    setIsModalVisible(true);
  };

  const showEditModal = (evento) => {
    setEditingEvent(evento); // Guarda el evento a editar
    // Llena el formulario con los datos del evento
    form.setFieldsValue({
      nombre: evento.nombre,
      // Prisma devuelve fechas como strings ISO, dayjs puede parsearlas
      fecha: evento.fecha ? dayjs(evento.fecha) : null,
      lugar: evento.lugar,
      descripcion: evento.descripcion,
    });
    setIsModalVisible(true);
  };

  const handleCancelModal = () => {
    setIsModalVisible(false);
    setEditingEvent(null); // Limpia el evento en edición
    form.resetFields();
  };

  // --- Lógica del Botón OK del Modal (Llama a la API) ---
  const handleOkModal = async () => {
    try {
      // Valida los campos del formulario de AntD
      const values = await form.validateFields();
      setIsSubmitting(true); // Activa el loading del botón OK
      setError(null); // Limpia errores previos

      console.log("values", values);
      // Prepara los datos para enviar a la API
      const eventoData = {
        nombre: values.name,
        // Envía la fecha en formato ISO string o null
        fecha: values.date ? values.date.toISOString() : null,
        lugar: values.location,
        descripcion: values.description,
      };

      try {
        if (editingEvent) {
          // --- LLAMADA API: ACTUALIZAR EVENTO ---
          const eventoActualizado = await updateEvento(
            editingEvent.id,
            eventoData
          );
          // Actualiza la lista local reemplazando el evento antiguo por el nuevo
          setEventos((prevEventos) =>
            prevEventos.map((ev) =>
              ev.id === editingEvent.id ? eventoActualizado : ev
            )
          );
          toast.success(
            `Evento "${eventoActualizado.nombre}" actualizado con éxito.`
          );
        } else {
          // --- LLAMADA API: CREAR EVENTO ---
          const nuevoEvento = await createEvento(eventoData);
          // Añade el nuevo evento al principio de la lista local
          setEventos((prevEventos) => [nuevoEvento, ...prevEventos]);
          toast.success(`Evento "${nuevoEvento.nombre}" creado con éxito.`);
        }
        // Si la llamada API fue exitosa: cierra modal y limpia
        setIsModalVisible(false);
        setEditingEvent(null);
        form.resetFields();
      } catch (apiError) {
        // Si la llamada a la API falla (crear o actualizar)
        console.error("Error al guardar evento en API:", apiError);
        const errorMessage = apiError.message || "Error al guardar el evento.";
        setError(errorMessage); // Guarda el error para posible visualización
        toast.error(errorMessage); // Muestra notificación de error
        // No cerramos el modal para que el usuario pueda intentar de nuevo o corregir
      }
    } catch (validationError) {
      // AntD Form maneja la visualización de errores de validación
      console.log("Error de validación del formulario:", validationError);
      // No es necesario hacer toast aquí, AntD ya marca los campos
    } finally {
      setIsSubmitting(false); // Desactiva el loading del botón OK
    }
  };

  
  // --- Manejo de Eliminación (Llama a la API) ---
  const handleDeleteEvent = (eventoId, eventoNombre) => {
    console.log("handleDeleteEvent eventoId", eventoId);
    console.log("handleDeleteEvent eventoNombre", eventoNombre);

    // ✅ CAMBIA Modal.confirm por modal.confirm
    modal.confirm({
      title: `¿Eliminar el evento "${eventoNombre || "este evento"}"?`,
      content:
        "Esta acción eliminará el evento y todos sus participantes asociados. ¿Continuar?",
      okText: "Sí, eliminar",
      okType: "danger",
      cancelText: "No",

      onOk: async () => {
        const toastId = toast.loading("Eliminando evento...");
        try {
          await deleteEvento(eventoId);
          setEventos((prevEventos) =>
            prevEventos.filter((ev) => ev.id !== eventoId)
          );
          toast.success(
            `Evento "${eventoNombre || `ID ${eventoId}`}" eliminado.`,
            { id: toastId }
          );
        } catch (apiError) {
          console.error("Error al eliminar evento:", apiError);
          const errorMessage =
            apiError.message || "No se pudo eliminar el evento.";
          toast.error(errorMessage, { id: toastId });
        }
      },

      onCancel() {
        console.log("Eliminación cancelada");
      },
    });
  };

  // --- Renderizado ---
  if (loading) {
    // Muestra un spinner centrado mientras carga la lista inicial
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "300px",
        }}
      >
        <Spin size="large" tip="Cargando eventos..." />
      </div>
    );
  }

  return (
    // Usa Fragment o Space como contenedor principal
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {modalContextHolder}

      {/* Encabezado con Título y Botón Crear */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Gestión de Eventos
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
          Crear Nuevo Evento
        </Button>
      </div>

      {/* Muestra Alerta de Error si falló la carga inicial */}
      {error && !loading && (
        <Alert
          message="Error al cargar datos"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)} // Permite cerrar la alerta
          style={{ marginBottom: "16px" }}
        />
      )}

      {/* Contenedor para la Lista de Eventos */}
      <Card title="Eventos Programados" size="default">
        {" "}
        {/* Usa size="default" o quítalo */}
        {/* Pasa los eventos del estado (que vienen de la API) */}
        <EventList
          events={eventos}
          onEdit={showEditModal}
          // Modifica onDelete para pasar también el nombre para el mensaje
          onDelete={(eventoId) => {
            console.log("eventoId", eventoId);
            const evento = eventos.find((e) => e.id === eventoId);
            handleDeleteEvent(eventoId, evento?.nombre); // Pasa nombre si existe
          }}
        />
      </Card>

      {/* Modal para Crear/Editar Evento */}
      <Modal
        // Título dinámico
        title={
          editingEvent
            ? `Editar Evento: ${editingEvent.nombre}`
            : "Crear Nuevo Evento"
        }
        open={isModalVisible} // Controlado por el estado
        onOk={handleOkModal} // Llama a la función que valida y llama a la API
        confirmLoading={isSubmitting} // Muestra loading en botón OK
        onCancel={handleCancelModal} // Cierra el modal
        destroyOnClose // Destruye el estado del formulario al cerrar
        maskClosable={false} // Evita cerrar al hacer clic fuera
        width={600} // Ancho del modal
      >
        {/* Renderiza el formulario dentro del modal */}
        <EventForm form={form} />
      </Modal>
    </Space>
  );
};

// YA NO SE EXPORTAN LAS VARIABLES GLOBALES
