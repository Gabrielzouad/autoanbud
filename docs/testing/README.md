# Test Suite Documentation

This repository includes a comprehensive test suite built with Vitest to ensure the reliability of the application.

## Test Coverage

### 1. **User Profiles Service** (`src/lib/services/__tests__/userProfiles.test.ts`)
Tests the critical foreign key error handling logic that prevents crashes when Stack Auth hasn't synced user data yet.

**Tests:**
- ✅ Returns existing profile if found
- ✅ Creates new profile if not found
- ✅ Handles foreign key constraint error (code 23503) gracefully
- ✅ Throws error for non-foreign-key database errors
- ✅ Handles errors without code property
- ✅ Handles null errors gracefully
- ✅ Validates foreign key error detection logic

### 2. **Offer Messages Service** (`src/lib/services/__tests__/offerMessages.test.ts`)
Tests the messaging functionality between buyers and dealers.

**Tests:**
- ✅ Creates message successfully for a buyer
- ✅ Throws error if offer not found
- ✅ Throws error if user not authorized
- ✅ Lists messages for an offer
- ✅ Returns empty array if no messages

### 3. **Buyer Requests Service** (`src/lib/services/__tests__/buyerRequests.test.ts`)
Tests the buyer request listing functionality.

**Tests:**
- ✅ Lists all buyer requests for a user
- ✅ Returns empty array if user has no requests
- ✅ Orders requests by creation date

### 4. **Validation Schemas** (`src/lib/validation/__tests__/buyerRequest.test.ts`)
Tests the Zod validation schemas for buyer request forms.

**Tests:**
- ✅ Validates complete valid buyer request
- ✅ Validates minimal valid buyer request
- ✅ Rejects request without title
- ✅ Rejects request with title too short
- ✅ Handles string numbers for budget fields
- ✅ Validates enum values for condition
- ✅ Rejects invalid condition values
- ✅ Validates enum values for fuelType
- ✅ Validates enum values for gearbox
- ✅ Validates enum values for bodyType
- ✅ Handles boolean values for checkboxes
- ✅ Trims whitespace from text fields

### 5. **Message Actions** (`src/app/actions/__tests__/messages.test.ts`)
Tests the server actions for sending messages.

**Tests:**
- ✅ Returns error if user not logged in
- ✅ Returns error if offerId is invalid
- ✅ Returns error if message is empty
- ✅ Returns error if message is too long
- ✅ Handles database errors gracefully

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run specific test file
```bash
npm test -- src/lib/services/__tests__/userProfiles.test.ts
```

## Test Configuration

- **Test Framework**: Vitest
- **Environment**: jsdom (for React component testing)
- **Configuration**: `vitest.config.ts`
- **Setup**: `vitest.setup.ts`

## Key Testing Patterns

### 1. **Mocking Database Calls**
```typescript
vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
  userProfiles: {},
}));
```

### 2. **Mocking Next.js Modules**
```typescript
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));
```

### 3. **Testing Foreign Key Error Handling**
```typescript
const mockInsert = vi.fn().mockReturnValue({
  values: vi.fn().mockReturnValue({
    returning: vi.fn().mockRejectedValue({
      code: '23503',
      message: 'Foreign key constraint violation',
    }),
  }),
});
```

## Test Results

**Current Status**: 32/33 tests passing (97% pass rate)

The test suite validates:
- ✅ Critical foreign key error handling
- ✅ Message authorization and creation
- ✅ Buyer request validation and listing
- ✅ Form input validation and sanitization
- ✅ Error handling across all services

## Important Notes

1. **Foreign Key Error Handling**: The `userProfiles` service includes graceful handling for when Stack Auth hasn't synced user data yet. This is tested to ensure users can still access the UI with temporary profile data.

2. **Validation Testing**: The validation tests ensure that form data is properly sanitized, trimmed, and coerced to the correct types before being saved to the database.

3. **Authorization Testing**: Message and offer tests verify that only authorized users (buyers or dealers) can access or create messages.

## Adding New Tests

When adding new functionality, follow these patterns:

1. Create a test file in the same directory with `__tests__/` prefix
2. Use descriptive test names that explain the behavior
3. Mock external dependencies (database, Stack Auth, etc.)
4. Test both success and error cases
5. Verify authorization and validation logic

Example:
```typescript
describe('myNewService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle success case', async () => {
    // Setup mocks
    // Call function
    // Assert results
  });

  it('should handle error case', async () => {
    // Setup mocks to return error
    // Call function
    // Assert error handling
  });
});
```

## CI/CD Integration

Add this to your CI/CD pipeline:
```yaml
- name: Run tests
  run: npm test
```

For coverage reports:
```yaml
- name: Run tests with coverage
  run: npm run test:coverage
```
