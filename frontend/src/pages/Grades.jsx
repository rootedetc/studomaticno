import { useState, useEffect } from 'react';
import api from '../services/api';
import { getFriendlyErrorMessage } from '../utils/helpers';
import { Skeleton, SkeletonList } from '../components/Skeleton';
import { GradeDistributionChart } from '../components/Charts';
import TableCard from '../components/TableCard';
import EmptyState from '../components/EmptyState';

function Grades() {
  const [grades, setGrades] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    if (gradeNum >= 5) return 'grade-high';
    if (gradeNum >= 3) return 'grade-medium';
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
    { key: 'cancellations', label: 'Otkaž.', priority: 'low' },
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
      <div className="page-header">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Indeks</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {grades?.studyProgram || grades?.viewMode}
            </p>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            {getFriendlyErrorMessage(error)}
          </div>
        )}
      </div>

      <div className="page-content">
        <div className="max-w-5xl mx-auto fade-in">
          {grades?.summary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="stat-card">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{grades.summary.total}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ukupno</p>
              </div>
              <div className="stat-card">
                <p className="text-2xl font-bold text-gray-900 dark:text-white text-green-600 dark:text-green-400">{grades.summary.passed}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Položeno</p>
              </div>
              <div className="stat-card">
                <p className="text-2xl font-bold text-gray-900 dark:text-white text-red-600 dark:text-red-400">{grades.summary.failed}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Nepoloženo</p>
              </div>
              <div className="stat-card">
                <p className="text-2xl font-bold text-gray-900 dark:text-white text-blue-600 dark:text-blue-400">{grades.summary.ectsTotal}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">ECTS</p>
              </div>
              <div className="stat-card">
                <p className="text-2xl font-bold text-gray-900 dark:text-white text-purple-600 dark:text-purple-400">{grades.summary.averageGrade}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Prosjek</p>
              </div>
            </div>
          )}

          <GradeDistributionChart grades={grades} />

          {grades?.courses?.length === 0 ? (
            <EmptyState
              icon="emptyGrades"
              title="Nema podataka o ocjenama"
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
                          <th className="table-header-cell text-center">Otkaž.</th>
                          <th className="table-header-cell">Profesor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grades?.courses?.map((course, index) => (
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
                            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 text-center">{course.cancellations}</td>
                            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{course.professor}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="md:hidden space-y-3">
                {grades?.courses?.map((course, index) => (
                  <TableCard
                    key={index}
                    data={course}
                    columns={gradeColumns}
                  />
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
