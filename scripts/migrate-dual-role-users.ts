/**
 * Migration script to enforce strict buyer/dealer separation
 *
 * This script identifies users who have both buyer requests AND dealerships,
 * and assigns them to the 'dealer' role as per business requirements.
 *
 * Run with: npx tsx scripts/migrate-dual-role-users.ts
 */

import { db, userProfiles, buyerRequests, dealerships } from '../src/db';
import { eq, sql, and } from 'drizzle-orm';

async function migrateDualRoleUsers() {
  console.log('🔍 Starting migration: Identifying dual-role users...\n');

  try {
    // Find all users who have BOTH buyer requests AND dealerships
    const dualRoleUsers = await db
      .select({
        userId: userProfiles.userId,
        currentRole: userProfiles.role,
        buyerRequestCount: sql<number>`COUNT(DISTINCT ${buyerRequests.id})`,
        dealershipCount: sql<number>`COUNT(DISTINCT ${dealerships.id})`,
      })
      .from(userProfiles)
      .leftJoin(buyerRequests, eq(buyerRequests.buyerId, userProfiles.userId))
      .leftJoin(dealerships, eq(dealerships.ownerId, userProfiles.userId))
      .groupBy(userProfiles.userId, userProfiles.role)
      .having(
        and(
          sql`COUNT(DISTINCT ${buyerRequests.id}) > 0`,
          sql`COUNT(DISTINCT ${dealerships.id}) > 0`,
        ),
      );

    if (dualRoleUsers.length === 0) {
      console.log('✅ No dual-role users found. Database is already clean!');
      return;
    }

    console.log(`⚠️  Found ${dualRoleUsers.length} dual-role user(s):\n`);

    // Display users and their current state
    dualRoleUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. User ID: ${user.userId}`);
      console.log(`     Current Role: ${user.currentRole}`);
      console.log(`     Buyer Requests: ${user.buyerRequestCount}`);
      console.log(`     Dealerships: ${user.dealershipCount}`);
      console.log('');
    });

    // Update all dual-role users to 'dealer'
    console.log('🔄 Updating dual-role users to "dealer" role...\n');

    const userIds = dualRoleUsers.map((u) => u.userId);

    for (const userId of userIds) {
      await db
        .update(userProfiles)
        .set({
          role: 'dealer',
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, userId));

      console.log(`  ✓ Updated user ${userId} to role="dealer"`);
    }

    console.log(`\n✅ Successfully migrated ${userIds.length} user(s) to dealer role`);
    console.log('\n📋 Summary:');
    console.log(`   - Users updated: ${userIds.length}`);
    console.log(`   - New role: dealer`);
    console.log(`   - Their buyer requests remain in database but will be hidden`);
    console.log(`   - Their dealerships remain active`);

    // Optional: Verify the migration
    console.log('\n🔍 Verifying migration...');

    const remainingDualRole = await db
      .select({
        userId: userProfiles.userId,
        role: userProfiles.role,
      })
      .from(userProfiles)
      .leftJoin(buyerRequests, eq(buyerRequests.buyerId, userProfiles.userId))
      .leftJoin(dealerships, eq(dealerships.ownerId, userProfiles.userId))
      .groupBy(userProfiles.userId, userProfiles.role)
      .having(
        and(
          sql`COUNT(DISTINCT ${buyerRequests.id}) > 0`,
          sql`COUNT(DISTINCT ${dealerships.id}) > 0`,
          sql`${userProfiles.role} != 'dealer'`,
        ),
      );

    if (remainingDualRole.length === 0) {
      console.log('✅ Verification passed! All dual-role users are now dealers.');
    } else {
      console.log(
        `⚠️  Warning: ${remainingDualRole.length} dual-role users still exist with non-dealer role`,
      );
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
migrateDualRoleUsers()
  .then(() => {
    console.log('\n✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed with error:', error);
    process.exit(1);
  });
