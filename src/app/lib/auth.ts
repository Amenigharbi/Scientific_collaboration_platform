import { NextAuthOptions } from "next-auth";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "./mongodb-client";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const client = await clientPromise;
          const db = client.db();
          
          const user = await db.collection('users').findOne({ 
            email: credentials.email 
          });

          if (!user) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            institution: user.institution,
            orcid: user.orcid,
          };
        } catch (error) {
          console.error('Error in credentials authorization:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    session: async ({ session, token }) => {
      const userSession = session as any;
      if (userSession?.user) {
        userSession.user.id = token.sub!;
        userSession.user.role = token.role;
        userSession.user.institution = token.institution;
        userSession.user.orcid = token.orcid;
      }
      return userSession;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = (user as any).role;
        token.institution = (user as any).institution;
        token.orcid = (user as any).orcid;
      }
      return token;
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
};