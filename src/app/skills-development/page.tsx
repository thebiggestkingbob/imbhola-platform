import { PublicCard, PublicPage } from '@/components/PublicPage';

export default function SkillsDevelopment() {
  return <PublicPage eyebrow="Skills development" title="Understand the terms behind the work."
    cta={{label:'See the reporting process',href:'/how-it-works'}}>
    <div className="grid">
      <PublicCard title="Workplace Skills Plan"><p>The WSP records the training your organisation plans to deliver.</p></PublicCard>
      <PublicCard title="Annual Training Report"><p>The ATR records completed training, who took part and what it cost.</p></PublicCard>
      <PublicCard title="Occupation and qualification codes"><p>Use verified reference materials when choosing OFO codes and PIVOTAL classifications.</p></PublicCard>
    </div>
  </PublicPage>;
}
