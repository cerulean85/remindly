import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  },
})

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/learn/:path*",
    "/retrieval/:path*",
    "/mistakes/:path*",
    "/problems/:path*",
    "/notes/:path*",
    "/settings/:path*",
  ],
}
