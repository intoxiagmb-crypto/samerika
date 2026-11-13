import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Solaris — Power a brighter tomorrow',description:'Solar solutions for your world. One connected platform for customers, partners and solar teams.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
