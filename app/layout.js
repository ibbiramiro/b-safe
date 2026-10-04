import './globals.css';
import './mobile.css';
import { AppProvider } from '../context/AppContext';
import DashboardLayout from '../components/DashboardLayout';

export const metadata = {
    title: 'B-Safe | Command Center',
    description: 'B-Safe Floor Selection Dashboard for BINUS @Medan - Real-time evacuation monitoring',
};

// viewportFit "cover" agar env(safe-area-inset-*) bekerja di HP berponi / gesture bar
export const viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    themeColor: '#FFFFFF',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <AppProvider>
                    <DashboardLayout>
                        {children}
                    </DashboardLayout>
                </AppProvider>
            </body>
        </html>
    );
}
