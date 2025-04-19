// src/Components/ParticipantList.js
import React from 'react';
import { Table, Tag, Tooltip } from 'antd'; // Añadido Tooltip

export const ParticipantList = ({ participants = [] }) => {

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      // fixed: 'left', // Descomentar si quieres fijar esta columna al hacer scroll horizontal
    },
    {
      title: 'Apellido',
      dataIndex: 'lastName',
      key: 'lastName',
      sorter: (a, b) => (a.lastName || '').localeCompare(b.lastName || ''),
      // fixed: 'left', // Descomentar si quieres fijar esta columna al hacer scroll horizontal
    },
    {
      title: 'DNI',
      dataIndex: 'dni',
      key: 'dni',
    },
    {
      title: 'Nro. Entrada',
      dataIndex: 'entryNumber',
      key: 'entryNumber',
    },
    {
      title: 'Estado', // Título más corto
      dataIndex: 'accredited',
      key: 'accredited',
      align: 'center', // Centrar contenido
      width: 120, // Ancho fijo para esta columna puede ayudar
      render: (accredited) => (
        <Tag color={accredited === 1 ? 'green' : 'volcano'} style={{ margin: 'auto' }}>
          {accredited === 1 ? 'ACREDITADO' : 'PENDIENTE'}
        </Tag>
      ),
      filters: [
        { text: 'Acreditado', value: 1 },
        { text: 'Pendiente', value: 0 },
      ],
      onFilter: (value, record) => record.accredited === value,
    },
    // --- COLUMNAS OPCIONALES OCULTAS EN MÓVIL ---
    {
      title: 'Teléfono',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone || '-',
      // responsive: ['md'] -> Oculta en pantallas < 768px (sm y xs)
      responsive: ['md'],
    },
    {
      title: 'Correo', // Título más corto
      dataIndex: 'email',
      key: 'email',
      render: (email) => email ? (
         // Tooltip para correos largos
         <Tooltip title={email}>
             <span style={{ display: 'inline-block', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                 {email}
             </span>
         </Tooltip>
      ) : '-',
      // responsive: ['lg'] -> Oculta en pantallas < 992px (md, sm, xs) - Más agresivo
      responsive: ['lg'],
    },
    // --- FIN COLUMNAS OPCIONALES ---
    // Podrías añadir una columna de acciones aquí si fuera necesario (ej: des-acreditar, editar participante)
    // {
    //   title: 'Acciones',
    //   key: 'actions',
    //   align: 'center',
    //   fixed: 'right', // Fija la columna de acciones a la derecha
    //   render: (_, record) => (
    //     <Space>
    //       {/* Botones de acción para cada participante */}
    //     </Space>
    //   ),
    // }
  ];

  return (
    <Table
      columns={columns}
      dataSource={participants}
      rowKey="id"
      pagination={{
        pageSize: 10, // Reducido para móvil puede ser mejor
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
        showTotal: (total, range) => `${range[0]}-${range[1]} de ${total}`,
        hideOnSinglePage: true,
        size: 'small', // Paginación más compacta
      }}
      locale={{ emptyText: 'No hay participantes cargados para este evento.' }}
      // style={{ marginTop: '20px' }} // QUITADO - Dejar que el contenedor padre maneje el margen
      // --- CLAVE PARA RESPONSIVIDAD DE TABLA ---
      scroll={{ x: 'max-content' }} // Habilita scroll horizontal
      // -------------------------------------------
      // bordered // Quitado borde para un look más limpio (opcional)
      size="small" // Tabla más compacta
      className="responsive-participant-table" // Clase CSS opcional para estilos específicos
    />
  );
};