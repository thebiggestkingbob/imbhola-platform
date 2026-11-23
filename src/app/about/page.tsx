import Image from 'next/image';
import { PublicPage } from '@/components/PublicPage';

export default function About() {
  return <PublicPage eyebrow="About Imbhola" title="Skills development, made clearer."
    description="Imbhola helps South African employers and skills development practitioners organise the work behind their training and reporting."
    cta={{label:'See how it works',href:'/how-it-works'}}>
    <div className="about-feature">
      <Image src="/skills-workshop.webp" alt="Two professionals reviewing a training schedule in a workshop" width={1000} height={667} sizes="(max-width: 640px) 90vw, 45vw"/>
      <div><h2>Good reporting starts throughout the year.</h2><p>Keep workforce information, evidence and decisions organised as the work happens. Employers retain oversight and authorised representatives handle external filings.</p></div>
    </div>
  </PublicPage>;
}
