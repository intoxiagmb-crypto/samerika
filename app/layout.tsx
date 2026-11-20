import type { Metadata } from 'next';
import './globals.css';
import './reference-theme.css';
export const metadata:Metadata={title:'Solaris — A simpler way to go solar',description:'A connected solar workspace with dedicated agent and company portals. Manage requirements, quotations, installations and earnings.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
