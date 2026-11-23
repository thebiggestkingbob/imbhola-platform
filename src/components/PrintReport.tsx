'use client';

export default function PrintReport() {
  return <button className="button button-small" type="button" onClick={() => window.print()}>Print or save as PDF</button>;
}
