import PublicHeader from '@/components/public-header';
import AppPageHeading from '@/components/app-page-heading';
import SolarCalculator from './solar-calculator';
import '../home.css';

export const metadata = { title: 'Solar Calculator | Samerika Power', description: 'Explore an indicative solar system size using your electricity bill and available rooftop.' };
export default function CalculatorPage() {
  return <div className="samerika-home app-public-page"><PublicHeader/><main className="app-page">
    <AppPageHeading title="Solar calculator" description="Find a starting point for your rooftop solar plan."/>
    <SolarCalculator/>
  </main></div>;
}
