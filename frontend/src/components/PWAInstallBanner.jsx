import { useState, useEffect } from 'react';
import Icon from './Icon';

/**
 * PWAInstallBanner - Shows a banner prompting users to install the PWA
 * 
 * Features:
 * - Detects iOS Safari, Android Chrome, and Desktop
 * - Shows appropriate instructions for each platform
 * - Supports one-click install on Android via beforeinstallprompt
 * - Dismissible with localStorage persistence
 * - Only shows if not already running as standalone PWA
 */
export default function PWAInstallBanner() {
    const [showBanner, setShowBanner] = useState(false);
    const [platform, setPlatform] = useState(null); // 'ios' | 'android' | 'desktop'
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);

    useEffect(() => {
        // Check if already dismissed
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) return;

        // Check if already running as standalone PWA
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
        if (isStandalone) return;

        // Detect platform
        const userAgent = navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
        const isAndroid = /android/.test(userAgent);
        const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
        const isChrome = /chrome/.test(userAgent) && !/edge/.test(userAgent);

        if (isIOS && isSafari) {
            setPlatform('ios');
            setShowBanner(true);
        } else if (isAndroid && isChrome) {
            setPlatform('android');
            // Wait for beforeinstallprompt event
        }
        // Removed desktop check as per user request

        // Listen for beforeinstallprompt (Android Chrome)
        const handleBeforeInstallPrompt = (e) => {
            // Only show on mobile devices (Android)
            const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
            if (!isMobile) return;

            e.preventDefault();
            setDeferredPrompt(e);
            setShowBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (platform === 'ios') {
            setShowIOSInstructions(true);
        } else if (deferredPrompt) {
            // Trigger the install prompt
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowBanner(false);
            }
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        localStorage.setItem('pwa-install-dismissed', 'true');
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <>
            {/* Main Banner */}
            <div className="fixed bottom-20 left-4 right-4 lg:bottom-4 lg:left-auto lg:right-4 lg:max-w-sm z-50 animate-in slide-in-from-bottom fade-in duration-300">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 backdrop-blur-lg">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="currentColor">
                                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                                Instaliraj aplikaciju
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {platform === 'ios'
                                    ? 'Dodaj na početni zaslon za brži pristup'
                                    : 'Instaliraj za izvanmrežni pristup i brže učitavanje'
                                }
                            </p>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
                        >
                            <Icon name="close" className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="mt-3 flex gap-2">
                        <button
                            onClick={handleInstallClick}
                            className="flex-1 py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors"
                        >
                            {platform === 'ios' ? 'Kako instalirati' : 'Instaliraj'}
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition-colors"
                        >
                            Ne sada
                        </button>
                    </div>
                </div>
            </div>

            {/* iOS Instructions Modal */}
            {showIOSInstructions && (
                <div className="fixed inset-0 z-[60] flex items-end justify-center">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowIOSInstructions(false)}
                    />
                    <div className="relative bg-white dark:bg-gray-800 rounded-t-2xl w-full max-w-lg p-6 pb-safe animate-in slide-in-from-bottom duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Instalacija na iPhone
                            </h3>
                            <button
                                onClick={() => setShowIOSInstructions(false)}
                                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500"
                            >
                                <Icon name="close" className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">
                                    1
                                </div>
                                <div>
                                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                                        Pritisni ikonu dijeljenja
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        Na dnu preglednika (Safari)
                                    </p>
                                    <div className="mt-2 inline-flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">
                                    2
                                </div>
                                <div>
                                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                                        Pronađi "Dodaj na početni zaslon"
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        Pomakni se dolje u izborniku dijeljenja
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">
                                    3
                                </div>
                                <div>
                                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                                        Pritisni "Dodaj"
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        Aplikacija će se pojaviti na početnom zaslonu
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setShowIOSInstructions(false);
                                handleDismiss();
                            }}
                            className="mt-6 w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
                        >
                            Razumijem
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
