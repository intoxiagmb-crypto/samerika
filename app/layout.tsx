import type { Metadata } from 'next';
import { appPresentationScript } from '@/lib/app-presentation.mjs';
import SiteFooter from '@/components/site-footer';
import MobileNavigation from '@/components/mobile-navigation';
import './globals.css';
import './reference-theme.css';
import './brand.css';
import './samerika-theme.css';
import './tracking.css';
import './project-timeline.css';
import './site-footer.css';
import './enquiry/enquiry.css';
import './mobile-app.css';
import './login/eco-login.css';
import './app-navigation.css';
export const metadata:Metadata={title:'Samerika Power Private Limited — Solar energy solutions',description:'A connected solar workspace with dedicated partner and company portals. Manage requirements, quotations, installations and earnings.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children,modal}:{children:React.ReactNode;modal:React.ReactNode}){return <html lang="en" suppressHydrationWarning><head><script id="samerika-app-presentation" dangerouslySetInnerHTML={{__html:appPresentationScript}}/><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/></head><body id="site-top">{children}<SiteFooter/><MobileNavigation/>{modal}</body></html>}
