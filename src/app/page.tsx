'use client';
import { signIn, getSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';
import { FiMail, FiLock, FiUser, FiAward, FiBook, FiUsers, FiTrendingUp, FiHome } from 'react-icons/fi';

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    orcid: '',
    institution: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkSession();
  }, [router]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError('');
      await signIn('google', { 
        callbackUrl: '/dashboard',
        redirect: true 
      });
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError('Erreur lors de la connexion avec Google');
      setIsLoading(false);
    }
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (isSignUp) {
      if (formData.password !== formData.confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            orcid: formData.orcid,
            institution: formData.institution,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors de la création du compte');
        }

        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          setError('Compte créé mais erreur de connexion automatique');
          setIsLoading(false);
          return;
        }

        router.push('/dashboard');
        
      } catch (error: any) {
        console.error('Registration error:', error);
        setError(error.message || 'Erreur lors de la création du compte');
        setIsLoading(false);
      }
    } else {
      // Mode connexion
      try {
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          setError('Email ou mot de passe incorrect');
          setIsLoading(false);
          return;
        }

        router.push('/dashboard');
        
      } catch (error) {
        console.error('Sign in error:', error);
        setError('Erreur lors de la connexion');
        setIsLoading(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Section gauche - Présentation */}
        <div className="text-center lg:text-left space-y-8">
          <div className="flex items-center justify-center lg:justify-start space-x-4">
            <div className="w-14 h-14 bg-linear-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FiAward className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">ResearchHub</h1>
              <p className="text-slate-600 text-sm">Plateforme de Recherche Collaborative</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
              Collaborez, 
              <span className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> innovez</span>, 
              publiez
            </h2>
            
            <p className="text-xl text-slate-600 leading-relaxed max-w-lg mx-auto lg:mx-0">
              Rejoignez une communauté de chercheurs passionnés. 
              Gérez vos projets, collaborez en temps réel et faites avancer la science.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl">
            <div className="flex items-start space-x-3 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <FiBook className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Gestion de Projets</h3>
                <p className="text-sm text-slate-600 mt-1">Organisez vos recherches efficacement</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                <FiUsers className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Collaboration</h3>
                <p className="text-sm text-slate-600 mt-1">Travaillez avec des chercheurs du monde entier</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                <FiTrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Suivi Avancé</h3>
                <p className="text-sm text-slate-600 mt-1">Mesurez l'impact de vos recherches</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                <FiAward className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">ORCID Intégré</h3>
                <p className="text-sm text-slate-600 mt-1">Liez votre identifiant chercheur</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section droite - Formulaire */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              {isSignUp ? 'Commencez votre aventure' : 'Content de vous revoir'}
            </h3>
            <p className="text-slate-600">
              {isSignUp 
                ? 'Rejoignez notre communauté de chercheurs' 
                : 'Connectez-vous à votre espace de recherche'
              }
            </p>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleCredentialsSignIn}>
            {isSignUp && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                    Nom complet *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-slate-400"
                      placeholder="Dr. Jean Dupont"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="orcid" className="block text-sm font-medium text-slate-700 mb-2">
                      ORCID ID
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiAward className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        id="orcid"
                        name="orcid"
                        type="text"
                        value={formData.orcid}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-slate-400"
                        placeholder="0000-0000-0000-0000"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="institution" className="block text-sm font-medium text-slate-700 mb-2">
                      Institution *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiHome className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        id="institution"
                        name="institution"
                        type="text"
                        required
                        value={formData.institution}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-slate-400"
                        placeholder="Université Paris-Saclay"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email professionnel *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-slate-400"
                  placeholder="jean.dupont@research.fr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Mot de passe {isSignUp && '*'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required={isSignUp}
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-slate-400"
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
                {isSignUp && (
                  <p className="text-xs text-slate-500 mt-1">Minimum 6 caractères</p>
                )}
              </div>

              {isSignUp && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                    Confirmation *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-slate-400"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-linear-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>
                    {isSignUp ? 'Création du compte...' : 'Connexion...'}
                  </span>
                </div>
              ) : (
                isSignUp ? 'Créer mon compte chercheur' : 'Se connecter'
              )}
            </button>
          </form>

          {/* Séparateur */}
          <div className="my-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500 font-medium">
                  Ou continuer avec
                </span>
              </div>
            </div>
          </div>

          {/* Bouton Google */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex justify-center items-center py-4 px-6 border border-slate-300 rounded-xl text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
          >
            {isLoading ? (
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-medium">Connexion en cours...</span>
              </div>
            ) : (
              <>
                <FcGoogle className="w-6 h-6 mr-3" />
                <span className="font-medium">Continuer avec Google</span>
              </>
            )}
          </button>

          {/* Basculement connexion/inscription */}
          <div className="text-center mt-8 pt-6 border-t border-slate-200">
            <p className="text-slate-600">
              {isSignUp ? 'Déjà membre ?' : 'Nouveau sur ResearchHub ?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setFormData({
                    name: '',
                    email: '',
                    orcid: '',
                    institution: '',
                    password: '',
                    confirmPassword: ''
                  });
                }}
                className="text-blue-600 hover:text-blue-500 font-semibold transition-colors"
              >
                {isSignUp ? 'Se connecter' : 'Créer un compte'}
              </button>
            </p>
          </div>

          {/* Footer sécurisé */}
          <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-center space-x-2 text-sm text-slate-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Connexion sécurisée • Respect de votre vie privée</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}