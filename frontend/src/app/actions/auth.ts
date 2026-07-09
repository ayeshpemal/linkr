"use server";

import { cookies } from "next/headers";

type AuthActionResult =
  | { success: true }
  | { success: false; error: string };

export async function loginUser(
  formData: FormData,
): Promise<AuthActionResult> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  try {
    const response = await fetch("http://localhost:8080/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
      cache: "no-store",
    });

    const payload = (await response.json()) as {
      token?: string;
      error?: string;
    };

    if (!response.ok || !payload.token) {
      return {
        success: false,
        error: payload.error ?? "Login failed",
      };
    }

    const cookieStore = await cookies();
    cookieStore.set("linkr_token", payload.token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      path: "/",
    });

    return { success: true };
  } catch {
    return {
      success: false,
      error: "Unable to log in right now",
    };
  }
}
