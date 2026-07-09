"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthActionResult } from "../types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export async function loginUser(formData: FormData): Promise<AuthActionResult> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  try {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
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

export async function registerUser(formData: FormData): Promise<AuthActionResult> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  try {
    const response = await fetch(`${API_BASE_URL}/api/signup`, {
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
      error?: string;
    };

    if (!response.ok) {
      return {
        success: false,
        error: payload.error ?? "Sign up failed",
      };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      error: "Unable to sign up right now",
    };
  }
}

export async function logoutUser(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("linkr_token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });

  redirect("/login");
}
