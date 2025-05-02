// src/Components/ParticipantesListas.js
import React, { useState } from "react"; // Importa useState para el modal interno
// Asegúrate de importar todo lo necesario de AntD
import {
  Table,
  Tag,
  Tooltip,
  Button,
  Space,
  Popconfirm,
  Modal,
  Input,
  InputNumber,
  Form,
} from "antd";
import {
  CheckCircleOutlined,
  EditOutlined,
  SafetyOutlined,
  DollarOutlined,
} from "@ant-design/icons"; // Añadir iconos necesarios
import { toast } from "react-hot-toast"; // Para toasts si los usas aquí

// Helper para formatear moneda
const formatCurrency = (value) => {
  const number = parseFloat(value);
  if (isNaN(number)) return "-";
  return `$${number.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`; // Ajusta formato si necesitas decimales
};

/* // --- Componente Interno para Acción "Asignar Nueva Entrada" ---
const AssignEntradaAction = ({ participante, onAssignNewEntry }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newEntrada, setNewEntrada] = useState("");
  const [loading, setLoading] = useState(false);

  const showModal = () => {
    setNewEntrada(""); // Limpia al abrir
    setIsModalVisible(true);
  };
  const handleCancel = () => setIsModalVisible(false);
  const handleOk = async () => {
    if (!newEntrada.trim()) {
      toast.error("Ingrese el nuevo número de entrada.");
      return;
    }
    setLoading(true);
    try {
      await onAssignNewEntry(participante.id, newEntrada.trim());
      setIsModalVisible(false); // Cierra en éxito
    } catch (error) {
      // El toast de error ya lo maneja el componente padre
      console.error("Error al asignar nueva entrada:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Tooltip title="Asignar Nueva Entrada (Perdida/Olvido)">
        <Button
          icon={<SafetyOutlined />}
          size="small"
          type="dashed"
          onClick={showModal}
        />
      </Tooltip>
      <Modal
        title={`Asignar Nueva Entrada a ${participante.nombre} ${participante.apellido}`}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={loading}
        okText="Asignar"
        cancelText="Cancelar"
        destroyOnClose
      >
        <p>Entrada Original: {participante.numeroEntrada}</p>
        <p>Nueva Entrada Actual: {participante.nuevaEntrada || "Ninguna"}</p>
        <Input
          placeholder="Ingrese nuevo Nro Entrada"
          value={newEntrada}
          onChange={(e) => setNewEntrada(e.target.value)}
        />
      </Modal>
    </>
  );
};

// --- Componente Interno para Acción "Editar Precio Entrada" ---
const EditPrecioAction = ({ participante, onUpdatePrecioEntrada }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newPrecio, setNewPrecio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm(); // Usar Form aquí para InputNumber y validación

  const showModal = () => {
    // Usa null si el precio es null, o el número si existe
    const initialPrice =
      participante.precioEntrada !== null
        ? parseFloat(participante.precioEntrada)
        : null;
    setNewPrecio(initialPrice); // Guarda estado local por si acaso
    form.setFieldsValue({ nuevoPrecioForm: initialPrice }); // Establece valor inicial en el form
    setIsModalVisible(true);
  };
  const handleCancel = () => setIsModalVisible(false);
  const handleOk = async () => {
    try {
      const values = await form.validateFields(); // Valida el InputNumber
      const precioAEnviar = values.nuevoPrecioForm; // Puede ser número o null
      setLoading(true);
      await onUpdatePrecioEntrada(participante.id, precioAEnviar);
      setIsModalVisible(false);
    } catch (error) {
      // Error de validación o API
      if (error.errorFields) console.log("Error validación precio");
      else console.error("Error al actualizar precio:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Tooltip title="Editar Precio de Entrada">
        <Button
          icon={<DollarOutlined />}
          size="small"
          type="dashed"
          onClick={showModal}
        />
      </Tooltip>
      <Modal
        title={`Editar Precio Entrada de ${participante.nombre} ${participante.apellido}`}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={loading}
        okText="Actualizar Precio"
        cancelText="Cancelar"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <p>Precio Actual: {formatCurrency(participante.precioEntrada)}</p>
          <Form.Item
            name="nuevoPrecioForm"
            label="Nuevo Precio (0 para Gratis, vacío para quitar)"
            rules={[
              // Permite vacío/null, pero si hay valor, debe ser >= 0
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (value === null || value === undefined || value === "")
                    return Promise.resolve();
                  if (isNaN(value) || value < 0) {
                    return Promise.reject(
                      new Error("Debe ser número válido (0 o mayor)")
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <InputNumber
              placeholder="Ej: 45000"
              style={{ width: "100%" }}
              min={0}
              step={1000}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value?.replace(/\$\s?|(,*)/g, "") ?? ""}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}; */

export const ParticipantesListas = ({
  participants = [],
  // Funciones recibidas como props desde EventoDetalle
  onCancelPayment,
  onAssignNewEntry,
  onUpdatePrecioEntrada,
}) => {
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

    // --- Columnas de Pago ---
    {
      title: "Precio Entrada",
      dataIndex: "precioEntrada",
      key: "precioEntrada",
      align: "right",
      width: 120,
      render: formatCurrency, // Usa helper
      sorter: (a, b) =>
        parseFloat(a.precioEntrada || -1) - parseFloat(b.precioEntrada || -1), // Ordena, null al final
    },
    {
      title: "Monto Pagado",
      dataIndex: "montoPagado",
      key: "montoPagado",
      align: "right",
      width: 120,
      render: formatCurrency, // Usa helper
      sorter: (a, b) =>
        parseFloat(a.montoPagado || 0) - parseFloat(b.montoPagado || 0),
    },
    {
      title: "Estado Pago",
      key: "estadoPago",
      align: "center",
      width: 100,
      render: (_, record) => {
        // Asegura comparar números
        const monto = parseFloat(record.montoPagado || 0);
        const precio = parseFloat(record.precioEntrada); // NaN si es null

        if (isNaN(precio)) {
          // Si no tiene precio asignado
          return <Tag color="default">N/A</Tag>;
        } else if (monto >= precio) {
          return <Tag color="success">Total</Tag>;
        } else if (monto > 0) {
          return <Tag color="warning">Parcial</Tag>;
        } else {
          return <Tag color="error">Pendiente</Tag>; // Pendiente si monto es 0 o menos
        }
      },
      filters: [
        /* ... filtros si los necesitas ... */
      ],
      onFilter: (value, record) => {
        /* ... lógica de filtro ... */
      },
    },

    // --- COLUMNA NUEVA ENTRADA (Verificar que esté así) ---
    {
      title: "Nueva Entrada",
      dataIndex: "nuevaEntrada", // Campo del modelo Prisma
      key: "nuevaEntrada",
      width: 120, // Ajusta el ancho según necesidad
      render: (text) => (text ? <Tag color="purple">{text}</Tag> : "-"), // Muestra con Tag si existe, sino '-'
      responsive: ["md"], // Opcional: Ocultar en pantallas pequeñas
    },
    // --- FIN COLUMNA NUEVA ENTRADA ---

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

    // --- Columna de Acciones ---
    {
      title: "Acciones",
      key: "actions",
      align: "center",
      fixed: "right",
      width: 130,
      render: (_, record) => {
        const monto = parseFloat(record.montoPagado || 0);
        const precio = parseFloat(record.precioEntrada); // NaN si es null
        const pagoCompleto = !isNaN(precio) && monto >= precio;
        const puedeCancelarSaldo = !isNaN(precio) && monto < precio; // Solo si tiene precio y no ha pagado todo

        return (
          <Space size="small">
            {/* Botón Cancelar Saldo */}
            <Tooltip
              title={
                pagoCompleto
                  ? "Pago ya completo"
                  : isNaN(precio)
                  ? "Asignar precio primero"
                  : "Registrar Pago Total"
              }
            >
              {/* Usamos Popconfirm para confirmación rápida */}
              <Popconfirm
                title={`Completar pago a ${formatCurrency(
                  record.precioEntrada
                )}?`}
                onConfirm={() => onCancelPayment(record.id)} // Llama al handler del padre
                okText="Sí"
                cancelText="No"
                disabled={!puedeCancelarSaldo} // Deshabilitado si no puede cancelar
              >
                <Button
                  icon={<CheckCircleOutlined />}
                  size="small"
                  disabled={!puedeCancelarSaldo} // Doble seguridad
                />
              </Popconfirm>
            </Tooltip>
            {/* 2. Botón Editar Precio (Llama a la prop onUpdatePrecioEntrada) */}
            <Tooltip title="Editar Precio de Entrada">
              {/* Llama a la prop onUpdatePrecioEntrada pasando el objeto participante completo */}
              <Button
                icon={<DollarOutlined />}
                size="small"
                type="dashed"
                onClick={() => onUpdatePrecioEntrada(record)} // Llama a la función que abre el modal en EventoDetalle
               />
            </Tooltip>

            {/* 3. Botón Asignar Nueva Entrada (Llama a la prop onAssignNewEntry) */}
            <Tooltip title="Asignar Nueva Entrada (Perdida/Olvido)">
              {/* Llama a la prop onAssignNewEntry pasando el objeto participante completo */}
              <Button
                icon={<SafetyOutlined />}
                size="small"
                type="dashed"
                onClick={() => onAssignNewEntry(record)} // Llama a la función que abre el modal en EventoDetalle
              />
            </Tooltip>
          </Space>
        );
      },
    },
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
