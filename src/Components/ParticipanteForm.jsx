import React from 'react'
import { Form, Input } from 'antd';

export const ParticipanteForm = ({ form }) => {
    return (
      <Form form={form} layout="vertical" name="participant_form">
        <Form.Item
          name="name"
          label="Nombre"
          rules={[{ required: true, message: 'Por favor, ingresa el nombre.' }]}
        >
          <Input placeholder="Nombre del participante" />
        </Form.Item>
  
        <Form.Item
          name="lastName"
          label="Apellido"
          rules={[{ required: true, message: 'Por favor, ingresa el apellido.' }]}
        >
          <Input placeholder="Apellido del participante" />
        </Form.Item>
  
        <Form.Item
          name="dni"
          label="DNI"
          rules={[{ required: true, message: 'Por favor, ingresa el DNI.' }]}
        >
          <Input placeholder="Número de DNI" />
        </Form.Item>
  
        <Form.Item
          name="entryNumber"
          label="Número de Entrada"
          rules={[{ required: true, message: 'Por favor, ingresa el Nro. de Entrada.' }]}
        >
          <Input placeholder="Código o número de la entrada" />
        </Form.Item>
  
        <Form.Item
          name="phone"
          label="Teléfono (Opcional)"
        >
          <Input placeholder="Número de teléfono" />
        </Form.Item>
  
        <Form.Item
          name="email"
          label="Correo Electrónico (Opcional)"
          rules={[{ type: 'email', message: 'Ingresa un correo válido.' }]} // Validación de formato
        >
          <Input placeholder="ejemplo@dominio.com" />
        </Form.Item>
  
      </Form>
    );
  };