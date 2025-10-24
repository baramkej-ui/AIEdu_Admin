'use client';

import AuthLayout from "@/components/auth-layout";
import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return (
    <AuthLayout>
      <AuthForm type="signup" />
    </AuthLayout>
  );
}
