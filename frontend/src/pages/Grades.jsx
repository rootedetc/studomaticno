import { useState, useEffect } from 'react';
import api from '../services/api';
import { Skeleton, SkeletonList } from '../components/Skeleton';

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
    if (gradeNum >= 5) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30';
    if (gradeNum >= 3) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30';
    return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700';
  };

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
    <div className="flex-1 flex flex-col h-full">
      <div className="p-4 lg:p-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Indeks</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {grades?.studyProgram || grades?.viewMode}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 lg:px-6 pb-6">
        <div className="max-w-5xl mx-auto fade-in">
          {grades?.summary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="card text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{grades.summary.total}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ukupno</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{grades.summary.passed}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Položeno</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{grades.summary.failed}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Nepoloženo</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{grades.summary.ectsTotal}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">ECTS</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{grades.summary.averageGrade}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Prosjek</p>
              </div>
            </div>
          )}

          {grades?.courses?.length === 0 ? (
            <div className="card text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">Nema podataka o ocjenama</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full card">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">#</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Godina</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Kolegij</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">OCJENA</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">ECTS</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Pokušaji</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Otkaž.</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Profesor</th>
                  </tr>
                </thead>
                <tbody>
                  {grades?.courses?.map((course, index) => (
                    <tr 
                      key={index}
                      className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{course.rbr}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{course.year}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">{course.course}</td>
                      <td className="py-3 px-4 text-center">
                        {course.finalGrade ? (
                          <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-lg ${getGradeColor(course.finalGrade)}`}>
                            {course.finalGrade}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-center text-gray-900 dark:text-white">{course.ects}</td>
                      <td className="py-3 px-4 text-sm text-center text-gray-600 dark:text-gray-400">{course.examAttempts}</td>
                      <td className="py-3 px-4 text-sm text-center text-gray-600 dark:text-gray-400">{course.cancellations}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{course.professor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Grades;
