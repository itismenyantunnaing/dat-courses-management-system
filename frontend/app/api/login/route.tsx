import { NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(
      `${API_BASE_URL}/security/api/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: body.staff_Id,
          password: body.password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, {
        status: response.status,
      });
    }

    const res = NextResponse.json({
      success: true,
      userId: data.userId,
      token: data.token,
    });

    res.cookies.set("auth_session", JSON.stringify({
      token: data.token,
      userId: data.userId,
    }), {
      httpOnly: true,
      secure: false,      // <-- FOR TESTING
      sameSite: "lax",
      path: "/",
    });

    return res;
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        message: "Network error",
      },
      {
        status: 500,
      }
    );
  }
}