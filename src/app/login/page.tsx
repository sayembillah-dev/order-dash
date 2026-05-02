import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const params = await searchParams;
  const redirectTo =
    params.from?.startsWith("/") && !params.from.startsWith("//")
      ? params.from
      : "/intake";

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-muted/40 p-4 pt-safe-t pb-safe-b">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm action={loginAction} defaultRedirect={redirectTo} />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/" className="underline underline-offset-4">
              Back to home
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
