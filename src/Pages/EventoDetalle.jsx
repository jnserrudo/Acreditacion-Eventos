// src/Pages/EventoDetalle.js
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Typography,
  Button,
  Divider,
  message as antdMessage,
  Descriptions,
  Card,
  Tag,
  Spin,
  Alert, Space, Modal, Form, Row, Col
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  UserAddOutlined,
  EditOutlined, DeleteOutlined
} from "@ant-design/icons";
// Importa las variables "globales" simuladas desde EventoABM
import { currentEvents, currentParticipants } from "./EventoABM";
import { ImportarParticipantes } from "../Components/ImportarParticipantes";
import { ParticipantList } from "../Components/ParticipantesListas";
import dayjs from "dayjs";

import toast from 'react-hot-toast'; // Importa toast


import { ParticipanteForm } from "../Components/ParticipanteForm";

const { Title, Paragraph, Text } = Typography;

export const EventoDetalle = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dentro del componente EventoDetalle
  const [isParticipantModalVisible, setIsParticipantModalVisible] =
    useState(false);
  const [isSubmittingParticipant, setIsSubmittingParticipant] = useState(false);
  const [participantForm] = Form.useForm();

  const showAddParticipantModal = () => {
    participantForm.resetFields();
    setIsParticipantModalVisible(true);
  };

  const handleCancelParticipantModal = () => {
    setIsParticipantModalVisible(false);
  };

  const handleAddParticipantOk = async () => {
    try {
      const values = await participantForm.validateFields();
      setIsSubmittingParticipant(true);
      await new Promise((resolve) => setTimeout(resolve, 300)); // Simular delay

      const newParticipant = {
        id: `par-${Date.now()}`, // ID simple único
        eventId: eventId,
        name: values.name,
        lastName: values.lastName,
        dni: values.dni,
        entryNumber: values.entryNumber,
        phone: values.phone || null,
        email: values.email || null,
        accredited: 0, // Por defecto no acreditado
      };

      // Actualizar estado "global" y local
      const updatedEventParticipants = [
        ...(currentParticipants[eventId] || []),
        newParticipant,
      ];
      currentParticipants[eventId] = updatedEventParticipants;
      setParticipants(updatedEventParticipants); // Actualiza local
      toast.success(
        `Participante "${newParticipant.name} ${newParticipant.lastName}" añadido .`
      );
      setIsParticipantModalVisible(false);
    } catch (errInfo) {
      console.log("Validate Failed:", errInfo);
      if (errInfo.name !== "ValidateError") {
        toast.error('Error simulado al guardar participante.');
      }
    } finally {
      setIsSubmittingParticipant(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    // Simula la carga de datos buscando en las variables "globales"
    const foundEvent = currentEvents.find((ev) => ev.id === eventId);
    const foundParticipants = currentParticipants[eventId] || [];

    // Simula un pequeño delay de carga
    setTimeout(() => {
      if (foundEvent) {
        setEvent(foundEvent);
        setParticipants(foundParticipants);
      } else {
        setError(`Evento con ID ${eventId} no encontrado .`);
      }
      setLoading(false);
    }, 300); // 300ms delay

    // No hay dependencias necesarias ya que lee variables globales al montar/navegar
  }, [eventId]);

  // Handler para cuando la importación simulada tiene éxito
  const handleImportSuccess = (simulatedNewParticipants) => {
    // Añade los participantes simulados al estado "global" y local
    const eventParticipants = currentParticipants[eventId] || [];
    const updatedEventParticipants = [
      ...eventParticipants,
      ...simulatedNewParticipants.map((p) => ({ ...p, eventId: eventId })),
    ]; // Asegura eventId
    currentParticipants[eventId] = updatedEventParticipants; // Actualiza "global"
    setParticipants(updatedEventParticipants); // Actualiza local para re-renderizar
    toast.success(
      `${simulatedNewParticipants.length} participantes añadidos .`
    );
  };

  const handleDownloadReport = () => {
    console.log("Descarga de reporte simulada.");
    toast("Descarga de reporte.", { icon: 'ℹ️' });
  };

  // --- Renderizado ---
  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" tip="Cargando..." />
      </div>
    );
  if (error)
    return (
      <div style={{ padding: "20px" }}>
        <Link to="/events">
          <Button icon={<ArrowLeftOutlined />}>Volver</Button>
        </Link>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginTop: "20px" }}
        />
      </div>
    );
  if (!event)
    return (
      <div style={{ padding: "20px" }}>
        <Link to="/events">
          <Button icon={<ArrowLeftOutlined />}>Volver</Button>
        </Link>
        <Alert
          message="Evento no encontrado"
          type="warning"
          showIcon
          style={{ marginTop: "20px" }}
        />
      </div>
    );

  const totalParticipants = participants.length;
  const accreditedParticipants = participants.filter(
    (p) => p.isAccredited
  ).length;

 
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Fila para Título y Botón Volver */}
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={2} style={{ margin: 0 }}>{event.name}</Title>
          <Text type="secondary">{event.id}</Text> {/* Mostrar ID puede ser útil */}
        </Col>
        <Col>
          <Link to="/events">
            <Button icon={<ArrowLeftOutlined />}>Volver a Eventos</Button>
          </Link>
        </Col>
      </Row>

      {/* Card para Detalles del Evento y Acciones */}
      <Card>
        <Row gutter={[16, 16]}> {/* Gutters para espaciado entre columnas y filas */}
          {/* Columna de Detalles */}
          <Col xs={24} md={12}> {/* Ocupa todo en móvil, mitad en desktop */}
            <Title level={4}>Detalles del Evento</Title>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Fecha">{event.date ? dayjs(event.date).format('DD/MM/YYYY') : 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Lugar">{event.location || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Descripción">{event.description || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Participantes Totales"><Tag color="blue">{totalParticipants}</Tag></Descriptions.Item>
              <Descriptions.Item label="Acreditados"><Tag color="green">{accreditedParticipants}</Tag></Descriptions.Item>
            </Descriptions>
          </Col>
          {/* Columna de Acciones */}
          <Col xs={24} md={12}>
            <Title level={4}>Acciones</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space wrap> {/* Wrap para que los botones pasen abajo si no caben */}
                  <ImportarParticipantes onImportSuccess={handleImportSuccess} />
                  <Button icon={<UserAddOutlined />} onClick={showAddParticipantModal}>
                    Añadir Participante
                  </Button>
              </Space>
              <Space wrap>
                  <Button type="primary" icon={<UserOutlined />} onClick={() => navigate(`/events/${eventId}/accredit`)}>
                    Modo Acreditación
                  </Button>
                  <Button icon={<DownloadOutlined />} onClick={handleDownloadReport}>
                    Descargar Reporte
                  </Button>
              </Space>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Card para la Lista de Participantes */}
      <Card title="Lista de Participantes">
        {participants.length > 0 ? (
           <ParticipantList participants={participants} />
        ) : (
           <Text type="secondary">Aún no hay participantes vinculados a este evento.</Text>
        )}
      </Card>

       {/* Modal para Añadir Participante */}
       <Modal
            title="Añadir Nuevo Participante "
            open={isParticipantModalVisible}
            onOk={handleAddParticipantOk}
            confirmLoading={isSubmittingParticipant}
            onCancel={handleCancelParticipantModal}
            destroyOnClose
            maskClosable={false}
        >
            <ParticipanteForm form={participantForm} />
       </Modal>
    </Space>
  );
};