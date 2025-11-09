import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import clientPromise from '@/app/lib/mongodb-client';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, orcid, institution } = await request.json();

    if (!name || !email || !password || !institution) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 409 }
      );
    }

    if (orcid) {
      const existingOrcid = await db.collection('users').findOne({ orcid });
      if (existingOrcid) {
        return NextResponse.json(
          { error: 'Cet ORCID est déjà associé à un compte' },
          { status: 409 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = {
      _id: new ObjectId(),
      name,
      email,
      password: hashedPassword,
      orcid: orcid || null,
      institution,
      role: 'researcher',
      emailVerified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('users').insertOne(user);

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { 
        message: 'Compte créé avec succès',
        user: userWithoutPassword 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error in registration:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}