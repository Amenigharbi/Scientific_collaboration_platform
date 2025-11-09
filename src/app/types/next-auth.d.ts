import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      institution?: string;
      orcid?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    institution: string;
    orcid?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    institution?: string;
    orcid?: string;
  }
}