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

  return identityAndDatabaseConfig(env);
}

function identityAndDatabaseConfig(env: Record<string,string | undefined>) {
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

export function pilotWorkspaceConfig(env: Record<string,string | undefined> = process.env) {
  if (env.VERCEL_ENV !== 'preview' || env.VERCEL_GIT_COMMIT_REF !== 'feature/v3-3-platform-foundation' ||
      env.IMBHOLA_ENABLE_PILOT_WORKSPACE !== '1') return;
  const flowId = env.IMBHOLA_PILOT_DESCOPE_FLOW_ID;
  if (!flowId || !/^[a-z0-9][a-z0-9_-]{0,79}$/.test(flowId)) return;
  const config = identityAndDatabaseConfig({
    IMBHOLA_DATABASE_URL:env.IMBHOLA_PILOT_DATABASE_URL,
    IMBHOLA_IDENTITY_MODE:'descope',
    NEXT_PUBLIC_DESCOPE_PROJECT_ID:env.IMBHOLA_PILOT_DESCOPE_PROJECT_ID,
  });
  if (config?.mode !== 'descope') return;
  return {...config,flowId};
}
