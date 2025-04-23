// src/Components/ParticipantesListas.js
import React from "react";
import { Table, Tag, Tooltip } from "antd";

export const ParticipantesListas = ({ participants = [] }) => {
  const columns = [
    // --- Columnas existentes ---
    {
      title: "Nombre",
      dataIndex: "nombre",
      key: "nombre",
      sorter: (a, b) => a.nombre.localeCompare(b.nombre),
    },
    {
      title: "Apellido",
      dataIndex: "apellido",
      key: "apellido",
      sorter: (a, b) => (a.apellido || "").localeCompare(b.apellido || ""),
    },
    { title: "DNI", dataIndex: "dni", key: "dni" },
    { title: "Nro Entrada", dataIndex: "numeroEntrada", key: "numeroEntrada" }, // Corregido dataIndex a camelCase
    {
      title: "Estado",
      dataIndex: "acreditado",
      key: "acreditado",
      align: "center",
      width: 120,
      render: (
        acreditado // Usa el boolean 'acreditado'
      ) => (
        <Tag
          color={acreditado ? "green" : "volcano"}
          style={{ margin: "auto" }}
        >
          {acreditado ? "ACREDITADO" : "PENDIENTE"}
        </Tag>
      ),
      // Ajusta filtros para boolean
      filters: [
        { text: "Acreditado", value: true },
        { text: "Pendiente", value: false },
      ],
      onFilter: (value, record) => record.acreditado === value,
    },
    {
      title: "Teléfono",
      dataIndex: "telefono",
      key: "telefono",
      render: (tel) => tel || "-",
      responsive: ["md"],
    },
    {
      title: "Correo",
      dataIndex: "correo",
      key: "correo",
      render: (correo) =>
        correo ? (
          <Tooltip title={correo}>
            <span
              style={
                {
                  /*...*/
                }
              }
            >
              {correo}
            </span>
          </Tooltip>
        ) : (
          "-"
        ),
      responsive: ["lg"],
    },

    // --- NUEVAS COLUMNAS ---
    {
      title: "Medio Pago",
      dataIndex: "medioPago", // Coincide con el modelo Prisma
      key: "medioPago",
      render: (medio) => medio || "-", // Muestra '-' si es nulo/vacío
      // Podrías hacerla responsive también si la tabla se vuelve muy ancha
      responsive: ["lg"], // Ejemplo: ocultar en móvil y tablet pequeña
      // Podrías añadir filtros si quieres filtrar por medio de pago
      // filters: [...],
      // onFilter: (...) => ...,
    },
    {
      title: "Rubro",
      dataIndex: "rubro", // Coincide con el modelo Prisma
      key: "rubro",
      render: (rubro) => rubro || "-",
      responsive: ["lg"], // Ejemplo
      // filters: [...],
      // onFilter: (...) => ...,
    },
    // --- FIN NUEVAS COLUMNAS ---

    // --- Columna de Acciones (Opcional) ---
    // { title: 'Acciones', key: 'actions', align: 'center', fixed: 'right', render: (...) => (...) }
  ];

  return (
    <Table
      columns={columns}
      dataSource={participants} // Ya recibe los datos completos de la API
      rowKey="id"
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "50", "100"],
        showTotal: (total, range) => `${range[0]}-${range[1]} de ${total}`,
        hideOnSinglePage: true,
        size: "small",
      }}
      locale={{ emptyText: "No hay participantes cargados." }}
      scroll={{ x: "max-content" }}
      size="small"
      className="responsive-participant-table"
    />
  );
};
