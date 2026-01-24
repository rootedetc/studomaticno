import { useNavigate } from 'react-router-dom';
import Icon from './Icon';

export default function MobileHeader({ title, onBack }) {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="md:hidden flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-30">
            <button
                onClick={handleBack}
                className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Natrag"
            >
                <Icon name="chevronLeft" className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {title}
            </h1>
        </div>
    );
}
