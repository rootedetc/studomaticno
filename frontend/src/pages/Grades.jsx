import { useState, useEffect } from 'react';
import api from '../services/api';
import { getFriendlyErrorMessage } from '../utils/helpers';
import { Skeleton, SkeletonList } from '../components/Skeleton';
import PageHeader from '../components/PageHeader';
import { PassedCoursesChart, GradeTrendChart } from '../components/Charts';
import TableCard from '../components/TableCard';
import EmptyState from '../components/EmptyState';

function Grades() {
  const [grades, setGrades] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState('Sve');

  const years = grades?.courses
    ? [...new Set(grades.courses.map(c => c.year))].sort((a, b) => a - b)
    : [];

  const filteredCourses = grades?.courses?.filter(course =>
    selectedYear === 'Sve' || course.year.toString() === selectedYear.toString()
  ) || [];

  useEffect(() => {
    loadGrades();
  }, []);

  const loadGrades = async () => {
    try {
      const data = await api.getGrades();
      setGrades(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    const gradeNum = parseInt(grade);
    if (gradeNum > 1) return 'grade-high';
    return 'grade-low';
  };

  const gradeColumns = [
    { key: 'rbr', label: '#', priority: 'low' },
    { key: 'year', label: 'Godina', priority: 'medium' },
    { key: 'course', label: 'Kolegij', priority: 'high' },
    {
      key: 'finalGrade',
      label: 'Ocjena',
      priority: 'high',
      format: (value) => value ? (
        <span className={`grade-badge ${getGradeColor(value)}`}>{value}</span>
      ) : (
        <span className="text-gray-500 dark:text-gray-400">-</span>
      )
    },
    { key: 'ects', label: 'ECTS', priority: 'medium' },
    { key: 'examAttempts', label: 'Pokušaji', priority: 'low' },

    { key: 'professor', label: 'Profesor', priority: 'medium' },
  ];

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <Skeleton variant="text" height="h-8" width="w-32" className="mb-2" />
          <Skeleton variant="text" width="w-24" />
        </div>
        <SkeletonList items={5} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Indeks"
        subtitle={grades?.studyProgram || grades?.viewMode}
      />

      {error && (
        <div className="px-4 md:px-6 mt-4">
          <div className="error-banner">
            {getFriendlyErrorMessage(error)}
          </div>
        </div>
      )}

      <div className="page-content">
        <div className="max-w-5xl mx-auto fade-in">
          {grades?.summary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 mb-6">
              <div className="stat-card hidden md:block">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{grades.summary.total}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ukupno</p>
              </div>

              <div className="stat-card">
                <p className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">{grades.summary.ectsTotal}</p>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">ECTS</p>
              </div>
              <div className="stat-card">
                <p className="text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-400">{grades.summary.averageGrade}</p>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Prosjek</p>
              </div>
              <div className="stat-card">
                <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">{grades.summary.passed}</p>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Položeno</p>
              </div>
              <div className="stat-card">
                <p className="text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400">{grades.summary.total - grades.summary.passed}</p>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Preostalo</p>
              </div>
            </div>
          )}

          <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <PassedCoursesChart grades={grades} />
            <GradeTrendChart grades={grades} />
          </div>

          {/* Year Filter */}
          {years.length > 0 && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedYear('Sve')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${selectedYear === 'Sve'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
              >
                Sve godine
              </button>
              {years.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${selectedYear === year
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                    }`}
                >
                  {year}. godina
                </button>
              ))}
            </div>
          )}

          {filteredCourses.length === 0 ? (
            <EmptyState
              icon="emptyGrades"
              title={grades?.courses?.length === 0 ? "Nema podataka o ocjenama" : "Nema ocjena za odabranu godinu"}
            />
          ) : (
            <>
              <div className="hidden md:block">
                <div className="table-container">
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr className="table-header">
                          <th className="table-header-cell">#</th>
                          <th className="table-header-cell">Godina</th>
                          <th className="table-header-cell">Kolegij</th>
                          <th className="table-header-cell text-center">OCJENA</th>
                          <th className="table-header-cell text-center">ECTS</th>
                          <th className="table-header-cell text-center">Pokušaji</th>

                          <th className="table-header-cell">Profesor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCourses.map((course, index) => (
                          <tr
                            key={index}
                            className="table-row"
                          >
                            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{course.rbr}</td>
                            <td className="table-cell">{course.year}</td>
                            <td className="table-cell font-medium">{course.course}</td>
                            <td className="table-cell text-center">
                              {course.finalGrade ? (
                                <span className={`grade-badge ${getGradeColor(course.finalGrade)}`}>
                                  {course.finalGrade}
                                </span>
                              ) : (
                                <span className="text-gray-500 dark:text-gray-400">-</span>
                              )}
                            </td>
                            <td className="table-cell text-center">{course.ects}</td>
                            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 text-center">{course.examAttempts}</td>
                            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{course.professor}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="md:hidden space-y-3">
                {filteredCourses.map((course, index) => (
                  <div key={index} className="card p-4">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white leading-tight">
                        {course.course}
                      </h3>
                      <div className="shrink-0">
                        {course.finalGrade ? (
                          <span className={`grade-badge ${getGradeColor(course.finalGrade)}`}>
                            {course.finalGrade}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-medium">-</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-y-1 gap-x-3 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-700 dark:text-gray-300">ECTS:</span> {course.ects}
                      </div>
                      <span className="text-gray-300">•</span>
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        <span className="truncate text-gray-600 dark:text-gray-400">{course.professor}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Grades;
