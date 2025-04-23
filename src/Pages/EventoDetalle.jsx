// src/Pages/EventoDetalle.js
import React, { useState, useEffect, useCallback } from 'react'; // Importa useCallback
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  // QUITAR: message as antdMessage (ya no se usa)
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  // QUITAR: CheckCircleOutlined (no se usa directamente aquí)
  DownloadOutlined,
  UserAddOutlined,
  // QUITAR: EditOutlined, DeleteOutlined (pertenecen a EventoABM o lista)
} from '@ant-design/icons';
// QUITAR: Importación de variables globales simuladas
// import { currentEvents, currentParticipants } from './EventoABM';
import { ImportarParticipantes } from '../Components/ImportarParticipantes'; // Ajusta ruta
import { ParticipantesListas } from '../Components/ParticipantesListas'; // Ajusta ruta
import { ParticipanteForm } from '../Components/ParticipanteForm'; // Ajusta ruta
import dayjs from 'dayjs';
import { toast } from 'react-hot-toast'; // Para notificaciones
import jsPDF from 'jspdf'; // Para reportes PDF
import autoTable from 'jspdf-autotable'; // Para tablas en PDF

// Importar Servicios de API
import { getEventoById } from '../services/evento.services.js';
import { getParticipantesByEventoId, createParticipante } from '../services/participante.services.js';

const { Title, Paragraph, Text } = Typography;

export const EventoDetalle = () => {
  const { eventId } = useParams(); // Obtiene el ID del evento de la URL
  const navigate = useNavigate();

  // --- Estados Locales ---
  const [evento, setEvento] = useState(null); // Detalles del evento actual
  const [participantes, setParticipantes] = useState([]); // Lista de participantes del evento
  const [loading, setLoading] = useState(true); // Estado de carga para datos iniciales
  const [error, setError] = useState(null); // Estado para errores de carga o API

  // Estados para el modal de añadir participante
  const [isParticipantModalVisible, setIsParticipantModalVisible] = useState(false);
  const [isSubmittingParticipant, setIsSubmittingParticipant] = useState(false); // Loading del botón OK del modal
  const [participantForm] = Form.useForm(); // Instancia del formulario AntD

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
      // Llama a ambas APIs (detalles evento y lista participantes) en paralelo
      const [eventoData, participantesData] = await Promise.all([
        getEventoById(numericEventId),
        getParticipantesByEventoId(numericEventId)
      ]);
      setEvento(eventoData); // Guarda detalles del evento
      setParticipantes(participantesData); // Guarda lista de participantes
    } catch (err) {
      console.error("Error al cargar datos del evento y participantes:", err);
      const errorMessage = err.message || `Error al cargar datos para el evento ${numericEventId}.`;
      setError(errorMessage);
      toast.error(errorMessage);
      // Si el evento no existe (error 404 usualmente), el servicio debería lanzar error
      if (err.message?.toLowerCase().includes('no encontrado')) {
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


  // --- Manejo Añadir Participante Manual (Formulario y API) ---
  const showAddParticipantModal = () => {
    participantForm.resetFields();
    setIsParticipantModalVisible(true);
  };

  const handleCancelParticipantModal = () => {
    setIsParticipantModalVisible(false);
  };

  const handleAddParticipantOk = async () => {
    try {
      // Valida el formulario AntD
      const values = await participantForm.validateFields();
      setIsSubmittingParticipant(true); // Activa loading del botón OK

      try {
        // --- LLAMADA API: CREAR PARTICIPANTE ---
        // Asegura que el eventId sea número
        const numericEventId = parseInt(eventId);
        // Los 'values' ya vienen del formulario con los nombres correctos
        const nuevoParticipante = await createParticipante(numericEventId, values);

        // Actualiza el estado local añadiendo el nuevo participante al inicio
        setParticipantes(prev => [nuevoParticipante, ...prev]);
        toast.success(`Participante "${nuevoParticipante.nombre} ${nuevoParticipante.apellido}" añadido con éxito.`);
        setIsParticipantModalVisible(false); // Cierra el modal
      } catch (apiError) {
         // Si la API devuelve error (400, 404, 409)
         console.error("Error al añadir participante vía API:", apiError);
         toast.error(apiError.message || 'No se pudo añadir el participante.');
         // No cerramos el modal en caso de error de API
      }
    } catch (validationError) {
      // Error de validación del formulario AntD (ya se muestra en la UI)
      console.log('Error de validación del formulario:', validationError);
    } finally {
      setIsSubmittingParticipant(false); // Desactiva loading del botón OK
    }
  };

  // --- Manejo Post-Importación Masiva (Llamado por ImportarParticipantes) ---
  // Esta función ahora solo refresca la lista si hubo éxito
  const handleImportComplete = (successCount, errorCount, duplicateCount) => {
      console.log(`Resumen importación: ${successCount} éxito(s), ${errorCount} error(es), ${duplicateCount} duplicado(s).`);
      // Si se importó al menos uno, volvemos a cargar la lista completa para verlos
      if (successCount > 0) {
          toast.success(`${successCount} participante(s) importado(s) con éxito.`);
          cargarDatos(); // Vuelve a llamar a la función que carga todo
      }
      // Muestra mensajes informativos sobre duplicados o errores si ocurrieron
      if (duplicateCount > 0) {
          toast.info(`${duplicateCount} participante(s) ya existían o tenían datos duplicados y fueron omitidos por el servidor.`);
      }
      if (errorCount > 0) {
          toast.error(`Ocurrieron ${errorCount} error(es) durante la importación de algunas filas.`);
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
          doc.text(`Fecha: ${evento.fecha ? dayjs(evento.fecha).format('DD/MM/YYYY') : 'N/A'}`, 14, 30);
          doc.text(`Lugar: ${evento.lugar || 'N/A'}`, 14, 36);

          // Estadísticas (usa 'participantes' del estado)
          const totalParticipantes = participantes.length;
          const accreditedCount = participantes.filter(p => p.acreditado).length; // boolean
          doc.text(`Total Participantes: ${totalParticipantes}`, 14, 42);
          doc.text(`Acreditados: ${accreditedCount} (${Math.round((accreditedCount/totalParticipantes)*100) || 0}%)`, 14, 48);

          // Columnas de la tabla (asegúrate que coincidan con los campos del modelo)
          const tableColumn = ["Nombre", "Apellido", "DNI", "Nro Entrada", "Estado", "Medio Pago", "Rubro"];
          const tableRows = [];
          // Itera sobre 'participantes' del estado
          participantes.forEach(p => {
              tableRows.push([
                  p.nombre,
                  p.apellido,
                  p.dni,
                  p.numeroEntrada, // Corregido nombre de campo
                  p.acreditado ? 'Acreditado' : 'Pendiente',
                  p.medioPago || '-', // Muestra '-' si es null/undefined
                  p.rubro || '-',     // Muestra '-' si es null/undefined
              ]);
          });

          autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 55, // Posición inicial de la tabla
            theme: 'grid', // Estilo visual
            headStyles: { fillColor: [0, 100, 200] }, // Color de cabecera (azul)
            margin: { top: 10 }
           });

          // Nombre del archivo
          const safeEventName = evento.nombre.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          doc.save(`reporte_participantes_${safeEventName}_${evento.id}.pdf`);

          toast.success("Reporte PDF generado.", { id: loadingToastId });
      } catch (pdfError) {
          console.error("Error generando PDF:", pdfError);
          toast.error("Error al generar el reporte PDF.", { id: loadingToastId });
      }
  };

  // --- Renderizado ---
  if (loading) {
      return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
              <Spin size="large" tip="Cargando detalles del evento..." />
          </div>
      );
  }

  // Si hubo error y el evento no se cargó
  if (error && !evento) {
      return (
          <div style={{ padding: '20px' }}>
              <Link to="/events">
                  <Button icon={<ArrowLeftOutlined />} style={{ marginBottom: '20px' }}>Volver a Eventos</Button>
              </Link>
              <Alert
                message="Error al Cargar el Evento"
                description={error}
                type="error"
                showIcon
                style={{ marginTop: '20px' }}
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
  const accreditedParticipants = participantes.filter(p => p.acreditado).length; // Usa boolean 'acreditado'

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Fila Título y Volver */}
      <Row justify="space-between" align="middle" wrap gutter={[0, 16]}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>{evento.nombre}</Title>
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
              <Descriptions.Item label="Fecha">{evento.fecha ? dayjs(evento.fecha).format('DD/MM/YYYY') : 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Lugar">{evento.lugar || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Descripción">{evento.descripcion || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Participantes"><Tag color="blue">{totalParticipants}</Tag></Descriptions.Item>
              <Descriptions.Item label="Acreditados"><Tag color="green">{accreditedParticipants}</Tag></Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} md={12}>
            <Title level={4}>Acciones</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space wrap>
                 {/* Pasa el eventId real y el callback actualizado */}
                 <ImportarParticipantes eventoId={evento.id} onImportComplete={handleImportComplete} />
                 <Button icon={<UserAddOutlined />} onClick={showAddParticipantModal}>
                    Añadir Manual
                 </Button>
              </Space>
              <Space wrap>
                 <Button type="primary" icon={<UserOutlined />} onClick={() => navigate(`/events/${evento.id}/accredit`)}>
                    Modo Acreditación
                 </Button>
                 <Button icon={<DownloadOutlined />} onClick={handleDownloadReport} disabled={participantes.length === 0}>
                    Descargar Reporte PDF
                 </Button>
              </Space>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Card Lista Participantes */}
      <Card title="Lista de Participantes">
        {/* Muestra error si falló carga de participantes pero no del evento */}
        {error && evento && (
           <Alert
             message="Error al cargar participantes"
             description={error} // Muestra el error específico de participantes
             type="warning"
             showIcon
             style={{ marginBottom: '16px' }}
            />
        )}
        {/* Pasa la lista de participantes real */}
        <ParticipantesListas participants={participantes} />
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
    </Space>
  );
};