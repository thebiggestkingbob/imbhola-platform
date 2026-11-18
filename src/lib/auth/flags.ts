import 'server-only';

/**
 * Sign-in is opt-in and remains disabled in production until operator explicitly
 * enables the verified identity flow after deployment security review.
 * This is deliberately not a NEXT_PUBLIC variable.
 */
export function isIdentitySignInEnabled(): boolean {
  return process.env.IMBHOLA_AUTH_SIGNIN_ENABLED === 'true';
}
