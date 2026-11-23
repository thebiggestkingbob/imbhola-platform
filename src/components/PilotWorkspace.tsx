'use client';

import dynamic from 'next/dynamic';

export default dynamic(() => import('./PilotWorkforce'),{
  ssr:false,loading:() => <p>Preparing secure sign-in…</p>,
});
