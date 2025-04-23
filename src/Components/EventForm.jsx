// src/Components/EventForm.jsx
import React from "react";
import { Form, Input, DatePicker } from "antd";
import dayjs from "dayjs"; // AntD v5+ usa dayjs por defecto

// Recibe la instancia del formulario de AntD creada en el componente padre
export const EventForm = ({ form }) => {
  return (
    <Form
      form={form} // Conecta esta instancia del formulario
      layout="vertical"
      name="event_form" // Nombre del formulario (útil para debugging)
    >
      {/* Campo oculto para el ID (solo relevante al editar) */}
      {/* No es estrictamente necesario si manejas el ID en el padre */}
      {/* <Form.Item name="id" noStyle><Input type="hidden" /></Form.Item> */}

      <Form.Item
        name="name"
        label="Nombre del Evento"
        rules={[
          // Reglas de validación
          {
            required: true,
            message: "Por favor, ingresa el nombre del evento.",
          },
        ]}
      >
        <Input placeholder="Ej: Conferencia Anual de Tecnología" />
      </Form.Item>

      <Form.Item
        name="date"
        label="Fecha del Evento"
        rules={[
          {
            required: true,
            message: "Por favor, selecciona la fecha del evento.",
          },
        ]}
      >
        {/*
         * Importante: DatePicker devuelve/espera objetos dayjs.
         * Ajusta el formato si necesitas uno específico.
         * Tu API probablemente espere un string (ej: 'YYYY-MM-DD').
         * La conversión se hará en EventoABM antes de enviar a la API.
         */}
        <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
      </Form.Item>

      {/* Puedes añadir más campos aquí si tu modelo de evento los requiere */}
      {/* Ejemplo:
      <Form.Item name="location" label="Lugar">
        <Input placeholder="Ej: Centro de Convenciones Principal" />
      </Form.Item>
      */}
      {/* --- NUEVO --- */}
      <Form.Item
        name="location" // Asegúrate que el campo location también esté si lo tenías
        label="Lugar"
        // rules={[{ required: true, message: 'Por favor, ingresa el lugar.' }]} // Si es requerido
      >
        <Input placeholder="Ej: Centro de Convenciones Principal" />
      </Form.Item>

      {/* --- NUEVO --- */}
      <Form.Item name="description" label="Descripción (Opcional)">
        <Input.TextArea
          rows={3}
          placeholder="Detalles adicionales sobre el evento..."
        />
      </Form.Item>
      {/* --- FIN NUEVO --- */}
    </Form>
  );
};
