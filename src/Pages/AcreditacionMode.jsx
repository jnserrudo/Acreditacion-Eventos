// src/Pages/AcreditacionMode.js
import React, { useState, useEffect, useRef } from "react";
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
  Descriptions
} from "antd";
import { ArrowLeftOutlined,SearchOutlined  } from "@ant-design/icons";
// Importa la variable "global" simulada para OBTENER los datos iniciales
import { currentEvents, currentParticipants } from "./EventoABM";
import toast from 'react-hot-toast'; // Importa toast
const { Title, Text, Paragraph } = Typography;

export const AcreditacionMode = () => {
  const { eventId } = useParams();
  const navigate = useNavigate(); // <-- Añade useNavigate

  const [eventName, setEventName] = useState("");
  const [dniInput, setDniInput] = useState("");
  const [searchStatus, setSearchStatus] = useState("idle");
  const [foundParticipant, setFoundParticipant] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false); // Para búsqueda y acreditación

  // --- Estado Local para los participantes de ESTE evento ---
  // Se inicializa desde los datos "globales", pero los cambios (acreditación)
  // solo afectarán a este estado local para mantener la simulación simple.
  // Si necesitaras que persista entre navegación, habría que actualizar
  // la variable `currentParticipants` exportada, lo cual es más complejo.
  const [eventParticipants, setEventParticipants] = useState([]);

  const dniInputRef = useRef(null);

  useEffect(() => {
    // --- OBTENER DATOS DEL EVENTO Y PARTICIPANTES ---
    const participantsForEvent = currentParticipants[eventId] || [];
    const eventDetails = currentEvents.find((ev) => ev.id === eventId); // <-- BUSCAR EVENTO

    setEventParticipants(participantsForEvent);
    setEventName(eventDetails ? eventDetails.name : "Evento Desconocido"); // <-- GUARDAR NOMBRE (con fallback)
    dniInputRef.current?.focus();
  }, [eventId]); // Recargar si cambia el eventId (poco probable en este flujo)

  useEffect(() => {
    let timer;
    if (
      [
        "success_accredited",
        "error",
        "not_found",
        "already_accredited",
      ].includes(searchStatus)
    ) {
      timer = setTimeout(resetSearch, 3000);
    }
    return () => clearTimeout(timer);
  }, [searchStatus]);

  const handleSearch = async () => {
    if (!dniInput.trim()) return;

    setIsProcessing(true);
    setSearchStatus("searching");
    setFoundParticipant(null);
    setErrorMessage("");

    await new Promise((resolve) => setTimeout(resolve, 250)); // Simula búsqueda

    // Busca en el estado LOCAL de este componente
    const searchTerm = dniInput.trim(); // Renombrar variable para claridad
    const participant = eventParticipants.find(
      (p) => p.dni === searchTerm || p.entryNumber === searchTerm
    ); // <-- CAMBIO LÓGICA FIND

    if (participant) {
      setFoundParticipant(participant);
      // Usar 'accredited' (0 o 1)
      setSearchStatus(
        participant.accredited === 1 ? "already_accredited" : "found"
      ); // <-- CAMBIO a accredited === 1
    } else {
      setSearchStatus("not_found");
    }
    setIsProcessing(false);
  };

  const handleAccredit = async () => {
    if (!foundParticipant || foundParticipant.accredited || isProcessing)
      return;

    setIsProcessing(true);
    setErrorMessage("");

    await new Promise((resolve) => setTimeout(resolve, 300)); // Simula acreditación

    // --- ACTUALIZA EL ESTADO LOCAL de este componente ---
    const updatedParticipants = eventParticipants.map(
      (p) => (p.id === foundParticipant.id ? { ...p, accredited: 1 } : p) // <-- CAMBIO a accredited: 1
    );
    setEventParticipants(updatedParticipants); // Actualiza la lista local

    // Actualiza el participante encontrado para mostrar el estado correcto
    const newlyAccredited = updatedParticipants.find(
      (p) => p.id === foundParticipant.id
    );
    setFoundParticipant(newlyAccredited);

    setSearchStatus("success_accredited");
    setIsProcessing(false);

    toast.success(
      `Participante "${newlyAccredited.name} ${newlyAccredited.lastName}" acreditado.`,
      { duration: 3000 }
    );
    // Opcional: Actualizar también la variable "global" (más complejo)
    // currentParticipants[eventId] = updatedParticipants;
  };

  const resetSearch = () => {
    setDniInput("");
    setSearchStatus("idle");
    setFoundParticipant(null);
    setErrorMessage("");
    dniInputRef.current?.focus();
  };

  const renderResult = () => {
    // La lógica interna de los switch cases es la misma
    // Solo ajustamos un poco el contenedor o los textos si es necesario
    switch (searchStatus) {
      case "searching":
        return (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin tip="Buscando..." size="large" />
          </div>
        );
      case "error":
        return (
          <Alert
            message="Error Inesperado"
            description={errorMessage}
            type="error"
            showIcon
            closable
            onClose={resetSearch}
          />
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
                  {foundParticipant?.name} {foundParticipant?.lastName}
                </strong>{" "}
                (DNI: {foundParticipant?.dni} / Entrada:{" "}
                {foundParticipant?.entryNumber}) ya fue acreditado.
              </Text>
            }
            type="info"
            showIcon
          />
        );
      case "success_accredited":
        return (
          <Alert
            message="¡Acreditado Correctamente!"
            description={
              <Text strong style={{ fontSize: "1.1em" }}>
                <strong>
                  {foundParticipant?.name} {foundParticipant?.lastName}
                </strong>{" "}
                (DNI: {foundParticipant?.dni} / Entrada:{" "}
                {foundParticipant?.entryNumber})
              </Text>
            }
            type="success"
            showIcon
          />
        );
      case "found":
        // Usamos una Card para destacar al encontrado
        return (
          <Card
            title={
              <Title level={4} style={{ margin: 0 }}>
                Participante Encontrado
              </Title>
            }
            bordered={true}
            style={{ borderColor: "#1890ff" /* Azul AntD */ }}
          >
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Nombre">
                  {foundParticipant?.name} {foundParticipant?.lastName}
                </Descriptions.Item>
                <Descriptions.Item label="DNI">
                  {foundParticipant?.dni}
                </Descriptions.Item>
                <Descriptions.Item label="Nro. Entrada">
                  {foundParticipant?.entryNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Estado">
                  <Tag color="volcano">PENDIENTE ACREDITACIÓN</Tag>
                </Descriptions.Item>
              </Descriptions>
              <Button
                type="primary"
                onClick={handleAccredit}
                loading={isProcessing}
                disabled={isProcessing}
                size="large"
                block // Ocupa todo el ancho de la Card
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
  return (
    // No necesitamos el div con maxWidth y margin auto aquí, ya que App.js lo proporciona
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Fila para Título y Botón Volver */}
      <Row justify="space-between" align="middle" wrap gutter={[0, 16]}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            Modo Acreditación
          </Title>
          <Text type="secondary">Evento: {eventName}</Text>
        </Col>
        <Col>
          {/* Usar navigate en lugar de Link para que el botón no sea un enlace azul */}
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/events/${eventId}`)}
          >
            Volver al Detalle
          </Button>
        </Col>
      </Row>

      {/* Card para la Búsqueda */}
      <Card>
        <Title level={4}>Buscar Asistente</Title>
        <Space.Compact style={{ width: "100%" }}>
          <Input
            ref={dniInputRef}
            placeholder="Ingrese DNI o Nro. de Entrada"
            value={dniInput}
            onChange={(e) => setDniInput(e.target.value)}
            onPressEnter={handleSearch}
            disabled={
              isProcessing ||
              ["found", "success_accredited"].includes(searchStatus)
            } // Deshabilitar si ya se encontró/acreditó hasta limpiar
            size="large"
            allowClear // Permite limpiar el input fácilmente
            autoFocus
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
            loading={isProcessing && searchStatus === "searching"}
            disabled={isProcessing || !dniInput.trim()}
            size="large"
          >
            Buscar
          </Button>
        </Space.Compact>
        {/* Botón Limpiar más visible */}
        {searchStatus !== "idle" && (
          <Button
            type="link"
            onClick={resetSearch}
            disabled={isProcessing && searchStatus !== "searching"}
            style={{ marginTop: "10px" }}
          >
            Limpiar / Nueva Búsqueda
          </Button>
        )}
      </Card>

      {/* Área de Resultados (puede ser otra Card o simplemente un div) */}
      <Card title="Resultado de la Búsqueda" style={{ minHeight: "200px" }}>
        {renderResult()}
      </Card>
    </Space>
  );
};
