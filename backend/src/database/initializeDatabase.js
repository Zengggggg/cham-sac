import { collectionDefinitions } from './collectionDefinitions.js';

const collectionExists = async (database, collectionName) => {
    const collections = await database
        .listCollections({ name: collectionName }, { nameOnly: true })
        .toArray();
    return collections.length > 0;
};

const ensureCollection = async (database, definition) => {
    if (await collectionExists(database, definition.name)) {
        await database.command({
            collMod: definition.name,
            ...definition.options
        });
    } else {
        await database.createCollection(definition.name, definition.options);
    }

    const collection = database.collection(definition.name);
    for (const index of definition.indexes) {
        try {
            await collection.createIndex(index.key, index.options);
        } catch (error) {
            throw new Error(
                `Không thể tạo index ${index.options.name} cho ${definition.name}: ${error.message}`,
                { cause: error }
            );
        }
    }
};

export const initializeDatabase = async (database) => {
    for (const definition of collectionDefinitions) {
        await ensureCollection(database, definition);
    }

    return collectionDefinitions.map(({ name }) => name);
};
