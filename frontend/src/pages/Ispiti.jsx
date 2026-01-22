import { useState, useEffect } from 'react';
import api from '../services/api';
import { Skeleton, SkeletonList } from '../components/Skeleton';
import useTranslation from '../hooks/useTranslation.jsx';

function Ispiti() {
  const { t } = useTranslation();
  const [exams, setExams] = useState(null);
  const [grades, setGrades] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [examAttempts, setExamAttempts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('prijavljeni');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [examsData, gradesData] = await Promise.all([
        api.getExams(),
        api.getGrades()
      ]);
      setExams(examsData);
      setGrades(gradesData);
      if (gradesData.courses && gradesData.courses.length > 0) {
        setSelectedCourse(gradesData.courses[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = async (course) => {
    setSelectedCourse(course);
    setExamAttempts(null);

    if (course.examLinkParams) {
      setLoadingAttempts(true);
      try {
        const attempts = await api.request(
          `/exams/attempts?idOS=${course.examLinkParams.idOS}&idPred=${course.examLinkParams.idPred}&idAKG=${course.examLinkParams.idAKG}`
        );
        setExamAttempts(attempts);
      } catch (err) {
        console.error('Failed to load exam attempts:', err);
      } finally {
        setLoadingAttempts(false);
      }
    }
  };

  const getGradeColor = (grade) => {
    if (!grade || grade.trim() === '') return 'text-gray-400 dark:text-gray-500';
    const gradeNum = parseInt(grade);
    if (gradeNum >= 5) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30';
    if (gradeNum >= 3) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30';
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30';
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ispiti</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {activeTab === 'prijavljeni' 
                ? `${exams?.academicYear} - ${exams?.examPeriod}`
                : 'Povijest izlazaka na ispit'
              }
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('prijavljeni')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'prijavljeni'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Prijavljeni ispiti
          </button>
          <button
            onClick={() => setActiveTab('izlasci')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'izlasci'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Izlasci na ispit
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 lg:px-6 pb-6">
        <div className="max-w-6xl mx-auto fade-in">
          {activeTab === 'prijavljeni' ? (
            <>
              {exams?.prijavljeni?.length === 0 && exams?.odjavljeni?.length === 0 ? (
                <div className="card text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <p className="text-gray-500">Nema prijavljenih ispita za trenutni rok</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {exams?.prijavljeni?.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Prijavljeni kolegiji</h2>
                      <div className="overflow-x-auto">
                        <table className="w-full card">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Godina</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Predmet</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Predavač</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Termin</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Učionica</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Prijavljen</th>
                              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Ocjena</th>
                            </tr>
                          </thead>
                          <tbody>
                            {exams.prijavljeni.map((exam, index) => (
                              <tr 
                                key={index}
                                className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                              >
                                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{exam.year}</td>
                                <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">{exam.subject}</td>
                                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{exam.professor}</td>
                                <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{exam.examDate}</td>
                                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{exam.room}</td>
                                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{exam.enrollmentDate}</td>
                                <td className="py-3 px-4 text-center">
                                  {exam.grade ? (
                                    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-lg ${getGradeColor(exam.grade)}`}>
                                      {exam.grade}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-500">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {exams?.odjavljeni?.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Odjavljeni kolegiji</h2>
                      <div className="overflow-x-auto">
                        <table className="w-full card">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Godina</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Predmet</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Predavač</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Termin</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Učionica</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Odjavljen</th>
                            </tr>
                          </thead>
                          <tbody>
                            {exams.odjavljeni.map((exam, index) => (
                              <tr 
                                key={index}
                                className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                              >
                                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{exam.year}</td>
                                <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">{exam.subject}</td>
                                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{exam.professor}</td>
                                <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{exam.examDate}</td>
                                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{exam.room}</td>
                                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{exam.cancellationDate}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Odaberi kolegij:
                </label>
                <select
                  value={selectedCourse?.course || ''}
                  onChange={(e) => {
                    const course = grades?.courses?.find(c => c.course === e.target.value);
                    if (course) handleCourseChange(course);
                  }}
                  className="w-full md:w-96 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {grades?.courses?.map((course, index) => (
                    <option key={index} value={course.course}>
                      {course.course} ({course.examAttempts || 0} pokušaja)
                    </option>
                  ))}
                </select>
              </div>

              {loadingAttempts ? (
                <div className="card p-8">
                  <div className="flex items-center justify-center">
                    <div className="loading-spinner w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full"></div>
                  </div>
                </div>
              ) : examAttempts ? (
                <>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Povijest izlazaka: {examAttempts.subject}
                  </h2>
                  {examAttempts.attempts?.length === 0 ? (
                    <div className="card text-center py-12">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      <p className="text-gray-500">Nema podataka o izlascima za ovaj kolegij</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full card">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Br. izlaska</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Naziv roka</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Prijavljen</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Termin roka</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Predavač</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Vrijeme prijave</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Vrijeme odjave</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Ocjena</th>
                          </tr>
                        </thead>
                        <tbody>
                          {examAttempts.attempts.map((attempt, index) => (
                            <tr 
                              key={index}
                              className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                            >
                              <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                                {attempt.attemptNumber}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                                {attempt.examPeriod}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {attempt.registered ? (
                                  <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                                {attempt.examDate}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                {attempt.professor}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                {attempt.enrollmentTime}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                {attempt.cancellationTime || '-'}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {attempt.grade ? (
                                  <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-lg ${getGradeColor(attempt.grade)}`}>
                                    {attempt.grade}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 dark:text-gray-500">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Ispiti;