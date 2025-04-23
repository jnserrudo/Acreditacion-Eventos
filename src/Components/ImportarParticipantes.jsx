// src/Components/ImportarParticipantes.js
import React, { useState } from 'react';
import { Upload, Button, Progress, Space } from 'antd'; // Añadimos Progress
import { UploadOutlined } from '@ant-design/icons';
import { toast } from 'react-hot-toast';
import { read, utils } from 'xlsx'; // Importa la librería para leer Excel
import { createParticipante } from '../services/participante.services.js'; // Importa el servicio API

// Mapeo esperado de columnas Excel a claves de datos (AJUSTA SEGÚN TU EXCEL REAL)
// Las claves deben coincidir con lo que espera tu API (modelo Participante en español)
const COLUMN_MAP = {
  'NOMBRE': 'nombre',
  'APELLIDO': 'apellido',
  'DNI': 'dni',
  'NRO ENTRADA': 'numeroEntrada', // Asegúrate que coincida con la cabecera real
  'NÚMERO ENTRADA': 'numeroEntrada', // Alternativa común
  'TELEFONO': 'telefono',
  'TELÉFONO': 'telefono', // Alternativa común
  'CORREO': 'correo',
  'EMAIL': 'correo', // Alternativa común
  'MEDIO PAGO': 'medioPago',
  'RUBRO': 'rubro'
};

// Recibe eventoId y la función onImportComplete del padre (EventoDetalle)
export const ImportarParticipantes = ({ eventoId, onImportComplete }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0); // Estado para la barra de progreso

  // Función que maneja la lógica real cuando se selecciona un archivo
  const handleFile = async (file) => {
    if (!eventoId) {
      toast.error("Error: No se pudo identificar el evento actual.");
      return false; // Detiene el proceso de AntD Upload
    }

    setIsImporting(true);
    setProgress(0); // Resetea progreso
    const toastId = toast.loading(`Leyendo archivo ${file.name}...`);

    let participantsToCreate = []; // Array para guardar los datos parseados
    let fileReadError = null;

    // --- Paso 1: Leer y Parsear el archivo ---
    try {
      const reader = new FileReader();
      // Usamos una Promesa para esperar a que FileReader termine
      await new Promise((resolve, reject) => {
          reader.onload = (e) => {
              try {
                  const data = e.target.result;
                  const workbook = read(data, { type: 'array', cellDates: true }); // cellDates ayuda con fechas si las hubiera
                  const sheetName = workbook.SheetNames[0];
                  const worksheet = workbook.Sheets[sheetName];
                  const jsonDataRaw = utils.sheet_to_json(worksheet, { header: 1, defval: null }); // defval: null para celdas vacías

                  if (!jsonDataRaw || jsonDataRaw.length < 2) {
                      throw new Error("Archivo vacío o sin filas de datos.");
                  }

                  const headers = jsonDataRaw[0].map(h => String(h || '').trim().toUpperCase()); // Normaliza cabeceras
                  const dataRows = jsonDataRaw.slice(1);

                  // Mapea y valida datos básicos
                  participantsToCreate = dataRows.map((row, rowIndex) => {
                      const participanteDataRaw = headers.reduce((obj, header, index) => {
                          const mappedKey = COLUMN_MAP[header];
                          if (mappedKey && row[index] !== undefined && row[index] !== null) {
                              // Convierte a String y limpia (o maneja tipos específicos si es necesario)
                              obj[mappedKey] = String(row[index]).trim();
                          }
                          return obj;
                      }, {});

                      // Añade validación mínima aquí si quieres filtrar ANTES de enviar a API
                      if (!participanteDataRaw.nombre || !participanteDataRaw.apellido || !participanteDataRaw.dni || !participanteDataRaw.numeroEntrada) {
                           console.warn(`Fila ${rowIndex + 2} omitida (local): Faltan datos obligatorios.`, participanteDataRaw);
                           return null; // Marcar para filtrar luego
                      }
                      // Podrías añadir más validaciones (ej. formato DNI básico)

                      return participanteDataRaw; // Guarda el objeto si pasa validación básica
                  }).filter(p => p !== null); // Filtra las filas marcadas como null

                  if (participantsToCreate.length === 0 && dataRows.length > 0) {
                      throw new Error("Ninguna fila del archivo tiene los datos obligatorios completos.");
                  } else if (participantsToCreate.length === 0) {
                       throw new Error("No se encontraron datos de participantes válidos en el archivo.");
                  }

                  resolve(); // Resuelve la promesa de FileReader
              } catch (parseError) {
                  reject(parseError); // Rechaza si hay error al parsear
              }
          }; // Fin reader.onload

          reader.onerror = (error) => reject(new Error("No se pudo leer el archivo."));

          reader.readAsArrayBuffer(file); // Inicia la lectura
      }); // Fin new Promise

    } catch (error) {
      console.error("Error al leer/parsear archivo:", error);
      fileReadError = error.message || "Error procesando el archivo.";
      toast.error(fileReadError, { id: toastId });
      setIsImporting(false);
      return false; // Detiene el proceso
    }

    // Si hubo error leyendo el archivo, no continuamos
    if (fileReadError) return false;

    // --- Paso 2: Enviar datos a la API (uno por uno) ---
    toast.loading(`Importando ${participantsToCreate.length} participantes... (0%)`, { id: toastId });
    let successCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;

    for (let i = 0; i < participantsToCreate.length; i++) {
      const participanteData = participantsToCreate[i];
      try {
        await createParticipante(eventoId, participanteData);
        successCount++;
      } catch (apiError) {
        console.error(`Error API importando fila ${i + 1}:`, apiError.message, participanteData);
        if (apiError.message?.toLowerCase().includes('conflicto') || apiError.message?.toLowerCase().includes('ya exist')) {
          duplicateCount++;
        } else {
          errorCount++;
        }
        // No detenemos la importación por errores individuales
      }

      // Actualizar progreso
      const currentProgress = Math.round(((i + 1) / participantsToCreate.length) * 100);
      setProgress(currentProgress);
      toast.loading(`Importando ${i + 1}/${participantsToCreate.length}... (${currentProgress}%) | Éxito: ${successCount} Dup: ${duplicateCount} Err: ${errorCount}`, { id: toastId });

      // Pequeña pausa opcional para no saturar el navegador/servidor si son MUCHOS registros
      // await new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay
    }

    // --- Paso 3: Finalizar y Notificar ---
    toast.dismiss(toastId); // Cierra el toast de progreso
    setIsImporting(false);
    setProgress(100); // Asegura que la barra llegue al 100%

    // Llama al callback del padre con el resumen final
    onImportComplete(successCount, errorCount, duplicateCount);

    // Muestra un toast resumen final (opcional, ya que onImportComplete lo hace)
    // toast.success(`Importación finalizada: ${successCount} añadidos, ${duplicateCount} omitidos, ${errorCount} errores.`);

    // Importante para AntD Upload:
    return false; // Evita que AntD intente subir el archivo
  };

  // Configuración para AntD Upload
  const uploadProps = {
    accept: ".xlsx, .xls, .csv", // Acepta Excel y CSV (CSV requiere parseo diferente si lo soportas)
    maxCount: 1,
    beforeUpload: handleFile, // Llama a nuestra lógica ANTES de subir
    showUploadList: false,
    disabled: isImporting,
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Upload {...uploadProps}>
        <Button icon={<UploadOutlined />} loading={isImporting} disabled={isImporting}>
          {isImporting ? 'Importando...' : 'Importar Participantes (Excel)'}
        </Button>
      </Upload>
      {/* Muestra la barra de progreso durante la importación */}
      {isImporting && (
          <Progress percent={progress} size="small" status="active" />
      )}
    </Space>
  );
};