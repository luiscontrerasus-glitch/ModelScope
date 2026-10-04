import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'ModelScope · Scientific model workspace', description: 'Inspect where a configured scientific model increasingly disagrees with measurements.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
