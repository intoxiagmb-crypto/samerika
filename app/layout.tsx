import type { Metadata } from 'next';
import './globals.css';
import './reference-theme.css';
import './brand.css';
import './samerika-theme.css';
import './tracking.css';
export const metadata:Metadata={title:'Samerika Power Private Limited — Solar energy solutions',description:'A connected solar workspace with dedicated partner and company portals. Manage requirements, quotations, installations and earnings.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
