import { NextResponse } from "next/server";

export const config = {
  matcher: "/integrations/:path*",
};

export function middleware(request) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-createxyz-project-id", "6ed00f95-d514-4c10-a686-c8aab2d0b2af");
  requestHeaders.set("x-createxyz-project-group-id", "11f00c35-afb8-4f02-97d4-f74028b72aea");


  request.nextUrl.href = `https://www.create.xyz/${request.nextUrl.pathname}`;

  return NextResponse.rewrite(request.nextUrl, {
    request: {
      headers: requestHeaders,
    },
  });
}