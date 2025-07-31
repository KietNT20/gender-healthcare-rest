import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { ChatCleanupSchedulerService } from './chat-cleanup-scheduler.service';

async function testCleanup() {
    console.log('🧪 Testing chat cleanup functionality...');

    const app = await NestFactory.createApplicationContext(AppModule);

    try {
        const cleanupScheduler = app.get(ChatCleanupSchedulerService);

        console.log('📋 Running manual cleanup test...');

        // Test manual cleanup
        const result = await cleanupScheduler.runManualCleanup(2);

        console.log('✅ Test completed successfully!');
        console.log('📊 Results:');
        console.log(`   - Redis rooms cleaned: ${result.redisCleanupCount}`);
        console.log(
            `   - Questions archived: ${result.archivedQuestionsCount}`,
        );
        console.log(
            `   - Standalone questions cleaned: ${result.standaloneQuestionsCount}`,
        );

        if (
            result.redisCleanupCount > 0 ||
            result.archivedQuestionsCount > 0 ||
            result.standaloneQuestionsCount > 0
        ) {
            console.log('🎉 Cleanup found and processed old data!');
        } else {
            console.log(
                'ℹ️  No old data found to cleanup (this is normal if no old data exists)',
            );
        }
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    } finally {
        await app.close();
    }
}

// Run the test if called directly
if (require.main === module) {
    testCleanup()
        .then(() => {
            console.log('✅ Test script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Test script failed:', error);
            process.exit(1);
        });
}

export { testCleanup };
