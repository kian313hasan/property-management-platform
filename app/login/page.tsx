import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <div className="w-full rounded-3xl bg-white p-8 shadow-2xl">
          <div className="mb-8 text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-white">PM</div><h1 className="text-2xl font-bold">تسجيل الدخول</h1><p className="mt-2 text-sm text-slate-500">منصة إدارة العقارات</p></div>
          <LoginForm />
          <p className="mt-6 text-center text-sm text-slate-500">ليس لديك حساب؟ <a href="/register" className="font-semibold text-slate-900 hover:underline">إنشاء حساب</a></p>
        </div>
      </div>
    </main>
  );
}
