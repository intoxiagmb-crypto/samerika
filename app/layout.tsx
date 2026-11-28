import type { Metadata } from 'next';
import SiteFooter from '@/components/site-footer';
import './globals.css';
import './reference-theme.css';
import './brand.css';
import './samerika-theme.css';
import './tracking.css';
import './project-timeline.css';
import './site-footer.css';
import './enquiry/enquiry.css';
export const metadata:Metadata={title:'Samerika Power Private Limited — Solar energy solutions',description:'A connected solar workspace with dedicated partner and company portals. Manage requirements, quotations, installations and earnings.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children,modal}:{children:React.ReactNode;modal:React.ReactNode}){return <html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/></head><body id="site-top">{children}<SiteFooter/>{modal}</body></html>}
