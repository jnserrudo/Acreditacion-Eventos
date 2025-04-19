// src/Pages/EventoABM.js
import React, { useState } from 'react';
import { initialEvents, initialParticipants } from '../mockData'; // Importa los datos iniciales
import {EventList} from '../Components/EventList';
import {EventForm} from '../Components/EventForm';
import { Button, Modal, Typography, message as antdMessage, Form,Space,Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import toast from 'react-hot-toast'; // Importa toast

const { Title } = Typography;

// --- Estado Global Simulado (Muy Básico) ---
// Estas variables persistirán mientras la app esté abierta en la pestaña.
// NO ES UNA BUENA PRÁCTICA PARA APPS REALES, sólo para este prototipo autocontenido.
let currentEvents = [...initialEvents];
let currentParticipants = JSON.parse(JSON.stringify(initialParticipants)); // Copia profunda inicial

export const EventoABM = () => {
  // El estado local refleja el estado "global" simulado
  const [events, setEvents] = useState(currentEvents);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Para el loading del botón OK del modal
  const [editingEvent, setEditingEvent] = useState(null);

  const [form] = Form.useForm();

  // --- Funciones para manipular el estado "global" simulado ---
  const updateGlobalEvents = (newEvents) => {
    currentEvents = newEvents;
    setEvents(currentEvents); // Actualiza estado local para re-renderizar
  };

  const updateGlobalParticipants = (newParticipantsData) => {
      currentParticipants = newParticipantsData;
      // No necesita re-renderizar este componente, pero sí EventoDetalle
  };

  // --- Manejo del Modal ---
  const showAddModal = () => {
    setEditingEvent(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (event) => {
    setEditingEvent(event);
    form.setFieldsValue({
      name: event.name,
      date: event.date ? dayjs(event.date) : null,
      location: event.location,
      description: event.description,
    });
    setIsModalVisible(true);
  };

  const handleCancelModal = () => {
    setIsModalVisible(false);
    setEditingEvent(null);
    form.resetFields();
  };

  const handleOkModal = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true); // Inicia loading

      // Simula un pequeño delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const eventData = {
        name: values.name,
        date: values.date ? values.date.format('YYYY-MM-DD') : null, // Formato consistente
        location: values.location,
        description: values.description || null,
      };

      if (editingEvent) {
        // --- SIMULACIÓN ACTUALIZAR ---
        const updatedEvents = currentEvents.map(ev =>
          ev.id === editingEvent.id ? { ...ev, ...eventData } : ev
        );
        updateGlobalEvents(updatedEvents); // Actualiza "global" y local
        toast.success(`Evento "${eventData.name}" actualizado.`);
      } else {
        // --- SIMULACIÓN CREAR ---
        const newEvent = {
          ...eventData,
          id: `evt-${Date.now()}`, // ID simple
        };
        const updatedEvents = [...currentEvents, newEvent];
        updateGlobalEvents(updatedEvents); // Actualiza "global" y local
        // Inicializa participantes para el nuevo evento en la data "global"
        updateGlobalParticipants({...currentParticipants, [newEvent.id]: []});
        toast.success(`Evento "${newEvent.name}" creado.`);
      }

      setIsModalVisible(false);
      setEditingEvent(null);
      form.resetFields();

    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
       if (errInfo.name !== 'ValidateError') {
           toast.error('Error simulado al guardar.');
       }
    } finally {
        setIsSubmitting(false); // Finaliza loading
    }
  };

  // --- Manejo de Eliminación ---
  const handleDeleteEvent = (eventId) => {
     Modal.confirm({
        title: '¿Eliminar este evento? ',
        content: 'Se eliminará el evento y sus participantes (solo en esta sesión).',
        okText: 'Sí, eliminar',
        okType: 'danger',
        cancelText: 'No',
        onOk: async () => {
            setIsSubmitting(true); // Usar para mostrar feedback si es necesario
            await new Promise(resolve => setTimeout(resolve, 300)); // Simula delay
            const eventToDelete = currentEvents.find(ev => ev.id === eventId);
            const updatedEvents = currentEvents.filter(ev => ev.id !== eventId);
            updateGlobalEvents(updatedEvents); // Actualiza "global" y local
            // Elimina participantes asociados del estado "global"
            const newParticipants = {...currentParticipants};
            delete newParticipants[eventId];
            updateGlobalParticipants(newParticipants);

            toast.success(`Evento "${eventToDelete?.name || eventId}" eliminado.`);
            setIsSubmitting(false);
        },
     });
  };

  return (
    <>
     {/* Usa Fragment para evitar div extra innecesario */}
     <Space direction="vertical" size="large" style={{ width: '100%' }}> {/* Envuelve en Space vertical */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
      <Title level={2}>Gestión de Eventos</Title>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={showAddModal}
        style={{ marginBottom: '20px' }}
      >
        Crear Nuevo Evento
      </Button>
    </div>
    {/* Lista de Eventos (la tabla se verá mejor en el fondo blanco) */}
        {/* Opcional: Envolver la lista/tabla en una Card para darle un borde */}
        <Card title="Eventos Programados" size="small">
        <EventList
                events={events}
                onEdit={showEditModal}
                onDelete={handleDeleteEvent}
            />
        </Card>

      </Space> {/* Cierra Space vertical */}

      {/* Modal para Crear/Editar */}
      <Modal
        title={editingEvent ? 'Editar Evento ' : 'Crear Nuevo Evento '}
        open={isModalVisible}
        onOk={handleOkModal}
        confirmLoading={isSubmitting} // Muestra loading en botón OK
        onCancel={handleCancelModal}
        destroyOnClose
        maskClosable={false}
      >
        <EventForm form={form} />
      </Modal>
    </>
  );
};

// Exportamos las variables "globales" simuladas para que otros componentes las lean
export { currentEvents, currentParticipants };