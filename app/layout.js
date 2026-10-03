import './globals.css';
import { AppProvider } from '../context/AppContext';
import DashboardLayout from '../components/DashboardLayout';

export const metadata = {
    title: 'B-Safe | Command Center',
    description: 'B-Safe Floor Selection Dashboard for BINUS @Medan - Real-time evacuation monitoring',
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
