import NextAuth from "next-auth";
import { authOptions } from "./auth-options";

// Create the handler using the imported authOptions
const handler = NextAuth(authOptions);

// Only export the HTTP method handlers
export { handler as GET, handler as POST };