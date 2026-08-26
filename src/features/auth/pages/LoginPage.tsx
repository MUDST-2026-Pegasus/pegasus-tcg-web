import loginBackground from "@/assets/auth/login-background.jpg";
import loginHeader from "@/assets/auth/login-header.jpg";
import { Card } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/LoginForm";

export function LoginPage() {
  return (
    <>
      <img
        src={loginBackground}
        alt=""
        className="absolute inset-0 size-full object-cover opacity-10"
      />
      <Card className="relative w-full max-w-[672px] gap-0 rounded-xl p-0 shadow-sm [--card-spacing:0px]">
        <div className="relative h-[220px] shrink-0 overflow-hidden">
          <img
            src={loginHeader}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          <h1 className="absolute bottom-4 left-6 right-6 text-[32px] leading-10 font-bold tracking-[-0.64px] text-foreground">
            Log in to Pegasus
          </h1>
        </div>
        <div className="p-8">
          <LoginForm />
        </div>
      </Card>
    </>
  );
}
