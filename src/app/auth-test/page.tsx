// app/auth-test/page.tsx
'use client';

import { useSession, signIn, signOut } from "next-auth/react";

export default function AuthTest() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="p-8 max-w-md mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test d'Authentification</h1>
      
      {session ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-100 rounded-lg border border-green-200">
            <h2 className="font-semibold text-green-800">✅ Connecté en tant que :</h2>
            <div className="mt-2 space-y-1 text-green-700">
              <p><strong>Nom :</strong> {session.user?.name || "Non spécifié"}</p>
              <p><strong>Email :</strong> {session.user?.email}</p>
              <p><strong>ID :</strong> {session.user?.id}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-yellow-100 rounded-lg border border-yellow-200">
            <p className="text-yellow-800">❌ Non connecté</p>
          </div>
          <button
            onClick={() => signIn("google")}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
          >
            Se connecter avec Google
          </button>
        </div>
      )}
    </div>
  );
}