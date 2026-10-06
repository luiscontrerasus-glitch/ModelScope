import type { Metadata } from 'next';
import './globals.css';
import './elite.css';
import './polish.css';
import './workspace.css';
import './instrument-preview.css';
import { GeistSans } from 'geist/font/sans';
export const metadata: Metadata = { title: 'ModelScope · Scientific model workspace', description: 'Inspect where a configured scientific model increasingly disagrees with measurements.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body className={GeistSans.variable}>{children}</body></html>; }

