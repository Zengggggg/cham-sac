import { collectionDefinitions } from './collectionDefinitions.js';

const INDEX_OPTION_KEYS = [
    'unique',
    'sparse',
    'expireAfterSeconds',
    'partialFilterExpression',
    'collation',
    'hidden',
    'wildcardProjection',
    'weights',
    'default_language',
    'language_override',
    'textIndexVersion',
    '2dsphereIndexVersion',
    'bits',
    'min',
    'max',
    'bucketSize',
    'storageEngine'
];

const stableValue = (value) => {
    if (Array.isArray(value)) return value.map(stableValue);
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.keys(value).sort().map((key) => [key, stableValue(value[key])])
        );
    }
    return value;
};

const semanticIndexOptions = (options) => Object.fromEntries(
    INDEX_OPTION_KEYS
        .filter((key) => options[key] !== undefined && options[key] !== false)
        .map((key) => [key, stableValue(options[key])])
);

export const isEquivalentIndex = (existingIndex, definition) => (
    JSON.stringify(Object.entries(existingIndex.key || {}))
        === JSON.stringify(Object.entries(definition.key || {}))
    && JSON.stringify(semanticIndexOptions(existingIndex))
        === JSON.stringify(semanticIndexOptions(definition.options || {}))
);

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
    const existingIndexes = await collection.listIndexes().toArray();
    for (const index of definition.indexes) {
        if (existingIndexes.some((existingIndex) => isEquivalentIndex(existingIndex, index))) {
            continue;
        }

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
