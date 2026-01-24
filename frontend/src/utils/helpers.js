
export const parseTime = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const getNextLesson = (lessons) => {
  if (!lessons || lessons.length === 0) return null;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const sortedLessons = [...lessons].sort((a, b) => {
    const timeA = parseTime(a.time.split(' - ')[0]);
    const timeB = parseTime(b.time.split(' - ')[0]);
    return timeA - timeB;
  });

  const nextLesson = sortedLessons.find(lesson => {
    const [startStr, endStr] = lesson.time.split(' - ');
    const endMinutes = parseTime(endStr);
    
    return endMinutes > currentMinutes;
  });

  return nextLesson || null;
};

export const getFriendlyErrorMessage = (error) => {
  const message = typeof error === 'string' ? error : error?.message || 'Unknown error';
  
  if (message.includes('Network Error') || message.includes('Failed to fetch')) {
    return 'Nema internetske veze. Provjerite svoju vezu i pokušajte ponovno.';
  }
  
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'Zahtjev je trajao predugo. Server je možda preopterećen.';
  }
  
  if (message.includes('401') || message.includes('Unauthorized') || message.includes('Session expired')) {
    return 'Vaša sesija je istekla. Molimo prijavite se ponovno.';
  }
  
  if (message.includes('500') || message.includes('Internal Server Error')) {
    return 'Greška na serveru. Molimo pokušajte kasnije.';
  }
  
  if (message.includes('404')) {
    return 'Traženi podaci nisu pronađeni.';
  }

  return message;
};
