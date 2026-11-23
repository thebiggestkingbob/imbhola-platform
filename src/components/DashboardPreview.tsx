import { Check, FileText, GraduationCap, LayoutGrid, UsersRound } from 'lucide-react';
import { Status } from './LocalUI';

export default function DashboardPreview() {
  return <figure className="dashboard-preview" aria-label="Example of the Imbhola reporting workspace">
    <figcaption><span className="eyebrow-dot"/> Workspace preview <span>Sample data</span></figcaption>
    <div className="preview-board">
      <div className="preview-rail" aria-hidden="true"><LayoutGrid size={18}/><UsersRound size={18}/><GraduationCap size={18}/><FileText size={18}/></div>
      <div className="preview-body">
        <div className="preview-title"><div><small>Cedar Workshop</small><strong>Reporting overview</strong></div><span>2026</span></div>
        <dl className="workspace-metrics preview-metrics"><div><dt>Employees</dt><dd>12</dd></div><div><dt>Training records</dt><dd>8</dd></div><div><dt>Evidence files</dt><dd>6</dd></div></dl>
        <div className="preview-task"><div className="icon-tile"><FileText size={19} aria-hidden="true"/></div><div><strong>WSP and ATR</strong><small>Version 1 · Ready for committee</small></div></div>
        <div className="preview-row"><Check size={16} aria-hidden="true"/><span>Workforce mapped</span><Status value="Ready"/></div>
        <div className="preview-row"><FileText size={16} aria-hidden="true"/><span>Committee review</span><Status value="review"/></div>
      </div>
    </div>
  </figure>;
}
