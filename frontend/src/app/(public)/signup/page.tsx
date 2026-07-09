"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";

import { registerUser } from "@/app/actions/auth";

export default function SignupPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await registerUser(formData);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Account created successfully");
      router.push("/login");
    });
  }

  return (
    <>
      <Toaster position="top-right" />
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,#fef3c7_0%,#fff7ed_35%,#fff_70%)] px-6 py-16 text-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(249,115,22,0.08),transparent_35%,rgba(14,165,233,0.08))]" />
        <div className="relative w-full max-w-md rounded-4xl border border-white/70 bg-white/85 p-8 shadow-[0_30px_120px_rgba(15,23,42,0.18)] backdrop-blur">
          <div className="mb-8 space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-orange-600">
              Linkr
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
              Create an Account
            </h1>
            <p className="text-sm leading-6 text-slate-600">
              Start shortening links, tracking engagement, and managing your
              campaigns in one place.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Username
              </span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Choose a username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                disabled={isPending}
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Password
              </span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isPending}
                required
              />
            </label>

            <button
              className="flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              type="submit"
              disabled={isPending}
            >
              {isPending ? "Signing up..." : "Sign Up"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
