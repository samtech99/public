

const { MongoClient } = require('mongodb');


async function cleanUpDatabase() {
    console.log(``);
    console.log(`.........................................`);
    console.log(`Prepare for TestCases - Cleanup Database:`);

    const client = new MongoClient(process.env.MONGODB_STRING);

    try {
        await client.connect();
        const database = client.db('piazza');

        // Fetch all collection names in the database
        const collections = await database.listCollections().toArray();
        const collectionNames = collections.map(col => col.name);

        // Drop each collection
        for (const name of collectionNames) {
            await database.collection(name).drop();
        }

        console.log('Complete database cleanup successful, all collections dropped.');
    } catch (error) {
        console.error('Complete database cleanup failed:', error);
    } finally {
        await client.close();
    }
}

cleanUpDatabase();
