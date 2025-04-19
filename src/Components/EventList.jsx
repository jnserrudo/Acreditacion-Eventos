// src/components/event/EventList.js
import React from 'react';
import { List, Button, Typography, Space } from 'antd';
import { Link } from 'react-router-dom';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'; // Íconos

const { Text } = Typography;

// Recibe la lista de eventos y funciones para manejar acciones (a implementar en EventoABM)
export const EventList = ({ events, onEdit, onDelete }) => {
  return (
    <List
      itemLayout="horizontal"
      dataSource={events}
      locale={{ emptyText: 'No hay eventos para mostrar.' }} // Mensaje si la lista está vacía
      renderItem={(event) => (
        <List.Item
          key={event.id} // ¡Importante! Usa el ID real del evento que viene de la API
          actions={[
            // Enlace para ver detalles
            <Link to={`/events/${event.id}`} key="view">
              <Button type="link" icon={<EyeOutlined />}>
                 Ver/Gestionar
              </Button>
            </Link>,
            // Botón Editar (llama a la función pasada por props)
            <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(event)} key="edit">
               Editar
            </Button>,
             // Botón Eliminar (llama a la función pasada por props)
            <Button type="link" danger icon={<DeleteOutlined />} onClick={() => onDelete(event.id)} key="delete">
               Eliminar
            </Button>,
          ]}
        >
          <List.Item.Meta
            // El título es un enlace al detalle del evento
            title={<Link to={`/events/${event.id}`}>{event.name || 'Evento sin nombre'}</Link>}
            // Puedes mostrar la fecha u otra información relevante aquí
            description={event.date ? `Fecha: ${new Date(event.date).toLocaleDateString()}` : 'Fecha no especificada'}
          />
        </List.Item>
      )}
    />
  );
};