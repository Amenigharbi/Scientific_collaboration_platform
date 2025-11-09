import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { connectToDatabase } from '@/app/lib/mongodb';
import User from '@/app/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id)
      .select('-password -emailVerified -__v')
      .exec();

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const userObj = user.toObject();

    const profile = {
      _id: userObj._id?.toString() || session.user.id,
      name: userObj.name || '',
      email: userObj.email || '',
      orcid: userObj.orcid || '',
      institution: userObj.institution || '',
      avatar: userObj.avatar || null,
      specialization: userObj.specialization || '',
      bio: userObj.bio || '',
      website: userObj.website || '',
      location: userObj.location || '',
      joinedAt: userObj.createdAt ? userObj.createdAt.toISOString() : new Date().toISOString(),
      lastActive: userObj.updatedAt ? userObj.updatedAt.toISOString() : new Date().toISOString(),
      stats: {
        projectsCreated: userObj.stats?.projectsCreated || 0,
        projectsCollaborated: userObj.stats?.projectsCollaborated || 0,
        documentsUploaded: userObj.stats?.documentsUploaded || 0,
        totalContributions: userObj.stats?.totalContributions || 0,
      }
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('PUT /api/user/profile - Unauthorized: No session or user ID');
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    console.log('PUT /api/user/profile - Request body:', body);

    const { name, institution, specialization, bio, website, location, orcid } = body;

    await connectToDatabase();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Le nom est obligatoire' },
        { status: 400 }
      );
    }

    if (!institution?.trim()) {
      return NextResponse.json(
        { error: 'L\'institution est obligatoire' },
        { status: 400 }
      );
    }

    const updateData: any = {
      name: name.trim(),
      institution: institution.trim(),
      updatedAt: new Date(),
    };

    if (specialization !== undefined) updateData.specialization = specialization.trim();
    if (bio !== undefined) updateData.bio = bio.trim();
    if (website !== undefined) updateData.website = website.trim();
    if (location !== undefined) updateData.location = location.trim();
    if (orcid !== undefined) updateData.orcid = orcid.trim();

    console.log('PUT /api/user/profile - Update data:', updateData);

    try {
      const updatedUser = await User.findByIdAndUpdate(
        session.user.id,
        updateData,
        { 
          new: true, 
          runValidators: true,
          context: 'query' 
        }
      ).select('-password -emailVerified -__v');

      if (!updatedUser) {
        console.log('PUT /api/user/profile - User not found');
        return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
      }

      const userObj = updatedUser.toObject();

      const profile = {
        _id: userObj._id?.toString() || session.user.id,
        name: userObj.name,
        email: userObj.email,
        orcid: userObj.orcid || '',
        institution: userObj.institution,
        avatar: userObj.avatar,
        specialization: userObj.specialization || '',
        bio: userObj.bio || '',
        website: userObj.website || '',
        location: userObj.location || '',
        joinedAt: userObj.createdAt ? userObj.createdAt.toISOString() : new Date().toISOString(),
        lastActive: userObj.updatedAt ? userObj.updatedAt.toISOString() : new Date().toISOString(),
        stats: {
          projectsCreated: userObj.stats?.projectsCreated || 0,
          projectsCollaborated: userObj.stats?.projectsCollaborated || 0,
          documentsUploaded: userObj.stats?.documentsUploaded || 0,
          totalContributions: userObj.stats?.totalContributions || 0,
        }
      };

      console.log('PUT /api/user/profile - Success, returning profile');
      return NextResponse.json(profile);

    } catch (validationError: any) {
      console.error('PUT /api/user/profile - Validation error:', validationError);
      
      if (validationError.name === 'ValidationError') {
        const errors = Object.values(validationError.errors).map((err: any) => err.message);
        return NextResponse.json(
          { 
            error: 'Erreur de validation', 
            details: errors 
          },
          { status: 400 }
        );
      }
      
      throw validationError;
    }

  } catch (error: any) {
    console.error('PUT /api/user/profile - Error:', error);
    
    if (error.name === 'CastError') {
      return NextResponse.json(
        { error: 'ID utilisateur invalide' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}