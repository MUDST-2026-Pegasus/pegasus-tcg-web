import { Card } from "@/components/ui/card";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import registerBackground from "@/assets/auth/register-background.jpg";
import registerHeader from "@/assets/auth/register-header.jpg";

export function RegisterPage() {
  return (
    <>
      <img
        src={registerBackground}
        alt=""
        className="absolute inset-0 size-full object-cover opacity-10"
      />
      <Card className="relative w-full max-w-[672px] gap-0 rounded-xl p-0 shadow-sm [--card-spacing:0px]">
        <div className="relative h-64 shrink-0 overflow-hidden">
          <img
            src={registerHeader}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-1 p-6">
            <h1 className="text-2xl font-semibold tracking-[-0.24px] text-primary-foreground">
              Sign up to continue
            </h1>
            <p className="text-sm text-primary-foreground">
              To like or purchase an item, or to chat with the seller, please
              create your account.11
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-6 p-8">
          <RegisterForm />
        </div>
      </Card>
    </>
  );
}
