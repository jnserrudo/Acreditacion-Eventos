// src/components/event/EventList.js
import React from 'react';
import { List, Button, Typography, Space, Tooltip, Row, Col, Tag } from 'antd'; // Añadido Tooltip, Row, Col, Tag
import { Link } from 'react-router-dom';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs'; // Asegúrate de tener dayjs instalado o usa toLocaleDateString

const { Text, Paragraph } = Typography;

export const EventList = ({ events = [], onEdit, onDelete }) => {

  // Función para formatear fecha de forma segura
  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no especificada';
    // Intenta parsear con dayjs si está disponible y es válido
    const date = dayjs(dateString);
    if (date.isValid()) {
      return date.format('DD/MM/YYYY'); // Formato deseado
    }
    // Fallback a formato básico si dayjs falla o no está
    try {
       return new Date(dateString).toLocaleDateString();
    } catch (e) {
        return 'Fecha inválida';
    }
  };

  return (
    <List
      itemLayout="vertical" // Cambiado a vertical para mejor flujo en móvil
      dataSource={events}
      locale={{ emptyText: 'No hay eventos para mostrar.' }}
      pagination={{ // Paginación opcional
        pageSize: 5, // Menos items por página puede ser mejor para listas verticales
        hideOnSinglePage: true,
        size: 'small', // Paginación más compacta
      }}
      renderItem={(event) => (
        <List.Item
          key={event.id}
          // Usamos extra para las acciones, se colocarán a la derecha en desktop
          // y abajo en móvil debido a itemLayout="vertical"
          extra={
            <Space direction="horizontal" align="center" wrap> {/* 'wrap' por si acaso */}
              <Tooltip title="Ver/Gestionar Detalles">
                <Link to={`/events/${event.id}`}>
                  {/* Botón primario sutil para la acción principal */}
                  <Button type="default" icon={<EyeOutlined />} size="middle">
                     Gestionar
                  </Button>
                </Link>
              </Tooltip>
              <Tooltip title="Editar Evento">
                <Button
                  icon={<EditOutlined />}
                  onClick={() => onEdit(event)}
                  size="middle"
                />
              </Tooltip>
              <Tooltip title="Eliminar Evento">
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onDelete(event.id)}
                  size="middle"
                />
              </Tooltip>
            </Space>
          }
        >
          {/* Contenido principal del item */}
          <List.Item.Meta
            title={<Link to={`/events/${event.id}`} style={{ fontSize: '1.1em' }}>{event.nombre || 'Evento sin nombre'}</Link>}
            // Usamos description para más detalles, se verá debajo del título
            description={
              <Space direction="vertical" size="small" style={{width: '100%'}}>
                 <Text type="secondary">
                   <Tag>{formatDate(event.fecha)}</Tag> {event.lugar || 'Lugar no especificado'}
                 </Text>
                 {event.descripcion && (
                    <Paragraph ellipsis={{ rows: 2, expandable: false }} type="secondary">
                        {event.descripcion}
                    </Paragraph>
                 )}
              </Space>
            }
          />
        </List.Item>
      )}
    />
  );
};