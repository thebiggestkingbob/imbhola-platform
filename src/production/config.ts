function httpsUrl(value?: string) {
  try {
    const url = new URL(value ?? '');
    if (url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash) return url;
  } catch {
    return;
  }
}

export function productionWorkspaceConfig(env: Record<string,string | undefined> = process.env) {
  if (env.VERCEL_ENV !== 'production' || env.IMBHOLA_ENABLE_PRODUCTION_WORKSPACE !== '1') return;

  try {
    const database = new URL(env.IMBHOLA_DATABASE_URL ?? '');
    if (!['postgres:','postgresql:'].includes(database.protocol) || !database.hostname || !database.username ||
      !database.password || database.pathname.length < 2 || database.hash) return;

    // Keep TLS verification under application control. Preserve only the
    // connection string's host, port, database, and credentials.
    database.search = '';
    const connectionString = database.toString();
    if (env.IMBHOLA_IDENTITY_MODE === 'descope') {
      const projectId = env.NEXT_PUBLIC_DESCOPE_PROJECT_ID;
      if (!projectId || !/^P[a-zA-Z0-9]{8,100}$/.test(projectId)) return;
      return {mode:'descope' as const,projectId,database:connectionString};
    }
    if (env.IMBHOLA_IDENTITY_MODE && env.IMBHOLA_IDENTITY_MODE !== 'oidc') return;
    const issuer = env.IMBHOLA_IDENTITY_ISSUER;
    const jwks = httpsUrl(env.IMBHOLA_IDENTITY_JWKS_URL);
    const audience = env.IMBHOLA_IDENTITY_AUDIENCE;
    if (!issuer || !httpsUrl(issuer) || !jwks || !audience?.trim() || audience.length > 200) return;
    return {mode:'oidc' as const,issuer,jwks,audience,database:connectionString};
  } catch {
    return;
  }
}
