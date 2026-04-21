import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  },
})

export const config = {
  matcher: [
    "/learn/:path*",
    "/mistakes/:path*",
    "/problems/:path*",
    "/settings/:path*",
  ],
}
