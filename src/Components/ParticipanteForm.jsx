// src/Components/ParticipanteForm.js
import React from "react";
import { Form, Input, Select, InputNumber } from "antd"; // Importa Select

const { Option } = Select; // Extrae Option de Select

// Opciones predefinidas para los Selects
const MEDIOS_PAGO_OPCIONES = [
  "Efectivo",
  /* "Transferencia", */
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
 // --- ¡AÑADIR ESTAS FUNCIONES HELPER! ---
 const requiredMsg = (fieldName) => `Por favor, ingrese ${fieldName}.`;
 const requiredSelectMsg = (fieldName) => `Por favor, seleccione ${fieldName}.`;
 const numberMsg = (fieldName) => `${fieldName} debe ser un número válido.`;
 const minMsg = (fieldName) => `${fieldName} no puede ser negativo.`;
 // -----------------------------------------

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
      <Form.Item
        name="telefono"
        label="Teléfono"
        rules={[{ required: true, message: "Ingrese el número de teléfono." }]}
      >
        <Input placeholder="Número de teléfono" />
      </Form.Item>
      <Form.Item
        name="correo"
        label="Correo Electrónico"
        rules={[
          { /* required: true, */ type: "email", message: "Correo inválido." },
        ]}
      >
        <Input placeholder="ejemplo@dominio.com" />
      </Form.Item>

      {/* --- NUEVO: Campo Precio Entrada --- */}
      <Form.Item
        name="precioEntrada" // Coincide con el modelo Prisma
        label="Precio de Entrada"
        rules={[
          { required: true, message: requiredMsg("el precio de entrada") },
          // Valida que sea número y no negativo
          {
            type: "number",
            min: 0,
            message: minMsg("El precio de entrada"),
            transform: (value) => parseFloat(value),
          },
        ]}
      >
        <InputNumber
          placeholder="Ej: 50000"
          style={{ width: "100%" }}
          min={0} // Permite 0 para entradas gratis
          step={1000}
          formatter={(value) =>
            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          }
          parser={(value) => value?.replace(/\$\s?|(,*)/g, "") ?? ""}
          // precision={2} // Descomenta si manejas centavos
        />
      </Form.Item>
      {/* --- FIN Precio Entrada --- */}

      {/* --- NUEVO: Campo Monto Pagado --- */}
      <Form.Item
        name="montoPagado" // Coincide con el modelo Prisma
        label="Monto Pagado Inicialmente"
        rules={[
          { required: true, message: requiredMsg("el monto pagado") },
          {
            type: "number",
            min: 0,
            message: minMsg("El monto pagado"),
            transform: (value) => parseFloat(value),
          },
        ]}
      >
        <InputNumber
          placeholder="Ej: 25000 o 50000 (si pagó todo)"
          style={{ width: "100%" }}
          min={0}
          step={1000}
          formatter={(value) =>
            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          }
          parser={(value) => value?.replace(/\$\s?|(,*)/g, "") ?? ""}
          // precision={2}
        />
      </Form.Item>
      {/* --- FIN Monto Pagado --- */}
      {/* --- NUEVOS CAMPOS --- */}
      <Form.Item
        name="medioPago" // Coincide con el modelo Prisma
        label="Medio de Pago"
        rules={[{ required: true, message: "Seleccione un medio de pago." }]}
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
        rules={[{ required: true, message: "Seleccione un rubro." }]}
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
