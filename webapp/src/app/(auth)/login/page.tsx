import AuthLoginForm from "@/components/AuthLoginForm";

export const metadata = {
  title: "Sign In | CivicEye",
  description: "Sign into your CivicEye account to report and track civic issues.",
};

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6 py-12">
      <AuthLoginForm />
    </div>
  );
}
