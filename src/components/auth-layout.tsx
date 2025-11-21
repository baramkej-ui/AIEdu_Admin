import { BookOpenCheck } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <BookOpenCheck className="mb-4 h-12 w-12 text-primary" />
          <h1 className="text-3xl font-bold text-primary">AIEdu Platform</h1>
          <p className="text-muted-foreground">Smart Learning with AI</p>
        </div>
        {children}
      </div>
    </main>
  );
}
