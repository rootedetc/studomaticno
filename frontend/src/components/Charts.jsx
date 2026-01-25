
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

  return (
    <div className="card p-4 h-full">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Prosjek po godinama</h3>

      <div className="relative h-32 w-full">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400" style={{ width: '24px' }}>
          {[5, 4, 3, 2].map(g => (
            <div key={g} className="flex items-center h-0">
              <span>{g}</span>
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="absolute inset-0" style={{ left: '32px' }}>
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[5, 4, 3, 2].map(g => (
              <div key={g} className="h-px bg-gray-200 dark:bg-gray-700" />
            ))}
          </div>

          {/* SVG for line */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full overflow-visible"
          >
            {/* Line connecting points */}
            <polyline
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              points={data.map((d, i) => {
                const x = data.length === 1 ? 50 : (i / (data.length - 1)) * 100;
                const y = 100 - ((d.average - 2) / 3) * 100;
                return `${x},${y}`;
              }).join(' ')}
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>

          {/* Data points */}
          <div className="absolute inset-0 flex justify-between items-stretch">
            {data.map((d, i) => {
              const bottomPercent = ((d.average - 2) / 3) * 100;
              return (
                <div key={d.year} className="relative flex-1 flex justify-center group">
                  <div
                    className="absolute w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-3 border-white dark:border-gray-800 shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-transform group-hover:scale-150 cursor-pointer"
                    style={{
                      bottom: `${bottomPercent}%`,
                      left: '50%',
                      transform: 'translate(-50%, 50%)'
                    }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none">
                      {d.average.toFixed(2)}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400" style={{ marginLeft: '32px' }}>
        {data.map(d => (
          <div key={d.year} className="flex-1 text-center">
            <span className="font-medium">{d.year}. god</span>
          </div>
        ))}
      </div>
    </div>
  );
};


export const PassedCoursesChart = ({ grades }) => {
  if (!grades?.summary) return null;

  const passed = grades.summary.passed || 0;
  const total = grades.summary.total || 0;
  const failed = total - passed;
  const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;

  // Calculate stroke-dasharray for the pie chart
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const passedLength = total > 0 ? (passed / total) * circumference : 0;

  return (
    <div className="card p-4 h-full">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Položeno kolegija</h3>

      <div className="flex flex-row items-center justify-center py-2 gap-6">
        {/* Pie Chart */}
        <div className="relative w-32 h-32 group cursor-pointer flex-shrink-0">
          <svg viewBox="0 0 180 180" className="transform -rotate-90 w-full h-full">
            {/* Background circle (remaining/failed) */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="20"
              className="text-red-100 dark:text-red-900/40 transition-all duration-300 group-hover:opacity-80"
            />

            {/* Passed segment (green) */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="url(#passedGradient)"
              strokeWidth="20"
              strokeDasharray={`${passedLength} ${circumference}`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{ filter: 'drop-shadow(0 4px 6px rgba(34, 197, 94, 0.3))' }}
            />

            {/* Gradient definitions */}
            <defs>
              <linearGradient id="passedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{percentage}%</span>
          </div>

        </div>

        {/* Legend */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></span>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900 dark:text-white">{passed}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">položeno</span>
            </div>
          </div>
          <div className="hidden"></div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-200 dark:bg-red-900 shadow-sm"></span>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900 dark:text-white">{failed}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">preostalo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
