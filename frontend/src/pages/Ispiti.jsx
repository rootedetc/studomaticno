import { useState, useEffect } from 'react';
import api from '../services/api';
import { Skeleton, SkeletonList } from '../components/Skeleton';
import useTranslation from '../hooks/useTranslation.jsx';
import TableCard from '../components/TableCard';
import SegmentedControl from '../components/SegmentedControl';
import EmptyState from '../components/EmptyState';

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

  const prijavljeniColumns = [
    { key: 'year', label: 'Godina', priority: 'medium' },
    { key: 'subject', label: 'Predmet', priority: 'high' },
    { key: 'professor', label: 'Predavač', priority: 'medium' },
    { key: 'examDate', label: 'Termin', priority: 'high' },
    { key: 'room', label: 'Učionica', priority: 'medium' },
    { key: 'enrollmentDate', label: 'Prijavljen', priority: 'low' },
    {
      key: 'grade',
      label: 'Ocjena',
      priority: 'high',
      format: (value) => value ? (
        <span className={`grade-badge ${getGradeColor(value)}`}>{value}</span>
      ) : (
        <span className="text-gray-500 dark:text-gray-400">-</span>
      )
    },
  ];

  const odjavljeniColumns = [
    { key: 'year', label: 'Godina', priority: 'medium' },
    { key: 'subject', label: 'Predmet', priority: 'high' },
    { key: 'professor', label: 'Predavač', priority: 'medium' },
    { key: 'examDate', label: 'Termin', priority: 'high' },
    { key: 'room', label: 'Učionica', priority: 'medium' },
    { key: 'cancellationDate', label: 'Odjavljen', priority: 'low' },
  ];

  const attemptsColumns = [
    { key: 'attemptNumber', label: 'Br. izlaska', priority: 'high' },
    { key: 'examPeriod', label: 'Naziv roka', priority: 'high' },
    {
      key: 'registered',
      label: 'Prijavljen',
      priority: 'medium',
      format: (value) => value ? (
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    },
    { key: 'examDate', label: 'Termin roka', priority: 'high' },
    { key: 'professor', label: 'Predavač', priority: 'medium' },
    { key: 'enrollmentTime', label: 'Vrijeme prijave', priority: 'low' },
    { key: 'cancellationTime', label: 'Vrijeme odjave', priority: 'low' },
    {
      key: 'grade',
      label: 'Ocjena',
      priority: 'high',
      format: (value) => value ? (
        <span className={`grade-badge ${getGradeColor(value)}`}>{value}</span>
      ) : (
        <span className="text-gray-500 dark:text-gray-400">-</span>
      )
    },
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

          <SegmentedControl
            options={[
              { value: 'prijavljeni', label: 'Prijavljeni ispiti' },
              { value: 'izlasci', label: 'Izlasci na ispit' }
            ]}
            value={activeTab}
            onChange={(value) => setActiveTab(value)}
          />

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 lg:px-6 pb-6">
        <div className="max-w-6xl mx-auto fade-in">
          {activeTab === 'prijavljeni' ? (
            <>
              {exams?.prijavljeni?.length === 0 && exams?.odjavljeni?.length === 0 ? (
                <EmptyState
                  icon="emptyExams"
                  title="Nema prijavljenih ispita za trenutni rok"
                />
              ) : (
                <div className="space-y-6">
                  {exams?.prijavljeni?.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Prijavljeni kolegiji</h2>
                      
                      <div className="hidden md:block table-container">
                        <div className="overflow-x-auto">
                          <table className="table">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <th className="table-header-cell">Godina</th>
                                <th className="table-header-cell">Predmet</th>
                                <th className="table-header-cell">Predavač</th>
                                <th className="table-header-cell">Termin</th>
                                <th className="table-header-cell">Učionica</th>
                                <th className="table-header-cell">Prijavljen</th>
                                <th className="table-header-cell text-center">Ocjena</th>
                              </tr>
                            </thead>
                            <tbody>
                              {exams.prijavljeni.map((exam, index) => {
                                const examKey = `${exam.subject}-${exam.examDate}-${index}`;
                                return (
                                  <tr 
                                    key={examKey}
                                    className="table-row"
                                  >
                                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{exam.year}</td>
                                    <td className="table-cell font-medium">{exam.subject}</td>
                                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{exam.professor}</td>
                                    <td className="table-cell">{exam.examDate}</td>
                                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{exam.room}</td>
                                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{exam.enrollmentDate}</td>
                                    <td className="table-cell text-center">
                                      {exam.grade ? (
                                        <span className={`grade-badge ${getGradeColor(exam.grade)}`}>
                                          {exam.grade}
                                        </span>
                                      ) : (
                                        <span className="text-gray-500 dark:text-gray-400">-</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="md:hidden space-y-3">
                        {exams.prijavljeni.map((exam, index) => {
                          const examKey = `${exam.subject}-${exam.examDate}-${index}`;
                          return (
                            <TableCard
                              key={examKey}
                              data={exam}
                              columns={prijavljeniColumns}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {exams?.odjavljeni?.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Odjavljeni kolegiji</h2>
                      
                      <div className="hidden md:block table-container">
                        <div className="overflow-x-auto">
                          <table className="table">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <th className="table-header-cell">Godina</th>
                                <th className="table-header-cell">Predmet</th>
                                <th className="table-header-cell">Predavač</th>
                                <th className="table-header-cell">Termin</th>
                                <th className="table-header-cell">Učionica</th>
                                <th className="table-header-cell">Odjavljen</th>
                              </tr>
                            </thead>
                            <tbody>
                              {exams.odjavljeni.map((exam, index) => {
                                const examKey = `${exam.subject}-${exam.examDate}-${index}`;
                                return (
                                  <tr 
                                    key={examKey}
                                    className="table-row"
                                  >
                                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{exam.year}</td>
                                    <td className="table-cell font-medium">{exam.subject}</td>
                                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{exam.professor}</td>
                                    <td className="table-cell">{exam.examDate}</td>
                                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{exam.room}</td>
                                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{exam.cancellationDate}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="md:hidden space-y-3">
                        {exams.odjavljeni.map((exam, index) => {
                          const examKey = `${exam.subject}-${exam.examDate}-${index}`;
                          return (
                            <TableCard
                              key={examKey}
                              data={exam}
                              columns={odjavljeniColumns}
                            />
                          );
                        })}
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
                  className="input"
                >
                  {grades?.courses?.map((course, index) => {
                        const courseKey = `${course.course}-${index}`;
                        return (
                          <option key={courseKey} value={course.course}>
                            {course.course} ({course.examAttempts || 0} pokušaja)
                          </option>
                        );
                      })}
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
                    <EmptyState
                      icon="emptyExams"
                      title="Nema podataka o izlascima za ovaj kolegij"
                    />
                  ) : (
                    <>
                      <div className="hidden md:block table-container">
                        <div className="overflow-x-auto">
                          <table className="table">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <th className="table-header-cell">Br. izlaska</th>
                                <th className="table-header-cell">Naziv roka</th>
                                <th className="table-header-cell text-center">Prijavljen</th>
                                <th className="table-header-cell">Termin roka</th>
                                <th className="table-header-cell">Predavač</th>
                                <th className="table-header-cell">Vrijeme prijave</th>
                                <th className="table-header-cell">Vrijeme odjave</th>
                                <th className="table-header-cell text-center">Ocjena</th>
                              </tr>
                            </thead>
                            <tbody>
                              {examAttempts.attempts.map((attempt, index) => {
                                const attemptKey = `${attempt.examPeriod}-${attempt.attemptNumber}-${index}`;
                                return (
                                  <tr 
                                    key={attemptKey}
                                    className="table-row"
                                  >
                                    <td className="table-cell font-medium">
                                      {attempt.attemptNumber}
                                    </td>
                                    <td className="table-cell">
                                      {attempt.examPeriod}
                                    </td>
                                    <td className="table-cell text-center">
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
                                    <td className="table-cell">
                                      {attempt.examDate}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                                      {attempt.professor}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                                      {attempt.enrollmentTime}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                                      {attempt.cancellationTime || '-'}
                                    </td>
                                    <td className="table-cell text-center">
                                      {attempt.grade ? (
                                        <span className={`grade-badge ${getGradeColor(attempt.grade)}`}>
                                          {attempt.grade}
                                        </span>
                                      ) : (
                                        <span className="text-gray-500 dark:text-gray-400">-</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="md:hidden space-y-3">
                        {examAttempts.attempts.map((attempt, index) => {
                          const attemptKey = `${attempt.examPeriod}-${attempt.attemptNumber}-${index}`;
                          return (
                            <TableCard
                              key={attemptKey}
                              data={attempt}
                              columns={attemptsColumns}
                            />
                          );
                        })}
                      </div>
                    </>
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