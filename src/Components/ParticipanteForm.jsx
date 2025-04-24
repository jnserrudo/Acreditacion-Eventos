// src/Components/ParticipanteForm.js
import React from "react";
import { Form, Input, Select } from "antd"; // Importa Select

const { Option } = Select; // Extrae Option de Select

// Opciones predefinidas para los Selects
const MEDIOS_PAGO_OPCIONES = [
  "Efectivo",
  "Transferencia",
  "QR",
  "Tarjeta Débito/Crédito",
  "Otro",
  // Puedes añadir un valor 'Otro' si quieres permitir entrada manual también
];

const RUBROS_OPCIONES = [
  "Peluqueria",
  "Barberia",
  "Uñas y Pestañas",
  "Make Up",
  "Estética",
  "Otros",
  // Puedes añadir 'Otro'
];

export const ParticipanteForm = ({ form }) => {
  return (
    <Form form={form} layout="vertical" name="participante_form">
      {/* --- Campos existentes --- */}
      <Form.Item
        name="nombre"
        label="Nombre"
        rules={[{ required: true, message: "Ingrese el nombre." }]}
      >
        <Input placeholder="Nombre del participante" />
      </Form.Item>
      <Form.Item
        name="apellido"
        label="Apellido"
        rules={[{ required: true, message: "Ingrese el apellido." }]}
      >
        <Input placeholder="Apellido del participante" />
      </Form.Item>
      <Form.Item
        name="dni"
        label="DNI"
        rules={[{ required: true, message: "Ingrese el DNI." }]}
      >
        <Input placeholder="Número de DNI" />
      </Form.Item>
      <Form.Item
        name="numeroEntrada"
        label="Número de Entrada"
        rules={[{ required: true, message: "Ingrese el Nro. de Entrada." }]}
      >
        <Input placeholder="Código o número de la entrada" />
      </Form.Item>
      <Form.Item name="telefono" label="Teléfono" rules={[{ required: true, message: "Ingrese el número de teléfono." }]}>
        <Input placeholder="Número de teléfono" />
      </Form.Item>
      <Form.Item
        name="correo"
        label="Correo Electrónico"
        rules={[{ required: true, type: "email", message: "Correo inválido." }]}
      >
        <Input placeholder="ejemplo@dominio.com" />
      </Form.Item>

      {/* --- NUEVOS CAMPOS --- */}
      <Form.Item
        name="medioPago" // Coincide con el modelo Prisma
        label="Medio de Pago"
        rules={[{ required: true, message: 'Seleccione un medio de pago.' }]}
        // No es requerido, pero si se elige, se envía el string seleccionado
      >
        <Select placeholder="Seleccione un medio de pago" /* allowClear */>
          {MEDIOS_PAGO_OPCIONES.map((opcion) => (
            <Option key={opcion} value={opcion}>
              {opcion}
            </Option>
          ))}
          {/* <Option value="Otro">Otro (Especificar)</Option> */}
        </Select>
      </Form.Item>
      {/* Podrías añadir un Input condicional si seleccionan 'Otro' */}

      <Form.Item
        name="rubro" // Coincide con el modelo Prisma
        label="Rubro"
        rules={[{ required: true, message: 'Seleccione un rubro.' }]}
      >
        <Select placeholder="Seleccione un rubro" /* allowClear */>
          {RUBROS_OPCIONES.map((opcion) => (
            <Option key={opcion} value={opcion}>
              {opcion}
            </Option>
          ))}
          {/* <Option value="Otro">Otro (Especificar)</Option> */}
        </Select>
      </Form.Item>
      {/* --- FIN NUEVOS CAMPOS --- */}
    </Form>
  );
};
