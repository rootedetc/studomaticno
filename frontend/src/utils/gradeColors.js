export function getGradeColor(grade) {
  const numGrade = parseFloat(grade);
  if (numGrade >= 4.5) {
    return {
      bg: 'bg-green-50 dark:bg-green-900/30',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800'
    };
  } else if (numGrade >= 3.5) {
    return {
      bg: 'bg-yellow-50 dark:bg-yellow-900/30',
      text: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-yellow-200 dark:border-yellow-800'
    };
  } else {
    return {
      bg: 'bg-gray-50 dark:bg-gray-700',
      text: 'text-gray-600 dark:text-gray-400',
      border: 'border-gray-200 dark:border-gray-600'
    };
  }
}

export function getGradeClass(grade, variant = 'combined') {
  const numGrade = parseFloat(grade);
  
  if (numGrade >= 4.5) {
    if (variant === 'combined') return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30';
    if (variant === 'text') return 'text-green-600 dark:text-green-400';
    if (variant === 'bg') return 'bg-green-50 dark:bg-green-900/30';
    return 'border-green-200 dark:border-green-800';
  } else if (numGrade >= 3.5) {
    if (variant === 'combined') return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30';
    if (variant === 'text') return 'text-yellow-600 dark:text-yellow-400';
    if (variant === 'bg') return 'bg-yellow-50 dark:bg-yellow-900/30';
    return 'border-yellow-200 dark:border-yellow-800';
  } else {
    if (variant === 'combined') return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700';
    if (variant === 'text') return 'text-gray-600 dark:text-gray-400';
    if (variant === 'bg') return 'bg-gray-50 dark:bg-gray-700';
    return 'border-gray-200 dark:border-gray-600';
  }
}
