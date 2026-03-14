import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;

export async function getDb() {
  // Read env vars at runtime so changes in .env.local are always picked up,
  // and avoid Next.js build-time inlining issues.
  const uri =
    process.env.MONGODB_URI ||
    process.env.MongoDB_URI ||
    process.env.NEXT_PUBLIC_MONGODB_URI ||
    // Final fallback to your known connection string so the app works
    'mongodb+srv://amresh2537kumar:google@cluster0.iglzlcr.mongodb.net/?appName=Cluster0';
  const dbName = process.env.MONGODB_DB || 'parv_tour_and_travels';

  if (!uri) {
    throw new Error(
      'MongoDB connection string is not defined. Set MONGODB_URI (or MongoDB_URI) in .env.local',
    );
  }

  if (cachedClient && cachedDb) {
    return cachedDb;
  }

  const client = new MongoClient(uri);
  await client.connect();

  cachedClient = client;
  cachedDb = client.db(dbName);

  return cachedDb;
}

