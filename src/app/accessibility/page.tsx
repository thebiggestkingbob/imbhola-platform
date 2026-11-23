import { PublicPage } from '@/components/PublicPage';

export default function Accessibility() {
  return <PublicPage eyebrow="Accessibility" title="Use Imbhola on your terms."
    description="Navigate with a keyboard, use your browser’s zoom and move between the same workspaces on a phone or desktop."
    cta={{label:'Contact Imbhola',href:'/contact'}}>
    <p className="notice">If part of the site is difficult to use, tell us the page and the action you were trying to take.</p>
  </PublicPage>;
}
