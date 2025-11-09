// Debug directo del API de Avirato
console.log('=== DEBUG API AVIRATO ===');

// Simular la llamada del API con parámetros reales
const testParams = {
  web_code: '193549', // El web_code que aparece en tus logs
  start_date: '2024-10-01', // Fecha de ejemplo
  end_date: '2024-10-31', // Fecha de ejemplo
  charges: 'false',
  take: '100'
};

console.log('Parámetros que se envían:', testParams);

// URL que se está construyendo
const url = `https://apiv3.avirato.com/v3/reservation/dates?${new URLSearchParams(testParams)}`;
console.log('URL completa:', url);

console.log('\n=== PROBLEMA IDENTIFICADO ===');
console.log('El problema es que el API por defecto puede estar filtrando por un date_type específico');
console.log('Necesitamos probar diferentes date_type values para capturar TODAS las reservas');

console.log('\n=== POSIBLES SOLUCIONES ===');
console.log('1. NO especificar date_type (usar DEFAULT)');
console.log('2. Hacer múltiples llamadas con diferentes date_type');
console.log('3. Revisar qué date_type incluye tanto check-in como check-out');

// Test de fechas
const startDate = new Date('2024-10-01');
const endDate = new Date('2024-10-31');
console.log('\n=== TEST RANGO DE FECHAS ===');
console.log('Start:', startDate.toISOString().split('T')[0]);
console.log('End:', endDate.toISOString().split('T')[0]);

// Ejemplo de reserva para testing
const exampleReservation = {
  reservation_id: 123,
  check_in_date: '2024-10-15 14:00:00',
  check_out_date: '2024-10-18 12:00:00'
};

console.log('\n=== TEST FILTERING LOGIC ===');
const checkInDate = new Date(exampleReservation.check_in_date.split(' ')[0]);
const checkOutDate = new Date(exampleReservation.check_out_date.split(' ')[0]);

console.log('Reserva ejemplo:');
console.log('- ID:', exampleReservation.reservation_id);
console.log('- Check-in:', checkInDate.toISOString().split('T')[0]);
console.log('- Check-out:', checkOutDate.toISOString().split('T')[0]);

console.log('\nEsta reserva DEBERÍA aparecer si:');
console.log('- Sin filtros: SÍ (está en el rango)');
console.log('- Con filtro check-in: SÍ (15 oct está entre 1-31 oct)');
console.log('- Con filtro check-out: SÍ (18 oct está entre 1-31 oct)');