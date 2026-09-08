import { MongoClient } from 'mongodb';
import dns from 'node:dns';

let cachedClient = null;
let cachedDb = null;
let connecting = null;

async function prepareDns(uri) {
  if (!uri.startsWith('mongodb+srv://')) return;
  const hostname = new URL(uri).hostname;
  const configured = process.env.MONGODB_DNS_SERVERS;
  if (configured) dns.setServers(configured.split(',').map(server => server.trim()).filter(Boolean));
  try {
    await dns.promises.resolveSrv(`_mongodb._tcp.${hostname}`);
  } catch (error) {
    // Some local Windows environments use a loopback resolver that is not running.
    const localResolver = dns.getServers().every(server => server === '127.0.0.1' || server === '::1');
    if (configured || !localResolver || !['ECONNREFUSED', 'ETIMEOUT'].includes(error.code)) throw error;
    dns.setServers(['1.1.1.1', '8.8.8.8']);
    await dns.promises.resolveSrv(`_mongodb._tcp.${hostname}`);
  }
}

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

  if (!connecting) {
    connecting = (async () => {
      await prepareDns(uri);
      const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
      try {
        await client.connect();
        cachedClient = client;
        cachedDb = client.db(dbName);
        return cachedDb;
      } catch (error) {
        await client.close();
        throw error;
      }
    })().finally(() => { connecting = null; });
  }
  return connecting;
}

