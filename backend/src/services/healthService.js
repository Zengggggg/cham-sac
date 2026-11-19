import mongoose from 'mongoose';

export const getReadiness = async ({ connection = mongoose.connection, commit = process.env.RENDER_GIT_COMMIT } = {}) => {
    if (connection.readyState !== 1 || !connection.db) {
        throw new Error('Database is not connected');
    }
    await connection.db.command({ ping: 1 }, { timeoutMS: 3000 });
    return {
        status: 'ready',
        commitSha: /^[a-f0-9]{40}$/.test(commit || '') ? commit : null
    };
};
