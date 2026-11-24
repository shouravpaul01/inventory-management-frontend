import { redirect } from "next/navigation";

// The middleware sends signed-in users to /dashboard and everyone else to /login.
// This is only a fallback in case the middleware is bypassed.
export default function RootPage() {
  redirect("/dashboard");
}
