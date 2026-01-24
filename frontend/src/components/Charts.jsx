export const GradeDistributionChart = ({ grades }) => {
  if (!grades || !grades.courses) return null;

  const distribution = grades.courses.reduce((acc, course) => {
    const grade = parseInt(course.finalGrade);
    if (!isNaN(grade) && grade >= 2 && grade <= 5) {
      acc[grade] = (acc[grade] || 0) + 1;
    }
    return acc;
  }, {});

  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  const max = Math.max(...Object.values(distribution));

  return (
    <div className="card p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Distribucija ocjena</h3>
      <div className="flex items-end justify-between h-40 gap-2">
        {[2, 3, 4, 5].map((grade) => {
          const count = distribution[grade] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          const height = max > 0 ? (count / max) * 100 : 0;
          
          let colorClass = 'bg-gray-200 dark:bg-gray-700';
          if (grade === 5) colorClass = 'bg-green-500';
          if (grade === 4) colorClass = 'bg-blue-500';
          if (grade === 3) colorClass = 'bg-yellow-500';
          if (grade === 2) colorClass = 'bg-orange-500';

          return (
            <div key={grade} className="flex-1 flex flex-col items-center gap-2 group">
              <div className="relative w-full flex justify-center items-end h-full">
                <div 
                  className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 ${colorClass} opacity-80 group-hover:opacity-100`}
                  style={{ height: `${Math.max(height, 5)}%` }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded">
                    {count} ({Math.round(percentage)}%)
                  </div>
                </div>
              </div>
              <span className="font-bold text-gray-700 dark:text-gray-300 text-lg">{grade}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
