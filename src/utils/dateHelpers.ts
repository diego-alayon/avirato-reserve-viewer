// Safe date helper that prevents crashes from invalid dates
export const safeDateFormat = (dateInput: any, locale: string = 'es-ES'): string => {
  // Handle null, undefined, empty string
  if (!dateInput) return 'Fecha no disponible';
  
  try {
    const date = new Date(dateInput);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    return date.toLocaleDateString(locale, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('Date formatting error:', error);
    return 'Fecha no disponible';
  }
};

// Safe date format for simple date display (no weekday)
export const safeDateFormatSimple = (dateInput: any, locale: string = 'es-ES'): string => {
  if (!dateInput) return 'No disponible';
  
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return 'No disponible';
  }
};

// Validate date range
export const isValidDateRange = (startDate: any, endDate: any): boolean => {
  if (!startDate || !endDate) return false;
  
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
    return start <= end;
  } catch {
    return false;
  }
};