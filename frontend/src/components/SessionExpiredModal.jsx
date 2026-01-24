import { useAuth } from '../App';
import Modal from './Modal';

function SessionExpiredModal({ isOpen, onClose }) {
  const { login } = useAuth();

  const handleReLogin = async () => {
    // Just reload the page. This will cause checkAuth to fail (since session is expired),
    // redirecting to login. But since we didn't wipe cookies, the "Remember Me"
    // cookie will still be there for Login.jsx to use.
    window.location.reload();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleReLogin} title="Sesija je istekla">
      <div className="text-center">
        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Vaša sesija je istekla zbog neaktivnosti. Prijavite se ponovo kako biste nastavili.
        </p>
        <button
          onClick={handleReLogin}
          className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          Prijavite se ponovo
        </button>
      </div>
    </Modal>
  );
}

export default SessionExpiredModal;
