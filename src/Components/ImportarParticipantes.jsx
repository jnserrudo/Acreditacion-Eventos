// src/Components/ImportarParticipantes.js
import React, { useState } from "react";
import { Upload, Button, Progress, Space } from "antd"; // Añadimos Progress
import { UploadOutlined } from "@ant-design/icons";
import { toast } from "react-hot-toast";
import { read, utils } from "xlsx"; // Importa la librería para leer Excel
import { createParticipante } from "../services/participante.services.js"; // Importa el servicio API

// Mapeo esperado de columnas Excel a claves de datos (AJUSTA SEGÚN TU EXCEL REAL)
// Las claves deben coincidir con lo que espera tu API (modelo Participante en español)
// --- MAPEO DE COLUMNAS EXCEL (¡¡AJUSTA ESTOS NOMBRES!!) ---
const COLUMN_MAP = {
  // Nombres probables de tus cabeceras Excel en MAYÚSCULAS -> nombre del campo en Prisma/JS
  NOMBRE: "nombre",
  APELLIDO: "apellido",
  DNI: "dni",
  "NRO ENTRADA": "numeroEntrada",
  "NÚMERO ENTRADA": "numeroEntrada",
  TELEFONO: "telefono",
  TELÉFONO: "telefono",
  CELULAR: "telefono", // Añadir alternativas si es necesario
  CORREO: "correo",
  EMAIL: "correo",
  MAIL: "correo",
  "MEDIO PAGO": "medioPago",
  MEDIO_PAGO: "medioPago",
  RUBRO: "rubro",
  "PRECIO ENTRADA": "precioEntrada", // <- NUEVO
  PRECIO_ENTRADA: "precioEntrada", // <- NUEVO (Alternativa)
  PRECIO: "precioEntrada", // <- NUEVO (Alternativa)
  "MONTO PAGADO": "montoPagado", // <- NUEVO
  MONTO_PAGADO: "montoPagado", // <- NUEVO (Alternativa)
  MONTO: "montoPagado", // <- NUEVO (Alternativa)
  PAGO: "montoPagado", // <- NUEVO (Alternativa)
};
// -------------------------------------------------------

// --- CAMPOS OBLIGATORIOS (Deben coincidir con el backend/schema) ---
const CAMPOS_OBLIGATORIOS = ['nombre', 'apellido', 'dni', 'numeroEntrada', 'telefono', 'medioPago', 'rubro', 'montoPagado'];
// -------------------------------------------------------------------



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

    let dataRowsCount = 0; // Para contar filas totales leídas

    // --- Paso 1: Leer y Parsear el archivo ---
    try {
      const reader = new FileReader();
      // Usamos una Promesa para esperar a que FileReader termine
      await new Promise((resolve, reject) => {
        reader.onload = (e) => {
          try {
            const data = e.target.result;
            const workbook = read(data, { type: "array", cellDates: true }); // cellDates ayuda con fechas si las hubiera
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonDataRaw = utils.sheet_to_json(worksheet, {
              header: 1,
              defval: null,
            }); // defval: null para celdas vacías

            if (!jsonDataRaw || jsonDataRaw.length < 2) {
              throw new Error("Archivo vacío o sin filas de datos.");
            }

            const headers = jsonDataRaw[0].map((h) =>
              String(h || "")
                .trim()
                .toUpperCase()
            ); // Normaliza cabeceras
            const dataRows = jsonDataRaw.slice(1);


            dataRowsCount = dataRows.length; // Guarda el número total de filas de datos

            // Mapea y valida datos básicos
            participantsToCreate = dataRows
              .map((row, rowIndex) => {
                const participanteDataRaw = headers.reduce(
                  (obj, header, index) => {
                    const mappedKey = COLUMN_MAP[header];

                    const cellValue = row[index]; // Valor crudo de la celda

                    if (mappedKey && cellValue !== undefined && cellValue !== null && String(cellValue).trim() !== '') {
                      const trimmedValue = String(cellValue).trim();

                      // --- Parseo específico para montos ---
                      if (mappedKey === 'montoPagado' || mappedKey === 'precioEntrada') {
                           // Limpia caracteres no numéricos (excepto punto/coma), reemplaza coma por punto
                          const montoStr = trimmedValue.replace(/[^0-9.,-]/g, '').replace(',', '.');
                          const montoNum = parseFloat(montoStr);

                          if (!isNaN(montoNum) && montoNum >= 0) {
                              obj[mappedKey] = montoNum; // Guarda como número válido
                          } else {
                              console.warn(`Fila ${rowIndex + 2}: Valor inválido para ${mappedKey} ('${cellValue}'), se usará ${mappedKey === 'montoPagado' ? 0 : null}.`);
                              // Asigna default seguro si el valor es inválido
                              obj[mappedKey] = (mappedKey === 'montoPagado' ? 0 : null);
                          }
                      } else {
                          // Guarda otros campos como string
                          obj[mappedKey] = trimmedValue;
                      }
                  } else if (mappedKey === 'montoPagado') {
                       // Si la celda de montoPagado está vacía, asigna 0
                       obj[mappedKey] = 0;
                  } else if (mappedKey === 'precioEntrada') {
                       // Si la celda de precioEntrada está vacía, asigna null
                       obj[mappedKey] = null;
                  }

                  return obj;
              }, {});

                // --- Validación de campos obligatorios (después del mapeo) ---
                const camposFaltantes = CAMPOS_OBLIGATORIOS.filter(campo =>
                  participanteDataRaw[campo] === undefined ||
                  participanteDataRaw[campo] === null ||
                  // Considera precioEntrada null como válido si es opcional en schema
                  (campo !== 'precioEntrada' && participanteDataRaw[campo] === '')
                  // Añade aquí más validaciones específicas si necesitas (ej. formato DNI)
              );

              if (camposFaltantes.length > 0) {
                   console.warn(`Fila ${rowIndex + 2} omitida: Faltan/Inválidos: ${camposFaltantes.join(', ')}.`, participanteDataRaw);
                   return null; // Marcar para filtrar
              }

              // Asegura que montoPagado sea 0 si quedó null por alguna razón
              if (participanteDataRaw.montoPagado === null) participanteDataRaw.montoPagado = 0;

              return participanteDataRaw;

          }).filter(p => p !== null); // Filtra filas inválidas

          if (participantsToCreate.length === 0 && dataRows.length > 0) {
              throw new Error("Ninguna fila del archivo tiene los datos válidos requeridos.");
          } else if (participantsToCreate.length === 0) {
               throw new Error("No se encontraron datos válidos.");
          }
            resolve(); // Resuelve la promesa de FileReader
          } catch (parseError) {
            reject(parseError); // Rechaza si hay error al parsear
          }
        }; // Fin reader.onload

        reader.onerror = (error) =>
          reject(new Error("No se pudo leer el archivo."));

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
    toast.loading(
      `Importando ${participantsToCreate.length} participantes... (0%)`,
      { id: toastId }
    );
    let successCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;

    for (let i = 0; i < participantsToCreate.length; i++) {
      const participanteData = participantsToCreate[i];
      try {
        await createParticipante(eventoId, participanteData);
        successCount++;
      } catch (apiError) {
        console.error(
          `Error API importando fila ${i + 1}:`,
          apiError.message,
          participanteData
        );
        if (
          apiError.message?.toLowerCase().includes("conflicto") ||
          apiError.message?.toLowerCase().includes("ya exist")
        ) {
          duplicateCount++;
        } else {
          errorCount++;
        }
        // No detenemos la importación por errores individuales
      }

      // Actualizar progreso
      const currentProgress = Math.round(
        ((i + 1) / participantsToCreate.length) * 100
      );
      setProgress(currentProgress);
      toast.loading(
        `Importando ${i + 1}/${
          participantsToCreate.length
        }... (${currentProgress}%) | Éxito: ${successCount} Dup: ${duplicateCount} Err: ${errorCount}`,
        { id: toastId }
      );

      // Pequeña pausa opcional para no saturar el navegador/servidor si son MUCHOS registros
      // await new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay
    }

    // --- Paso 3: Finalizar y Notificar ---
    toast.dismiss(toastId); // Cierra el toast de progreso
    setIsImporting(false);
    setProgress(100); // Asegura que la barra llegue al 100%

     // Llama al callback con el resumen (considera filas totales vs. procesadas)
     const totalFilasIntentadas = dataRowsCount; // Usar el total leído
     const filasOmitidasLocalmente = totalFilasIntentadas - participantsToCreate.length;
     console.log(`Filas omitidas localmente (datos faltantes/inválidos): ${filasOmitidasLocalmente}`);
     // Ajusta el conteo de errores para incluir las filas omitidas localmente
     onImportComplete(successCount, errorCount + filasOmitidasLocalmente, duplicateCount);

     toast.success(`Importación finalizada: ${successCount} añadidos, ${duplicateCount} omitidos, ${errorCount} errores.`);
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
    <Space direction="vertical" style={{ width: "100%" }}>
      <Upload {...uploadProps}>
        <Button
          icon={<UploadOutlined />}
          loading={isImporting}
          disabled={isImporting}
        >
          {isImporting ? "Importando..." : "Importar Participantes (Excel)"}
        </Button>
      </Upload>
      {/* Muestra la barra de progreso durante la importación */}
      {isImporting && (
        <Progress percent={progress} size="small" status="active" />
      )}
    </Space>
  );
};
