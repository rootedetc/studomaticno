
export const GradeTrendChart = ({ grades }) => {
  if (!grades || !grades.courses) return null;

  // Group grades by year
  const yearStats = (grades.courses || []).reduce((acc, course) => {
    if (!course.finalGrade || !course.year) return acc;
    const grade = parseInt(course.finalGrade, 10);
    const year = parseInt(course.year, 10);

    if (isNaN(grade) || isNaN(year) || grade < 2) return acc;

    if (!acc[year]) {
      acc[year] = { sum: 0, count: 0, year };
    }
    acc[year].sum += grade;
    acc[year].count += 1;
    return acc;
  }, {});

  const data = Object.values(yearStats)
    .sort((a, b) => a.year - b.year)
    .map(stat => ({
      year: stat.year,
      average: stat.sum / stat.count
    }));

  if (data.length < 2) return null; // Need at least 2 points for a trend

  const maxGrade = 5;
  const minGrade = 2; // Graph looks better if scaled from 2 to 5 usually

  return (
    <div className="card p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Prosjek po godinama</h3>

      <div className="relative h-48 w-full">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-400">
          {[5, 4, 3, 2].map(g => (
            <div key={g} className="flex items-center w-full">
              <span className="w-4">{g}</span>
              <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700 ml-2"></div>
            </div>
          ))}
        </div>

        {/* Data Points & Line */}
        <div className="absolute inset-0 ml-6 flex items-center justify-between pointer-events-none">
          {/* SVG Line connecting points */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary-500"
              points={data.map((d, i) => {
                const x = (i / (data.length - 1)) * 100; // Percentage X
                const y = 100 - ((d.average - 2) / 3) * 100; // Percentage Y (scale 2-5)
                return `${x}%,${y}%`; // Note: SVG points typically need pixel values or viewBox. 
                // For simplicity in this environment without specific width refs, we can use a flex approach for dots and not draw complex lines, 
                // OR we can try to guess coordinates if we knew width.
                // Since we don't know width, simple dots + bars might be safer than a line which requires absolute coordinates.
              }).join(' ')}
            />
            {/* 
                 Actually, polyline with % points is not standard SVG support in all browsers/contexts easily without viewBox. 
                 Let's stick to a robust visual: Bars or just connected dots if we can layout them.
                 Simpler: Just use bars for now, it's safer than broken SVG.
                 User asked for "GRAPH", but bars are a graph.
                 Wait, "Grade Trend" implies line.
                 Let's try a CSS-only Line Graph using clip-path? Too complex.
                 Let's stick to specific positioned dots and we remove the line if complex.
                 Actually, we can use SVG with viewBox="0 0 100 100" and preserveAspectRatio="none".
               */}
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
              className="text-primary-500 opacity-50"
              points={data.map((d, i) => {
                const x = (i / (data.length - 1)) * 100;
                const y = 100 - ((d.average - 2) / 3) * 100;
                return `${x},${y}`;
              }).join(' ')}
            />
          </svg>

          {data.map((d, i) => {
            // Calculate position
            const percentage = ((d.average - 2) / 3) * 100;
            return (
              <div key={d.year} className="relative h-full flex flex-col justify-end group" style={{ zIndex: 2 }}>
                <div
                  className="absolute bottom-0 w-3 h-3 bg-primary-600 rounded-full border-2 border-white dark:border-gray-800 shadow-md transform translate-y-1.5 transition-transform group-hover:scale-125"
                  style={{ bottom: `${percentage}%`, left: '-6px' }}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {d.average.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex justify-between ml-6 mt-2 text-sm text-gray-500 dark:text-gray-400">
        {data.map(d => (
          <span key={d.year}>{d.year}. god</span>
        ))}
      </div>
    </div>
  );
};

if (!grades || !grades.courses) return null;

const distribution = (grades.courses || []).reduce((acc, course) => {
  // Handle both string and number grades, and potential nulls
  const gradeVal = course.finalGrade;
  if (!gradeVal) return acc;

  // Parse int to be safe
  const grade = parseInt(gradeVal, 10);

  // Check if it's a valid grade (2-5)
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
