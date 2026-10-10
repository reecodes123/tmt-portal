/**
 * Auth pages shell.
 *
 * Intentionally minimal — no public header/nav/footer and no background of
 * its own, so the auth surface (currently: login) can paint edge-to-edge
 * without fighting a parent tone. The login page's brand hero + form panel
 * handle the visual environment themselves.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
