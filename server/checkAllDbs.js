import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://admin:Admin12345@cluster0.u8en29i.mongodb.net/?retryWrites=true&w=majority';

async function listAll() {
  const client = new MongoClient(uri);
  await client.connect();
  const adminDb = client.db().admin();
  const dbs = await adminDb.listDatabases();
  
  for (let dbInfo of dbs.databases) {
    console.log(`\n--- DB: ${dbInfo.name} ---`);
    const db = client.db(dbInfo.name);
    const collections = await db.listCollections().toArray();
    for (let c of collections) {
      if (c.name === 'users') {
        const count = await db.collection('users').countDocuments();
        console.log(`Found 'users' collection with ${count} documents`);
        const users = await db.collection('users').find({}).toArray();
        console.log(users.map(u => u.username));
      }
    }
  }
  await client.close();
}

listAll().catch(console.error);
