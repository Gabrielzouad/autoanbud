#!/usr/bin/env -S npx tsx
import * as Sentry from '@sentry/nextjs';

// Initialize Sentry
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 1.0,
});

async function testSentry() {
  console.log('Testing Sentry connection...');
  console.log('DSN:', process.env.NEXT_PUBLIC_SENTRY_DSN);

  try {
    // Test 1: Capture a message
    Sentry.captureMessage('🧪 Sentry test message - Assignment Analytics', 'info');
    console.log('✓ Sent test message to Sentry');

    // Test 2: Capture an exception
    const testError = new Error('🧪 Test error from AutoAnbud - Sentry connection verification');
    Sentry.captureException(testError);
    console.log('✓ Sent test error to Sentry');

    // Test 3: Capture an analytics event
    Sentry.captureMessage('🧪 Test analytics event: request.assigned', {
      level: 'info',
      tags: {
        category: 'analytics',
      },
      extra: {
        requestId: 'test-request-123',
        dealershipId: 'test-dealership-456',
      },
    });
    console.log('✓ Sent test analytics event to Sentry');

    // Test 4: Capture Sentry metrics
    Sentry.metrics.count('moderation.test_count', 1);
    Sentry.metrics.gauge('moderation.test_open_queue', 2);
    Sentry.metrics.distribution('moderation.test_resolution_hours', 1.5, {
      unit: 'hour',
    });
    console.log('✓ Sent test metrics to Sentry');

    // Give Sentry time to flush events
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('\n✅ Sentry integration test complete!');
    console.log('\nCheck your Sentry dashboard at:');
    console.log('https://sentry.io/organizations/zouad-media/issues/?project=autoanbud');
    console.log('\nYou should see 3 events and 3 metrics:');
    console.log('1. A message event');
    console.log('2. An exception event');
    console.log('3. An analytics event with tags');

    process.exit(0);
  } catch (error) {
    console.error('❌ Sentry test failed:', error);
    process.exit(1);
  }
}

testSentry();
