// src/mockData.js
// Datos iniciales que vivirán en la memoria del navegador mientras la app esté abierta.
// Se perderán al recargar.
export let initialEvents = [
  { id: 'evt-001', name: 'Conferencia Anual React Avanzado', date: '2025-10-20', location: 'Centro de Convenciones Norte', description: 'Evento principal sobre novedades en React.' },
  { id: 'evt-002', name: 'Workshop Fullstack con Node.js', date: '2025-11-15', location: 'Sala Coworking TechHub', description: null }, // Ejemplo opcional vacío
  { id: 'evt-003', name: 'Lanzamiento Plataforma JNSIX v2.0', date: '2025-12-01', location: 'Oficinas Centrales JNSIX', description: 'Presentación interna.' },
];
export let initialParticipants = {
  'evt-001': [
    { id: 'par-101', eventId: 'evt-001', name: 'Ana', lastName: 'García Pérez', dni: '11222333', entryNumber: 'TKT001', phone: '1122334455', email: 'ana.garcia@email.com', accredited: 0 },
    { id: 'par-102', eventId: 'evt-001', name: 'Luis Alberto', lastName: 'Martínez', dni: '44555666', entryNumber: 'TKT002', phone: null, email: 'luis.m@email.com', accredited: 1 }, // Ya estaba acreditado
    { id: 'par-103', eventId: 'evt-001', name: 'Carla', lastName: 'Rodríguez', dni: '77888999', entryNumber: 'TKT003', phone: '5566778899', email: null, accredited: 0 },
  ],
  'evt-002': [
    { id: 'par-201', eventId: 'evt-002', name: 'Jorge', lastName: 'López', dni: '12345678', entryNumber: 'WS001', phone: '9988776655', email: 'jorge.lopez@email.com', accredited: 0 },
    { id: 'par-202', eventId: 'evt-002', name: 'María Elena', lastName: 'Fernández', dni: '87654321', entryNumber: 'WS002', phone: null, email: 'maria.f@email.com', accredited: 0 },
  ],
  'evt-003': [],//evento sin personas por ahora
};

  // Funciones para simular cambios (pueden estar aquí o en los componentes)
  // Por simplicidad, las dejaremos en los componentes para esta versión autocontenida.