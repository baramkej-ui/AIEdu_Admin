import AuthLayout from "@/components/auth-layout";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <AuthLayout>
      <AuthForm type="login" />
    </AuthLayout>
  );
}
