// src/components/participant/ImportarParticipantes.js
import React, { useState } from 'react';
import { Upload, Button, message as antdMessage } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast'; // Importa toast

// Recibe la función onImportSuccess del padre (EventoDetalle)
export const ImportarParticipantes = ({ onImportSuccess }) => {
  const [isImporting, setIsImporting] = useState(false);

  // Simula el proceso de importación
  const handleSimulatedImport = async (options) => {
    const { file } = options; // Obtenemos el archivo solo para mostrar su nombre
    setIsImporting(true);
    toast(`Importación de ${file.name}...`);

    // Simula delay de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Llama al callback del padre indicando éxito y pasando datos simulados
    onImportSuccess([
      {
          id: `sim-${Date.now()}-1`,
          name: 'Importado Sim', lastName: 'Uno', dni: `sim${Math.floor(Math.random()*9000+1000)}`,
          entryNumber: `IMP${Math.floor(Math.random()*9000+1000)}`, // <-- NUEVO
          phone: '1100110011', // <-- NUEVO (opcional)
          email: 'import1@sim.com', // <-- NUEVO (opcional)
          accredited: 0 // <-- CAMBIO a 0
      },
      {
          id: `sim-${Date.now()}-2`,
          name: 'Importado Sim', lastName: 'Dos', dni: `sim${Math.floor(Math.random()*9000+1000)}`,
          entryNumber: `IMP${Math.floor(Math.random()*9000+1000)}`, // <-- NUEVO
          phone: null, // <-- NUEVO (opcional)
          email: 'import2@sim.com', // <-- NUEVO (opcional)
          accredited: 0 // <-- CAMBIO a 0
      },
  ]);
    toast.success( `Importación de ${file.name} con éxito!`);
    setIsImporting(false);
  };

  const uploadProps = {
    accept: ".xlsx, .csv",
    maxCount: 1,
    // Usamos customRequest para interceptar y simular
    customRequest: handleSimulatedImport,
    showUploadList: false, // No mostramos la lista de archivos de AntD aquí
    beforeUpload: (file) => {
      const isXlsx = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const isCsv = file.type === 'text/csv';
      if (!isXlsx && !isCsv) {
        toast.error(`${file.name} no es un archivo válido .`);
        return Upload.LIST_IGNORE; // Evita que customRequest se ejecute si no es válido
      }
       // Retorna false para que Upload no intente subirlo por sí mismo,
       // ya que customRequest se encargará.
      return true; // Permitir que customRequest se ejecute
    },
  };

  return (
    <Upload {...uploadProps}>
      <Button icon={<UploadOutlined />} loading={isImporting} disabled={isImporting}>
        {isImporting ? 'Importando...' : 'Importar Participantes '}
      </Button>
    </Upload>
  );
};