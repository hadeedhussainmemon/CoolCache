import React from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { usePushNotification } from '../../hooks/usePushNotification';
import { Download, Share, BellRing, Smartphone } from 'lucide-react';

export default function InstallPage() {
    const { isInstallable, installApp, isIOS } = usePWAInstall();
    const { subscribe, isSubscribed } = usePushNotification();

    const handleInstall = async () => {
        // 1. Trigger Install
        if (isInstallable) {
            const installed = await installApp();
            if (installed) {
                // 2. If installed, ask for notifications immediately
                if (!isSubscribed) {
                    setTimeout(() => {
                        subscribe();
                    }, 1000);
                }
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-600 to-purple-700 flex flex-col items-center justify-center p-6 text-white text-center">

            {/* App Icon / Logo Placeholder */}
            <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl mb-8 flex items-center justify-center">
                <img src="/pwa-192x192.png" alt="CoolCache" className="w-20 h-20 rounded-2xl" />
            </div>

            <h1 className="text-3xl md:text-5xl font-bold mb-4 font-playfair">
                Install CoolCache App
            </h1>
            <p className="text-purple-100 text-lg md:text-xl max-w-md mx-auto mb-10 leading-relaxed">
                Get the best shopping experience with faster loading, offline access, and exclusive deals.
            </p>

            {/* Main Action Area */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 md:p-8 w-full max-w-sm border border-white/20 shadow-xl">

                {/* ANDROID / DESKTOP BUTTON */}
                {isInstallable && (
                    <button
                        onClick={handleInstall}
                        className="w-full bg-white text-purple-700 font-bold py-4 px-6 rounded-xl shadow-lg hover:bg-purple-50 transition-transform active:scale-95 flex items-center justify-center gap-3 mb-4"
                    >
                        <Download className="w-6 h-6" />
                        Install App Now
                    </button>
                )}

                {/* IOS INSTRUCTIONS */}
                {isIOS && (
                    <div className="text-left space-y-4">
                        <div className="flex items-start gap-4 p-3 bg-black/20 rounded-lg">
                            <div className="bg-white/20 p-2 rounded-full">
                                <Share className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold">Step 1</p>
                                <p className="text-sm opacity-90">Tap the <span className="font-bold">Share</span> button below</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-3 bg-black/20 rounded-lg">
                            <div className="bg-white/20 p-2 rounded-full">
                                <Smartphone className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold">Step 2</p>
                                <p className="text-sm opacity-90">Select <span className="font-bold">"Add to Home Screen"</span></p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ALREADY INSTALLED / FALLBACK */}
                {!isInstallable && !isIOS && (
                    <div className="text-center">
                        <p className="font-medium text-lg mb-4">✨ App is ready!</p>
                        <button
                            onClick={() => subscribe()}
                            disabled={isSubscribed}
                            className={`w-full py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 ${isSubscribed ? 'bg-green-500/20 text-green-100' : 'bg-white text-purple-700'}`}
                        >
                            <BellRing className="w-5 h-5" />
                            {isSubscribed ? 'Notifications Active' : 'Enable Notifications'}
                        </button>
                    </div>
                )}
            </div>

            <p className="mt-8 text-sm opacity-60">
                Safe & Secure • 2MB Size • Free
            </p>
        </div>
    );
}
