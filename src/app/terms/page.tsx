import { PublicPage } from '@/components/PublicPage';

export default function Terms() {
  return <PublicPage eyebrow="Terms of use" title="Preview terms"
    description="The current review uses sample data. Final terms, acceptable-use rules and commercial policies require approval before customer onboarding."
    cta={{label:'See launch readiness',href:'/readiness'}}>
    <p className="notice">Use sample company and employee information when testing.</p>
  </PublicPage>;
}
