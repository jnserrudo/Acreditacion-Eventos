// src/Components/ParticipantList.js
// (O guarda en src/components/participant/ParticipantList.js si prefieres esa estructura)

import React from "react";
import { Table, Tag } from "antd";

// Componente para mostrar la tabla de participantes
export const ParticipantList = ({ participants = [] }) => {
  // Asegura default como array vacío

  // Definición de las columnas para la tabla de Ant Design
  const columns = [
    {
      title: "Nombre", // Título de la columna
      dataIndex: "name", // Campo del objeto participante a mostrar
      key: "name", // Key única para la columna
      sorter: (a, b) => a.name.localeCompare(b.name), // Habilita ordenamiento alfabético
    },
    {
      title: "Apellido",
      dataIndex: "lastName",
      key: "lastName",
      sorter: (a, b) => (a.lastName || "").localeCompare(b.lastName || ""), // Ordenamiento, maneja posibles null/undefined
    },
    {
      title: "DNI",
      dataIndex: "dni",
      key: "dni",
    },
    // --- NUEVA COLUMNA ---
    {
      title: "Nro. Entrada",
      dataIndex: "entryNumber",
      key: "entryNumber",
    },
    // --- FIN NUEVA ---
    {
      title: "Estado Acreditación",
      dataIndex: "accredited", // <-- CAMBIO dataIndex
      key: "accredited",
      render: (
        accredited // <-- CAMBIO lógica render
      ) => (
        <Tag color={accredited === 1 ? "green" : "volcano"}>
          {accredited === 1 ? "ACREDITADO" : "PENDIENTE"}
        </Tag>
      ),
      filters: [
        // <-- CAMBIO values
        { text: "Acreditado", value: 1 },
        { text: "Pendiente", value: 0 },
      ],
      onFilter: (value, record) => record.accredited === value, // <-- CAMBIO lógica onFilter
    },
    // --- NUEVAS COLUMNAS OPCIONALES ---
    {
      title: "Teléfono",
      dataIndex: "phone",
      key: "phone",
      render: (phone) => phone || "-", // Muestra '-' si es null/undefined
    },
    {
      title: "Correo Electrónico",
      dataIndex: "email",
      key: "email",
      render: (email) => email || "-", // Muestra '-' si es null/undefined
    },
    // --- FIN NUEVAS OPCIONALES ---
  ];

  return (
    <Table
      columns={columns} // Define la estructura de la tabla
      dataSource={participants} // Los datos a mostrar (el array de participantes)
      rowKey="id" // Campo único para identificar cada fila (el ID del participante)
      pagination={{
        // Configuración de paginación
        pageSize: 15, // Cuántos items por página
        showSizeChanger: true, // Permite cambiar el tamaño de página
        pageSizeOptions: ["15", "30", "50", "100"], // Opciones de tamaño
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} de ${total} participantes`, // Muestra el total
        hideOnSinglePage: true, // Oculta paginación si todo cabe en una página
      }}
      locale={{ emptyText: "No hay participantes cargados para este evento." }} // Mensaje si no hay datos
      style={{ marginTop: "20px" }} // Un poco de margen superior
      scroll={{ x: "max-content" }} // Habilita scroll horizontal si las columnas no caben
      bordered // Añade bordes a la tabla (opcional)
      size="small" // Tabla un poco más compacta (opcional)
    />
  );
};

// Si prefieres export default:
// export default ParticipantList;
