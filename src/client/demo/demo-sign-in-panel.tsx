// Floating sign-in / registration card shown on /login in the demo build. Lets a visitor pick a
// user type and either enter instantly or create a local demo account with that type.
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { DEMO_ROLES, type DemoAuth } from './demo-auth';

const SHOW_ON = new Set(['/login']);

function usePathname(): string {
  const [path, setPath] = React.useState(() => window.location.pathname);
  React.useEffect(() => {
    const sync = (): void => setPath(window.location.pathname);
    window.addEventListener('popstate', sync);
    const timer = window.setInterval(sync, 400);
    return () => {
      window.removeEventListener('popstate', sync);
      window.clearInterval(timer);
    };
  }, []);
  return path;
}

type Mode = 'quick' | 'register';

export function DemoSignInPanel(props: { auth: DemoAuth }): React.ReactElement | null {
  const path = usePathname();
  const [mode, setMode] = React.useState<Mode>('quick');
  const [roleId, setRoleId] = React.useState(DEMO_ROLES[0]!.id);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [collapsed, setCollapsed] = React.useState(false);

  if (!SHOW_ON.has(path)) return null;

  const enter = (): void => window.location.assign('/');
  const role = DEMO_ROLES.find((r) => r.id === roleId) ?? DEMO_ROLES[0]!;

  const onRegister = (e: React.FormEvent): void => {
    e.preventDefault();
    setError(null);
    const [firstName, ...rest] = name.trim().split(/\s+/);
    try {
      props.auth.registerAndSignIn({
        email,
        password,
        firstName: firstName || undefined,
        lastName: rest.join(' ') || undefined,
        roleId,
      });
      enter();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the account');
    }
  };

  if (collapsed) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button onClick={() => setCollapsed(false)}>Demo sign-in</Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(24rem,calc(100vw-2rem))]" data-testid="demo-sign-in-panel">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Demo access</CardTitle>
          <CardDescription>
            No backend is connected, so accounts are stored in this browser only. Pick a user type to see its dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <Button variant={mode === 'quick' ? 'default' : 'outline'} onClick={() => setMode('quick')}>
              Quick sign-in
            </Button>
            <Button variant={mode === 'register' ? 'default' : 'outline'} onClick={() => setMode('register')}>
              Create account
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="demo-role">User type</Label>
            <NativeSelect id="demo-role" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
              {DEMO_ROLES.map((r) => (
                <NativeSelectOption key={r.id} value={r.id}>
                  {r.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <p className="text-sm text-muted-foreground">{role.blurb}</p>
          </div>

          {mode === 'quick' ? (
            <Button
              onClick={() => {
                props.auth.signInAsRole(roleId);
                enter();
              }}
            >
              Continue as {role.label}
            </Button>
          ) : (
            <form className="flex flex-col gap-3" onSubmit={onRegister}>
              <div className="flex flex-col gap-1">
                <Label htmlFor="demo-name">Full name</Label>
                <Input id="demo-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="demo-email">Email</Label>
                <Input id="demo-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="demo-password">Password</Label>
                <Input id="demo-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              </div>
              {error !== null && <p className="text-sm text-destructive" role="alert">{error}</p>}
              <Button type="submit">Create account and sign in</Button>
              <p className="text-xs text-muted-foreground">Afterwards you can sign in with this email and password using the main form.</p>
            </form>
          )}
          <Button variant="ghost" size="sm" onClick={() => setCollapsed(true)}>
            Hide
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
