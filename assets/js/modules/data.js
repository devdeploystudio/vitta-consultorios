// datos de arranque de la demo. se generan relativos a "hoy" para que el
// panel siempre muestre turnos de hoy/semana sin importar cuando se abra el sitio.

import { uid, addDays } from './utils.js';

export const ROLES = ['admin', 'profesional', 'recepcion', 'paciente'];

export const ROLE_LABELS = {
  admin: 'Administrador',
  profesional: 'Profesional',
  recepcion: 'Recepción',
  paciente: 'Paciente',
};

export const ESTADOS_TURNO = ['pendiente', 'confirmado', 'atendido', 'cancelado'];

export const HORARIOS = ['09:00', '09:40', '10:20', '11:00', '11:40', '14:00', '14:40', '15:20', '16:00', '16:40'];

export function buildSeed(){
  const profesionales = [
    { id: 'p1', nombre: 'Dra. Valentina Ríos', especialidad: 'Clínica médica' },
    { id: 'p2', nombre: 'Dr. Ezequiel Paz', especialidad: 'Odontología' },
  ];

  const pacientes = [
    { id: 'pac1', nombre: 'Carla Domínguez', dni: '34.221.887', telefono: '11 3344-5566', email: 'carla.dom@mail.demo', obraSocial: 'OSDE', nacimiento: '1991-04-12', historial: [] },
    { id: 'pac2', nombre: 'Jorge Beltrán', dni: '28.556.019', telefono: '11 4021-9988', email: 'jbeltran@mail.demo', obraSocial: 'Swiss Medical', nacimiento: '1978-11-02', historial: [] },
    { id: 'pac3', nombre: 'Sofía Nakamura', dni: '39.887.221', telefono: '11 6655-3321', email: 'sofia.nk@mail.demo', obraSocial: 'Particular', nacimiento: '1999-02-27', historial: [] },
    { id: 'pac4', nombre: 'Rubén Acosta', dni: '25.114.478', telefono: '11 5588-2210', email: 'racosta@mail.demo', obraSocial: 'IOMA', nacimiento: '1965-07-19', historial: [] },
    { id: 'pac5', nombre: 'Milagros Vega', dni: '41.002.665', telefono: '11 2277-4409', email: 'milyvega@mail.demo', obraSocial: 'OSDE', nacimiento: '2001-09-05', historial: [] },
    { id: 'pac6', nombre: 'Tomás Ibáñez', dni: '33.667.910', telefono: '11 4499-1123', email: 'tibanez@mail.demo', obraSocial: 'Particular', nacimiento: '1988-01-30', historial: [] },
    { id: 'pac7', nombre: 'Agustina Roldán', dni: '37.221.556', telefono: '11 3300-7789', email: 'aroldan@mail.demo', obraSocial: 'Galeno', nacimiento: '1995-06-14', historial: [] },
    { id: 'pac8', nombre: 'Diego Farías', dni: '30.884.221', telefono: '11 6677-8890', email: 'dfarias@mail.demo', obraSocial: 'Swiss Medical', nacimiento: '1982-12-08', historial: [
      { fecha: addDays(new Date().toISOString().slice(0, 10), -40), nota: 'Control general, sin novedades.', profesional: 'Dra. Valentina Ríos' },
    ] },
  ];

  const users = [
    { id: 'u1', username: 'admin', password: 'admin123', nombre: 'Lucía Ferreyra', role: 'admin', email: 'admin@vitta.demo', activo: true },
    { id: 'u2', username: 'recepcion', password: 'recepcion123', nombre: 'Martín Sosa', role: 'recepcion', email: 'recepcion@vitta.demo', activo: true },
    { id: 'u3', username: 'doctor', password: 'doctor123', nombre: 'Dra. Valentina Ríos', role: 'profesional', profesionalId: 'p1', email: 'vrios@vitta.demo', activo: true },
    { id: 'u4', username: 'doctor2', password: 'doctor123', nombre: 'Dr. Ezequiel Paz', role: 'profesional', profesionalId: 'p2', email: 'epaz@vitta.demo', activo: true },
    { id: 'u5', username: 'paciente', password: 'paciente123', nombre: 'Carla Domínguez', role: 'paciente', pacienteId: 'pac1', email: 'carla.dom@mail.demo', activo: true },
  ];

  const hoy = new Date().toISOString().slice(0, 10);
  const motivosClinica = ['Control general', 'Consulta por dolor', 'Chequeo anual', 'Renovación de receta', 'Estudios de rutina'];
  const motivosOdonto = ['Limpieza dental', 'Control de caries', 'Extracción', 'Ortodoncia, ajuste', 'Urgencia, dolor de muela'];

  const turnos = [];

  function agregarTurno(offset, profesionalId, pacienteId, hora, estadoForzado){
    const fecha = addDays(hoy, offset);
    const motivos = profesionalId === 'p1' ? motivosClinica : motivosOdonto;
    const motivo = motivos[Math.floor(Math.random() * motivos.length)];
    let estado = estadoForzado;
    if(!estado){
      if(offset < 0) estado = Math.random() > 0.15 ? 'atendido' : 'cancelado';
      else if(offset === 0) estado = Math.random() > 0.5 ? 'confirmado' : 'pendiente';
      else estado = Math.random() > 0.4 ? 'confirmado' : 'pendiente';
    }
    turnos.push({
      id: uid('t'),
      pacienteId,
      profesionalId,
      fecha,
      hora,
      motivo,
      estado,
      creadoEn: new Date().toISOString(),
      notificado: true,
    });
  }

  // semana pasada, ya resueltos
  agregarTurno(-6, 'p1', 'pac2', '09:00');
  agregarTurno(-5, 'p2', 'pac4', '10:20');
  agregarTurno(-4, 'p1', 'pac6', '11:00');
  agregarTurno(-3, 'p2', 'pac7', '14:40');
  agregarTurno(-2, 'p1', 'pac3', '15:20');
  agregarTurno(-2, 'p2', 'pac8', '09:40');
  agregarTurno(-1, 'p1', 'pac5', '16:00');

  // hoy, mezcla de estados
  agregarTurno(0, 'p1', 'pac1', '09:00', 'confirmado');
  agregarTurno(0, 'p1', 'pac2', '11:00', 'pendiente');
  agregarTurno(0, 'p2', 'pac3', '10:20', 'confirmado');
  agregarTurno(0, 'p2', 'pac4', '14:00');

  // proximos dias
  agregarTurno(1, 'p1', 'pac5', '09:40');
  agregarTurno(1, 'p2', 'pac6', '11:40');
  agregarTurno(2, 'p1', 'pac1', '14:40');
  agregarTurno(2, 'p2', 'pac7', '16:40');
  agregarTurno(3, 'p1', 'pac8', '10:20');
  agregarTurno(4, 'p2', 'pac2', '09:00');
  agregarTurno(5, 'p1', 'pac3', '15:20');

  return { profesionales, pacientes, users, turnos };
}
