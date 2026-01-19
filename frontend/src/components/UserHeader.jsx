import { useState, useEffect } from 'react';

function UserHeader({ userInfo }) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${day}.${month}.${year} ${hours}:${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  if (!userInfo) return null;

  const { studentName, studentId, program, semester, paymentZoneColor } = userInfo;

  return (
    <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 text-sm mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {paymentZoneColor !== 'green' && paymentZoneColor !== 'unknown' && (
            <span className={`w-2 h-2 rounded-full ${
              paymentZoneColor === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
          )}
          <span className="font-medium">{studentName}</span>
          <span className="text-gray-600">({studentId})</span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600">{program}</span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600">{semester}</span>
        </div>
        <div className="text-gray-500">
          {currentTime}
        </div>
      </div>
    </div>
  );
}

export default UserHeader;
