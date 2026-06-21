import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://admin:Admin12345@cluster0.u8en29i.mongodb.net/test?retryWrites=true&w=majority';

async function listCollections() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const collections = await db.listCollections().toArray();
  for (let c of collections) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`Collection: ${c.name}, Count: ${count}`);
    if (c.name.toLowerCase().includes('user')) {
      const docs = await db.collection(c.name).find({}).toArray();
      console.log(`Docs in ${c.name}:`, docs);
    }
  }
  await client.close();
}

listCollections().catch(console.error);
