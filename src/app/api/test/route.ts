// app/api/test/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../lib/mongodb';

export async function GET() {
  try {
    const { conn } = await connectToDatabase();
    
    // Vérification que la connexion et la db sont définies
    if (!conn || !conn.connection.db) {
      throw new Error('Database connection is not established');
    }
    
    const db = conn.connection.db;
    
    // Test supplémentaire : créer une collection test
    const testCollection = db.collection('test_connection');
    await testCollection.insertOne({ 
      test: true, 
      timestamp: new Date() 
    });
    
    const count = await testCollection.countDocuments();
    
    return NextResponse.json({ 
      success: true,
      message: '✅ MongoDB est connecté et fonctionne!',
      database: db.databaseName,
      testDocuments: count,
      connection: {
        host: conn.connection.host,
        port: conn.connection.port,
        name: conn.connection.name
      }
    });
    
  } catch (error: any) {
    console.error('MongoDB test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '❌ Erreur de connexion MongoDB',
        message: error.message,
        solution: 'Vérifiez que MongoDB est démarré (mongod)'
      },
      { status: 500 }
    );
  }
}