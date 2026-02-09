import { useState, useEffect } from 'react';
import api from '../services/api';
import { Skeleton, SkeletonList } from '../components/Skeleton';
import useTranslation from '../hooks/useTranslation.jsx';
import PageHeader from '../components/PageHeader';

import SegmentedControl from '../components/SegmentedControl';
import EmptyState from '../components/EmptyState';

function Ispiti() {
  const { t } = useTranslation();
  const [exams, setExams] = useState(null);
  const [grades, setGrades] = useState(null);
  const [loading, setLoading] = useState(true);
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      <PageHeader
        title="Ispiti"
        subtitle={activeTab === 'prijavljeni'
          ? `${exams?.academicYear} - ${exams?.examPeriod}`
          : 'Povijest izlazaka na ispit'
        }
      >
        <SegmentedControl
          options={[
            { value: 'prijavljeni', label: 'Prijavljeni ispiti' },
            { value: 'izlasci', label: 'Izlasci na ispit' }
          ]}
          value={activeTab}
          onChange={(value) => setActiveTab(value)}
        />

        {error && (
          <div className="error-banner mt-4">
            {error}
          </div>
        )}
      </PageHeader>

      <div className="flex-1 overflow-y-auto px-4 lg:px-6 pb-6 pt-4">
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
                        {exams.prijavljeni.map((exam, index) => (
                          <div key={`${exam.subject}-${exam.examDate}-${index}`} className="card p-4">
                            <div className="flex justify-between items-start gap-3 mb-2">
                              <h3 className="font-medium text-gray-900 dark:text-white leading-tight">
                                {exam.subject}
                              </h3>
                              <div className="shrink-0">
                                {exam.grade ? (
                                  <span className={`grade-badge ${getGradeColor(exam.grade)}`}>
                                    {exam.grade}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 font-medium">-</span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700 dark:text-gray-300 w-16">Termin:</span>
                                <span>{exam.examDate} • {exam.room}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700 dark:text-gray-300 w-16">Predavač:</span>
                                <span className="truncate">{exam.professor}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700 dark:text-gray-300 w-16">Prijava:</span>
                                <span>{exam.enrollmentDate}</span>
                              </div>
                            </div>
                          </div>
                        ))}
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
                        {exams.odjavljeni.map((exam, index) => (
                          <div key={`${exam.subject}-${exam.examDate}-${index}`} className="card p-4 opacity-75">
                            <div className="flex justify-between items-start gap-3 mb-2">
                              <h3 className="font-medium text-gray-900 dark:text-white leading-tight">
                                {exam.subject}
                              </h3>
                              <span className="badge badge-warning">Odjavljeno</span>
                            </div>

                            <div className="flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700 dark:text-gray-300 w-16">Termin:</span>
                                <span>{exam.examDate} • {exam.room}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700 dark:text-gray-300 w-16">Predavač:</span>
                                <span className="truncate">{exam.professor}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700 dark:text-gray-300 w-16">Odjava:</span>
                                <span>{exam.cancellationDate}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {grades?.courses?.map((course, index) => (
                <div
                  key={`${course.course}-${index}`}
                  className="card p-4 flex justify-between items-center"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white">{course.course}</h3>
                  <span className="badge badge-primary">{course.examAttempts} izl.</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Ispiti;