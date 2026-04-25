import AuthRegisterForm from "@/components/AuthRegisterForm";

export const metadata = {
  title: "Register | CivicEye",
  description: "Create your CivicEye citizen account and start reporting civic issues.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6 py-12">
      <AuthRegisterForm />
    </div>
  );
}
