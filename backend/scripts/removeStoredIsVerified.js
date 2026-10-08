import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const APPLY_FLAG = '--apply';
const shouldApply = process.argv.includes(APPLY_FLAG);

function missingVerifiedAtFilter() {
  return {
    $or: [
      { emailVerifiedAt: { $exists: false } },
      { emailVerifiedAt: null },
      { emailVerifiedAt: { $not: { $type: 'date' } } }
    ]
  };
}

async function getAudit(users) {
  const missingVerifiedAt = missingVerifiedAtFilter();

  const [
    totalUsers,
    storedFieldCount,
    storedTrueCount,
    storedFalseCount,
    verifiedAtCount,
    riskyLegacyCount,
    staleFalseCount
  ] = await Promise.all([
    users.countDocuments({}),
    users.countDocuments({ isVerified: { $exists: true } }),
    users.countDocuments({ isVerified: true }),
    users.countDocuments({ isVerified: false }),
    users.countDocuments({ emailVerifiedAt: { $type: 'date' } }),
    users.countDocuments({ isVerified: true, ...missingVerifiedAt }),
    users.countDocuments({
      isVerified: false,
      emailVerifiedAt: { $type: 'date' }
    })
  ]);

  return {
    totalUsers,
    storedFieldCount,
    storedTrueCount,
    storedFalseCount,
    verifiedAtCount,
    riskyLegacyCount,
    staleFalseCount
  };
}

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(mongoUri);
  const users = mongoose.connection.collection('users');
  const before = await getAudit(users);

  console.log('isVerified migration audit:', before);

  if (!shouldApply) {
    console.log(`Dry run only. Re-run with ${APPLY_FLAG} to remove the stored field.`);
    return;
  }

  if (before.riskyLegacyCount > 0) {
    throw new Error(
      `Migration stopped: ${before.riskyLegacyCount} user(s) have isVerified=true without a valid emailVerifiedAt`
    );
  }

  const result = await users.updateMany(
    { isVerified: { $exists: true } },
    { $unset: { isVerified: '' } }
  );
  const after = await getAudit(users);

  console.log('Removed stored isVerified:', {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount
  });
  console.log('Post-migration audit:', after);
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
