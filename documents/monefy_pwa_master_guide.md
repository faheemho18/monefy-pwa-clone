# Task Completion Report
**Task:** Create comprehensive API Documentation for Monefy PWA clone including REST endpoint specifications, request/response schemas, Firebase Firestore operations, authentication flows, sync APIs, error handling codes, rate limiting for free tiers, and integration examples. Include OpenAPI/Swagger specifications, security considerations, and practical implementation examples for 2-user household system with offline sync capabilities.
**Generated:** 2025-07-24 15:58:01
**Model:** gemini-2.5-pro

---

## Task Results

Of course. Here is a comprehensive API documentation for a Monefy PWA clone, built on Firebase and designed for a multi-user household with offline sync capabilities.

---

# **Monefy Clone API Documentation**

## **1. Overview**

Welcome to the Monefy Clone API. This API provides the backend services for a personal finance Progressive Web App (PWA) that allows users to track expenses and income. It is built with a focus on simplicity, speed, and robust offline synchronization for individuals and small households.

**Core Concepts:**

*   **User:** An individual authenticated via Firebase Authentication.
*   **Wallet:** A container for transactions, representing a budget (e.g., "Personal," "Shared Household"). A wallet can have multiple members.
*   **Transaction:** An individual record of income or an expense, linked to a specific wallet and category.
*   **Category:** A user-defined label for a transaction (e.g., "Groceries," "Salary"). Categories are specific to a wallet.
*   **Sync:** The mechanism for reconciling data between the client's offline cache (PWA) and the server (Firestore) to ensure data consistency across devices and users.

**Technology Stack:**

*   **Backend:** Cloud Functions for Firebase
*   **Database:** Google Firestore
*   **Authentication:** Firebase Authentication

---

## **2. Authentication**

Authentication is handled by the **Firebase Authentication** client-side SDK. The API does not have endpoints for user registration or login. Instead, it expects a valid Firebase ID Token to be passed with every authenticated request.

### **Authentication Flow**

1.  **Client-Side Sign-In:** The PWA uses a Firebase SDK (e.g., for Web) to sign the user in using providers like Google, Email/Password, etc.
2.  **Get ID Token:** Upon successful sign-in, the Firebase SDK provides a JSON Web Token (JWT), also known as an ID Token. This token has a limited lifetime and should be refreshed automatically by the SDK.
3.  **API Request:** The client includes this ID Token in the `Authorization` header for every API call that requires authentication.

    ```
    Authorization: Bearer <FIREBASE_ID_TOKEN>
    ```

4.  **Server-Side Verification:** The API (Cloud Function) uses the Firebase Admin SDK to verify the incoming ID Token. If the token is valid, the function extracts the user's `uid` and proceeds. If not, it returns a `401 Unauthorized` error.

### **First-Time User Setup**

After a user signs up for the first time via Firebase Auth, the client should make a call to `POST /users/init` to create a corresponding user profile and a default "Personal" wallet in Firestore.

---

## **3. Data Model (Firestore)**

Our database is structured around three main collections.

### `users/{userId}`

Stores public-facing information about a user. The `userId` is the `uid` from Firebase Authentication.

```json
{
  "email": "user@example.com",
  "displayName": "John Doe",
  "photoURL": "https://path.to/photo.jpg",
  "createdAt": "2023-10-27T10:00:00Z"
}
```

### `wallets/{walletId}`

Represents a budget or a shared account.

```json
{
  "name": "Shared Household",
  "currency": "USD",
  "ownerId": "user_uid_of_creator",
  "memberIds": ["user_uid_of_creator", "user_uid_of_spouse"],
  "createdAt": "2023-10-27T10:05:00Z",
  "updatedAt": "2023-10-27T11:00:00Z"
}
```

*   **Authorization Rule:** A user can only perform actions on a wallet if their `uid` is in the `memberIds` array.

### `wallets/{walletId}/transactions/{transactionId}`

A sub-collection within each wallet for transactions.

```json
{
  "amount": 55.40,
  "type": "expense", // "expense" or "income"
  "date": "2023-10-26T18:30:00Z",
  "categoryId": "cat_groceries_id",
  "description": "Weekly groceries",
  "userId": "user_uid_of_adder", // Who added this transaction
  "createdAt": "2023-10-26T18:31:00Z",
  "updatedAt": "2023-10-26T18:31:00Z",
  "isDeleted": false // For soft deletes, crucial for sync
}
```

### `wallets/{walletId}/categories/{categoryId}`

A sub-collection for wallet-specific categories.

```json
{
  "name": "Groceries",
  "icon": "shopping-cart", // e.g., FontAwesome icon name
  "type": "expense", // "expense" or "income"
  "createdAt": "2023-10-27T10:05:00Z",
  "updatedAt": "2023-10-27T10:05:00Z"
}
```

---

## **4. REST Endpoint Specifications**

**Base URL:** `https://us-central1-<your-project-id>.cloudfunctions.net/api`

### **Users**

#### `POST /users/init`

Initializes a user profile in Firestore after first-time sign-up and creates their default "Personal" wallet. This endpoint is idempotent.

*   **Authentication:** Required.
*   **Request Body:** None.
*   **Response `200 OK`:**
    ```json
    {
      "message": "User initialized successfully.",
      "userId": "user_abc123",
      "defaultWalletId": "wallet_xyz789"
    }
    ```

### **Wallets**

#### `GET /wallets`

Retrieve all wallets the authenticated user is a member of.

*   **Authentication:** Required.
*   **Response `200 OK`:**
    ```json
    [
      {
        "id": "wallet_xyz789",
        "name": "Personal",
        "currency": "USD",
        "ownerId": "user_abc123",
        "memberIds": ["user_abc123"],
        "createdAt": "...",
        "updatedAt": "..."
      },
      {
        "id": "wallet_pqr456",
        "name": "Shared Household",
        "currency": "USD",
        "ownerId": "user_abc123",
        "memberIds": ["user_abc123", "user_def456"],
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
    ```

#### `POST /wallets`

Create a new wallet. The creator is automatically added as the owner and a member.

*   **Authentication:** Required.
*   **Request Body:**
    ```json
    {
      "name": "Vacation Fund",
      "currency": "EUR"
    }
    ```
*   **Response `201 Created`:** Returns the newly created wallet object, including its ID.

#### `PUT /wallets/{walletId}`

Update a wallet's details, such as its name or members. This is how a user invites another user to a wallet.

*   **Authentication:** Required. User must be a member of the wallet.
*   **Request Body:**
    ```json
    {
      "name": "Shared Household Wallet",
      "memberIds": ["user_abc123", "user_def456"] // Add new member
    }
    ```
*   **Response `200 OK`:** Returns the updated wallet object.

### **Transactions**

All transaction endpoints are nested under a specific wallet. The API will enforce that the authenticated user is a member of `{walletId}`.

#### `GET /wallets/{walletId}/transactions`

Get all transactions for a wallet. Supports pagination.

*   **Authentication:** Required.
*   **Query Parameters:**
    *   `limit` (integer, optional, default=100): Number of transactions to return.
    *   `startAfter` (string, optional): The ID of the transaction to start after for pagination.
*   **Response `200 OK`:**
    ```json
    {
      "data": [
        {
          "id": "trans_1",
          "amount": 55.40,
          "type": "expense",
          /* ... other fields ... */
        }
      ],
      "lastVisible": "trans_100" // ID of the last document for pagination
    }
    ```

#### `POST /wallets/{walletId}/transactions`

Add a new transaction to a wallet.

*   **Authentication:** Required.
*   **Request Body:**
    ```json
    {
      "amount": 15.00,
      "type": "expense",
      "date": "2023-10-27T12:00:00Z",
      "categoryId": "cat_lunch_id",
      "description": "Lunch with team"
    }
    ```
*   **Response `201 Created`:** Returns the complete transaction object, including the server-generated `id`, `createdAt`, and `updatedAt` timestamps.

#### `PUT /wallets/{walletId}/transactions/{transactionId}`

Update an existing transaction.

*   **Authentication:** Required.
*   **Response `200 OK`:** Returns the fully updated transaction object.

#### `DELETE /wallets/{walletId}/transactions/{transactionId}`

Soft-delete a transaction by setting `isDeleted: true`.

*   **Authentication:** Required.
*   **Response `204 No Content`:**

---

## **5. Offline Sync API**

This is the core of the PWA's offline functionality. It follows a client-driven sync model. The client is responsible for storing its state locally (e.g., in IndexedDB) and initiating sync when online.

**Key Principle:** The server is the single source of truth for timestamps (`createdAt`, `updatedAt`). **Last Write Wins (LWW)** is the conflict resolution strategy, based on the `updatedAt` timestamp.

### `POST /sync/push`

The client "pushes" all its locally created or modified records to the server.

*   **Authentication:** Required.
*   **Request Body:**
    ```json
    {
      "walletId": "wallet_pqr456",
      "transactions": [
        // A new transaction created offline (no id or timestamps)
        {
          "localId": "local_temp_1", // A temporary ID from the client
          "amount": 25.00,
          "type": "expense",
          "date": "2023-10-27T19:00:00Z",
          "categoryId": "cat_movies_id"
        },
        // An existing transaction updated offline
        {
          "id": "trans_server_id_123",
          "description": "Updated description"
        }
      ],
      "categories": [ /* ... similar structure for categories ... */ ]
    }
    ```
*   **Server Logic:**
    1.  Verify user is a member of `walletId`.
    2.  For each new record (with `localId`), create a new document in Firestore, assign a server `id` and timestamps.
    3.  For each updated record (with `id`), update the existing document and set a new server `updatedAt` timestamp.
*   **Response `200 OK`:** Returns a map of local IDs to the new server-generated records, allowing the client to update its local store.
    ```json
    {
      "transactions": [
        {
          "localId": "local_temp_1",
          "serverRecord": {
            "id": "trans_new_server_id_789",
            "amount": 25.00,
            /* ... all fields, with server timestamps ... */
          }
        }
      ],
      "categories": []
    }
    ```

### `GET /sync/pull`

The client "pulls" all changes from the server that occurred after its last successful sync.

*   **Authentication:** Required.
*   **Query Parameters:**
    *   `walletId` (string, required): The ID of the wallet to sync.
    *   `since` (string, required): An ISO 8601 timestamp of the client's last successful sync.
*   **Server Logic:**
    1.  Verify user is a member of `walletId`.
    2.  Query all transactions and categories in the wallet where `updatedAt` > `since`.
*   **Response `200 OK`:**
    ```json
    {
      "transactions": [
        // All transactions created/updated on the server since the 'since' timestamp
        {
          "id": "trans_from_other_user_456",
          "amount": 42.10,
          "type": "expense",
          "updatedAt": "2023-10-27T20:05:00Z",
          "isDeleted": false
          /* ... */
        },
        {
          "id": "trans_deleted_on_server_789",
          "updatedAt": "2023-10-27T20:06:00Z",
          "isDeleted": true
        }
      ],
      "categories": [ /* ... */ ],
      "serverSyncTimestamp": "2023-10-27T20:10:00Z" // The server's current time
    }
    ```
*   **Client Action:** The client should process this payload, update/add/delete records in its local database, and then store the `serverSyncTimestamp` for the next pull request.

---

## **6. Error Handling**

The API uses standard HTTP status codes and provides a consistent JSON error body.

**Error Response Body:**

```json
{
  "error": {
    "code": "resource_not_found",
    "message": "The requested wallet does not exist."
  }
}
```

**Common Codes:**

| Status Code | `error.code`             | Description                                                                 |
| :---------- | :----------------------- | :-------------------------------------------------------------------------- |
| `400`       | `bad_request`            | Invalid request body, missing required fields, or invalid query parameters. |
| `401`       | `unauthenticated`        | The Firebase ID Token is missing, invalid, or expired.                      |
| `403`       | `permission_denied`      | The user is not a member of the requested wallet.                           |
| `404`       | `resource_not_found`     | The requested resource (e.g., wallet, transaction) does not exist.          |
| `429`       | `rate_limit_exceeded`    | The user has exceeded the request limit for their tier.                     |
| `500`       | `internal_server_error`  | An unexpected error occurred on the server.                                 |

---

## **7. Rate Limiting (Free Tier)**

To prevent abuse and manage Firebase costs, the API implements rate limiting, especially for a free tier.

*   **Algorithm:** Fixed Window Counter.
*   **Limit:** 100 requests per user per 10 minutes.
*   **Implementation:** A Cloud Function middleware can track request counts per `uid` in a separate Firestore collection or Redis instance.

When a user is rate-limited, the API responds with a `429 Too Many Requests` status and the following headers:

*   `X-RateLimit-Limit`: `100` (The total limit for the window)
*   `X-RateLimit-Remaining`: `0` (Requests remaining in the window)
*   `Retry-After`: `600` (Seconds until the window resets)

---

## **8. Security Considerations**

1.  **Authentication:** All endpoints (except public ones, if any) MUST verify the Firebase ID Token.
2.  **Authorization:** This is critical. **Every database query must be secured with Firestore Security Rules and validated in the Cloud Function backend.** A user's `uid` must be checked against the `wallet.memberIds` array before any read or write operation is allowed on a wallet or its sub-collections.
3.  **Input Validation:** All user-provided data in request bodies and query parameters must be rigorously validated and sanitized to prevent injection attacks and ensure data integrity.
4.  **HTTPS:** All communication must be over HTTPS. Firebase Hosting and Cloud Functions provide this by default.
5.  **Principle of Least Privilege:** Cloud Functions should be assigned IAM roles with the minimum permissions necessary to operate.

---

## **9. OpenAPI 3.0 (Swagger) Specification Snippet**

Here is a snippet demonstrating the structure for the Wallet and Transaction endpoints.

```yaml
openapi: 3.0.0
info:
  title: Monefy Clone API
  version: 1.0.0
servers:
  - url: https://us-central1-<your-project-id>.cloudfunctions.net/api
security:
  - bearerAuth: []

paths:
  /wallets:
    get:
      summary: Get user's wallets
      security:
        - bearerAuth: []
      responses:
        '200':
          description: A list of wallets
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Wallet'
  /wallets/{walletId}/transactions:
    post:
      summary: Create a new transaction
      security:
        - bearerAuth: []
      parameters:
        - name: walletId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NewTransaction'
      responses:
        '201':
          description: Transaction created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Transaction'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    Wallet:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        currency:
          type: string
        ownerId:
          type: string
        memberIds:
          type: array
          items:
            type: string
    Transaction:
      type: object
      properties:
        id:
          type: string
        amount:
          type: number
        type:
          type: string
          enum: [expense, income]
        date:
          type: string
          format: date-time
        # ... other properties
    NewTransaction:
      type: object
      required: [amount, type, date, categoryId]
      properties:
        amount:
          type: number
        type:
          type: string
          enum: [expense, income]
        date:
          type: string
          format: date-time
        categoryId:
          type: string
        description:
          type: string
```

---

## **10. Integration Example: 2-User Household Sync**

**Scenario:** Alice and Bob share a "Household" wallet. Alice is on the subway (offline) and Bob is at home (online).

1.  **Setup:**
    *   Alice signed up (`POST /users/init`).
    *   She created a new wallet (`POST /wallets`) named "Household".
    *   She invited Bob by adding his `userId` to the `memberIds` array (`PUT /wallets/{walletId}`).
    *   Both Alice and Bob have synced their PWAs and have the latest state. Their `lastSyncTimestamp` is `T0`.

2.  **Alice (Offline):**
    *   Alice's PWA is offline.
    *   She adds an expense: `{ localId: "alice_temp_1", amount: 5.50, description: "Coffee" }`.
    *   This transaction is saved only in her device's local IndexedDB.

3.  **Bob (Online):**
    *   Bob adds an expense: `{ amount: 120.00, description: "Groceries" }`.
    *   His PWA is online, so it directly calls `POST /wallets/{householdId}/transactions`.
    *   The server creates the transaction with ID `trans_bob_1` and `updatedAt` timestamp `T1`.

4.  **Alice Comes Online:**
    *   Alice's PWA detects an internet connection and initiates the sync process.

    *   **Step A: Push**
        *   The PWA sends its offline changes to the server.
        *   **Request:** `POST /sync/push` with body `{ walletId: "...", transactions: [{ localId: "alice_temp_1", ... }] }`
        *   **Server:** Creates a new transaction for Alice's coffee, gives it a new ID `trans_alice_1`, and sets its `updatedAt` to `T2`.
        *   **Response:** The server sends back `{ transactions: [{ localId: "alice_temp_1", serverRecord: { id: "trans_alice_1", ... } }] }`.
        *   **Client:** Alice's PWA updates its local "Coffee" record, replacing `localId` with the new `trans_alice_1` ID and other server-provided data.

    *   **Step B: Pull**
        *   The PWA now needs to get changes that happened on the server while it was offline.
        *   **Request:** `GET /sync/pull?walletId={householdId}&since=T0`
        *   **Server:** Queries Firestore for all documents in the wallet with `updatedAt > T0`. This finds both Bob's transaction (`T1`) and the newly created coffee transaction (`T2`).
        *   **Response:** The server returns `{ transactions: [ { id: "trans_bob_1", ... }, { id: "trans_alice_1", ... } ], serverSyncTimestamp: "T3" }`.
        *   **Client:** Alice's PWA receives the list. It sees `trans_alice_1` is already up-to-date from the push response. It sees `trans_bob_1` is new and adds it to the local database. Finally, it updates its `lastSyncTimestamp` to the new `T3` from the response.

5.  **Result:** Both Alice's and Bob's devices now show a consistent state with both the "Coffee" and "Groceries" transactions, seamlessly synced.

---

*Task completed by Enhanced Gemini Client*


============================================================
FILE: AGENT3_Testing_Framework_QA_Strategy.md
============================================================

# Comprehensive Testing Framework and Quality Assurance Strategy
**Project:** Monefy PWA Clone (CoinTrack PWA)  
**Generated:** 2025-07-24  
**Task Key:** 3  

---

## Table of Contents
1. [Testing Strategy Overview](#testing-strategy-overview)
2. [Unit Testing Framework](#unit-testing-framework)
3. [Integration Testing](#integration-testing)
4. [End-to-End Testing](#end-to-end-testing)
5. [PWA Testing Strategies](#pwa-testing-strategies)
6. [Performance Testing](#performance-testing)
7. [Accessibility Testing](#accessibility-testing)
8. [Test Data Management](#test-data-management)
9. [CI/CD Testing Pipeline](#cicd-testing-pipeline)
10. [Quality Gates and Metrics](#quality-gates-and-metrics)

---

## Testing Strategy Overview

### Testing Pyramid
Our testing strategy follows the testing pyramid principle:
- **70% Unit Tests** - Fast, isolated component and function tests
- **20% Integration Tests** - Firebase operations, API integrations, sync logic
- **10% E2E Tests** - Critical user flows and PWA functionality

### Test Environment Matrix
| Environment | Purpose | Database | Authentication | Service Worker |
|-------------|---------|----------|----------------|----------------|
| Development | Local development | Firestore Emulator | Auth Emulator | Mock SW |
| Testing | Automated testing | Firestore Test Project | Test Auth | Real SW |
| Staging | Pre-production validation | Staging Firestore | Staging Auth | Production SW |
| Production | Live monitoring | Production Firestore | Production Auth | Production SW |

---

## Unit Testing Framework

### Technology Stack
- **Primary Framework:** Vitest (faster than Jest, native ESM support)
- **React Testing:** @testing-library/react
- **Utilities:** @testing-library/jest-dom, @testing-library/user-event
- **Mocking:** vi (Vitest's built-in mocking)

### Configuration Setup

#### `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@services': resolve(__dirname, './src/services'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@utils': resolve(__dirname, './src/utils'),
      '@types': resolve(__dirname, './src/types')
    }
  }
})
```

#### Test Setup (`src/test/setup.ts`)
```typescript
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Firebase
vi.mock('@/services/firebase', () => ({
  auth: {
    currentUser: null,
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn()
  },
  db: {
    collection: vi.fn(),
    doc: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    onSnapshot: vi.fn()
  }
}))

// Mock IndexedDB for PWA tests
global.indexedDB = require('fake-indexeddb')

// Mock service worker
Object.defineProperty(window.navigator, 'serviceWorker', {
  value: {
    register: vi.fn().mockResolvedValue({}),
    ready: Promise.resolve({
      active: {
        postMessage: vi.fn()
      }
    })
  }
})

// Mock matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
```

### Component Testing Examples

#### Transaction Component Test
```typescript
// src/components/Transaction/__tests__/Transaction.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import Transaction from '../Transaction'
import type { Transaction as TransactionType } from '@/types'

const mockTransaction: TransactionType = {
  id: '1',
  amount: 25.50,
  category: 'food',
  type: 'expense',
  description: 'Lunch',
  date: new Date('2024-01-15'),
  syncStatus: 'synced'
}

describe('Transaction Component', () => {
  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders transaction details correctly', () => {
    render(
      <Transaction 
        transaction={mockTransaction}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('$25.50')).toBeInTheDocument()
    expect(screen.getByText('Lunch')).toBeInTheDocument()
    expect(screen.getByLabelText('Food category')).toBeInTheDocument()
  })

  it('shows expense with negative styling', () => {
    render(
      <Transaction 
        transaction={mockTransaction}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    const amountElement = screen.getByText('$25.50')
    expect(amountElement).toHaveClass('text-red-600')
  })

  it('shows income with positive styling', () => {
    const incomeTransaction = { ...mockTransaction, type: 'income' as const }
    render(
      <Transaction 
        transaction={incomeTransaction}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    const amountElement = screen.getByText('$25.50')
    expect(amountElement).toHaveClass('text-green-600')
  })

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Transaction 
        transaction={mockTransaction}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    await user.click(screen.getByRole('button', { name: /edit/i }))
    expect(mockOnEdit).toHaveBeenCalledWith(mockTransaction)
  })

  it('shows sync status indicator', () => {
    const pendingTransaction = { ...mockTransaction, syncStatus: 'pending' as const }
    render(
      <Transaction 
        transaction={pendingTransaction}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByLabelText('Sync pending')).toBeInTheDocument()
  })
})
```

#### Custom Hook Testing
```typescript
// src/hooks/__tests__/useTransactions.test.ts
import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { useTransactions } from '../useTransactions'
import * as transactionService from '@/services/transactionService'

vi.mock('@/services/transactionService')

describe('useTransactions Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads transactions on mount', async () => {
    const mockTransactions = [
      { id: '1', amount: 10, category: 'food', type: 'expense' },
      { id: '2', amount: 50, category: 'salary', type: 'income' }
    ]
    
    vi.mocked(transactionService.getTransactions).mockResolvedValue(mockTransactions)

    const { result } = renderHook(() => useTransactions())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.transactions).toEqual(mockTransactions)
    expect(result.current.loading).toBe(false)
  })

  it('adds transaction successfully', async () => {
    const newTransaction = { 
      amount: 15, 
      category: 'transport', 
      type: 'expense' as const,
      description: 'Bus fare'
    }
    
    vi.mocked(transactionService.addTransaction).mockResolvedValue('new-id')

    const { result } = renderHook(() => useTransactions())

    await act(async () => {
      await result.current.addTransaction(newTransaction)
    })

    expect(transactionService.addTransaction).toHaveBeenCalledWith(newTransaction)
  })

  it('handles offline transaction addition', async () => {
    const newTransaction = { 
      amount: 15, 
      category: 'transport', 
      type: 'expense' as const 
    }
    
    vi.mocked(transactionService.addTransaction).mockRejectedValue(
      new Error('Network error')
    )

    const { result } = renderHook(() => useTransactions())

    await act(async () => {
      await result.current.addTransaction(newTransaction)
    })

    // Should still add to local state with pending sync status
    expect(result.current.transactions).toHaveLength(1)
    expect(result.current.transactions[0].syncStatus).toBe('pending')
  })
})
```

### Service Layer Testing

#### Firebase Service Tests
```typescript
// src/services/__tests__/firebaseService.test.ts
import { vi } from 'vitest'
import { 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  doc,
  onSnapshot 
} from 'firebase/firestore'
import { FirebaseService } from '../firebaseService'

vi.mock('firebase/firestore')

describe('FirebaseService', () => {
  const mockUser = { uid: 'user123' }
  const service = new FirebaseService(mockUser)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('adds transaction to Firestore', async () => {
    const mockDocRef = { id: 'doc123' }
    vi.mocked(addDoc).mockResolvedValue(mockDocRef as any)

    const transaction = {
      amount: 25,
      category: 'food',
      type: 'expense' as const,
      description: 'Lunch'
    }

    const result = await service.addTransaction(transaction)

    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        ...transaction,
        userId: 'user123',
        createdAt: expect.any(Date)
      })
    )
    expect(result).toBe('doc123')
  })

  it('handles network errors gracefully', async () => {
    vi.mocked(addDoc).mockRejectedValue(new Error('Network error'))

    const transaction = {
      amount: 25,
      category: 'food',
      type: 'expense' as const
    }

    await expect(service.addTransaction(transaction)).rejects.toThrow('Network error')
  })

  it('sets up real-time listener', () => {
    const mockCallback = vi.fn()
    const mockUnsubscribe = vi.fn()
    vi.mocked(onSnapshot).mockReturnValue(mockUnsubscribe)

    const unsubscribe = service.subscribeToTransactions(mockCallback)

    expect(onSnapshot).toHaveBeenCalled()
    expect(unsubscribe).toBe(mockUnsubscribe)
  })
})
```

---

## Integration Testing

### Firebase Integration Tests

#### Firestore Operations Test Suite
```typescript
// src/test/integration/firestore.integration.test.ts
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore'

describe('Firestore Integration Tests', () => {
  let testEnv: RulesTestEnvironment
  let db: any

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'monefy-test',
      firestore: {
        rules: `
          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              match /transactions/{transactionId} {
                allow read, write: if request.auth != null && 
                  request.auth.uid == resource.data.userId;
              }
              match /users/{userId} {
                allow read, write: if request.auth != null && 
                  request.auth.uid == userId;
              }
            }
          }
        `
      }
    })
  })

  beforeEach(async () => {
    await testEnv.clearFirestore()
    db = testEnv.authenticatedContext('user123').firestore()
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  it('allows user to create transaction', async () => {
    const transactionData = {
      amount: 25.50,
      category: 'food',
      type: 'expense',
      userId: 'user123',
      createdAt: new Date()
    }

    const docRef = await addDoc(collection(db, 'transactions'), transactionData)
    const docSnap = await getDoc(docRef)

    expect(docSnap.exists()).toBe(true)
    expect(docSnap.data()).toMatchObject(transactionData)
  })

  it('prevents user from accessing other users transactions', async () => {
    const otherUserDb = testEnv.authenticatedContext('user456').firestore()
    
    // Add transaction as user123
    await addDoc(collection(db, 'transactions'), {
      amount: 100,
      userId: 'user123',
      category: 'food',
      type: 'expense'
    })

    // Try to read as user456
    const q = query(
      collection(otherUserDb, 'transactions'),
      where('userId', '==', 'user123')
    )

    await expect(getDocs(q)).rejects.toThrow()
  })

  it('handles offline persistence', async () => {
    // Simulate offline mode
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const offlineDb = context.firestore()
      
      // Add document while "offline"
      const docRef = await addDoc(collection(offlineDb, 'transactions'), {
        amount: 50,
        category: 'transport',
        type: 'expense',
        userId: 'user123',
        syncStatus: 'pending'
      })

      // Verify it exists locally
      const docSnap = await getDoc(docRef)
      expect(docSnap.exists()).toBe(true)
      expect(docSnap.data()?.syncStatus).toBe('pending')
    })
  })
})
```

### Sync Logic Integration Tests

```typescript
// src/test/integration/sync.integration.test.ts
import { SyncManager } from '@/services/syncManager'
import { OfflineStorage } from '@/services/offlineStorage'
import { FirebaseService } from '@/services/firebaseService'

describe('Sync Manager Integration', () => {
  let syncManager: SyncManager
  let offlineStorage: OfflineStorage
  let firebaseService: FirebaseService
  let mockUser: any

  beforeEach(() => {
    mockUser = { uid: 'test-user' }
    offlineStorage = new OfflineStorage()
    firebaseService = new FirebaseService(mockUser)
    syncManager = new SyncManager(offlineStorage, firebaseService)
  })

  it('syncs pending transactions when online', async () => {
    // Add transactions offline
    const transaction1 = await offlineStorage.addTransaction({
      amount: 25,
      category: 'food',
      type: 'expense',
      syncStatus: 'pending'
    })

    const transaction2 = await offlineStorage.addTransaction({
      amount: 100,
      category: 'salary',
      type: 'income',
      syncStatus: 'pending'
    })

    // Mock successful Firebase sync
    const firebaseSpy = vi.spyOn(firebaseService, 'addTransaction')
      .mockResolvedValueOnce('firebase-id-1')
      .mockResolvedValueOnce('firebase-id-2')

    // Execute sync
    await syncManager.syncPendingTransactions()

    // Verify Firebase calls
    expect(firebaseSpy).toHaveBeenCalledTimes(2)
    
    // Verify local records updated
    const syncedTransactions = await offlineStorage.getTransactions()
    expect(syncedTransactions.every(t => t.syncStatus === 'synced')).toBe(true)
  })

  it('handles partial sync failures', async () => {
    // Add transactions offline
    await offlineStorage.addTransaction({
      amount: 25,
      category: 'food',
      type: 'expense',
      syncStatus: 'pending'
    })

    await offlineStorage.addTransaction({
      amount: 100,
      category: 'salary',
      type: 'income',
      syncStatus: 'pending'
    })

    // Mock partial failure
    const firebaseSpy = vi.spyOn(firebaseService, 'addTransaction')
      .mockResolvedValueOnce('firebase-id-1')
      .mockRejectedValueOnce(new Error('Network error'))

    await syncManager.syncPendingTransactions()

    const transactions = await offlineStorage.getTransactions()
    expect(transactions[0].syncStatus).toBe('synced')
    expect(transactions[1].syncStatus).toBe('pending')
  })

  it('resolves conflicts using last-write-wins strategy', async () => {
    const transactionId = 'conflict-test-id'
    
    // Simulate local modification
    await offlineStorage.updateTransaction(transactionId, {
      amount: 30,
      description: 'Local update',
      modifiedAt: new Date('2024-01-15T10:00:00Z')
    })

    // Simulate remote modification
    const remoteTransaction = {
      id: transactionId,
      amount: 35,
      description: 'Remote update',
      modifiedAt: new Date('2024-01-15T11:00:00Z'), // Later timestamp
      syncStatus: 'synced'
    }

    // Execute conflict resolution
    await syncManager.resolveConflict(transactionId, remoteTransaction)

    const resolvedTransaction = await offlineStorage.getTransaction(transactionId)
    expect(resolvedTransaction?.amount).toBe(35) // Remote wins due to later timestamp
    expect(resolvedTransaction?.description).toBe('Remote update')
  })
})
```

---

## End-to-End Testing

### Technology Stack
- **Primary Framework:** Playwright (cross-browser support, PWA testing capabilities)
- **Alternative:** Cypress (good developer experience, but limited browser support)

### Playwright Configuration

#### `playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI
  }
})
```

### Critical User Flow Tests

#### Authentication Flow
```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('user can sign up and login', async ({ page }) => {
    await page.goto('/')
    
    // Should redirect to login page for unauthenticated user
    await expect(page).toHaveURL(/.*\/login/)
    
    // Click sign up
    await page.click('[data-testid="signup-link"]')
    await expect(page).toHaveURL(/.*\/signup/)
    
    // Fill signup form
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    await page.fill('[data-testid="confirm-password-input"]', 'TestPassword123!')
    
    // Submit form
    await page.click('[data-testid="signup-button"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/)
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible()
  })

  test('user can logout and login again', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    await page.click('[data-testid="login-button"]')
    
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Logout
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="logout-button"]')
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/)
    
    // Login again
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    await page.click('[data-testid="login-button"]')
    
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('[data-testid="email-input"]', 'wrong@example.com')
    await page.fill('[data-testid="password-input"]', 'wrongpassword')
    await page.click('[data-testid="login-button"]')
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials')
  })
})
```

#### Transaction Management Flow
```typescript
// e2e/transactions.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Transaction Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    await page.click('[data-testid="login-button"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('user can add expense transaction', async ({ page }) => {
    // Click add expense button
    await page.click('[data-testid="add-expense-button"]')
    
    // Fill transaction form
    await page.fill('[data-testid="amount-input"]', '25.50')
    await page.selectOption('[data-testid="category-select"]', 'food')
    await page.fill('[data-testid="description-input"]', 'Lunch at cafe')
    
    // Submit form
    await page.click('[data-testid="save-transaction-button"]')
    
    // Verify transaction appears in list
    await expect(page.locator('[data-testid="transaction-list"]')).toBeVisible()
    await expect(page.locator('text=Lunch at cafe')).toBeVisible()
    await expect(page.locator('text=$25.50')).toBeVisible()
    
    // Verify balance updated
    const balance = await page.locator('[data-testid="current-balance"]').textContent()
    expect(balance).toContain('-$25.50')
  })

  test('user can add income transaction', async ({ page }) => {
    await page.click('[data-testid="add-income-button"]')
    
    await page.fill('[data-testid="amount-input"]', '1000')
    await page.selectOption('[data-testid="category-select"]', 'salary')
    await page.fill('[data-testid="description-input"]', 'Monthly salary')
    
    await page.click('[data-testid="save-transaction-button"]')
    
    await expect(page.locator('text=Monthly salary')).toBeVisible()
    await expect(page.locator('text=$1,000.00')).toBeVisible()
    
    const balance = await page.locator('[data-testid="current-balance"]').textContent()
    expect(balance).toContain('$1,000.00')
  })

  test('user can edit transaction', async ({ page }) => {
    // First add a transaction
    await page.click('[data-testid="add-expense-button"]')
    await page.fill('[data-testid="amount-input"]', '20')
    await page.selectOption('[data-testid="category-select"]', 'transport')
    await page.click('[data-testid="save-transaction-button"]')
    
    // Edit the transaction
    await page.click('[data-testid="transaction-item"]:first-child [data-testid="edit-button"]')
    
    await page.fill('[data-testid="amount-input"]', '25')
    await page.fill('[data-testid="description-input"]', 'Updated transport cost')
    await page.click('[data-testid="save-transaction-button"]')
    
    // Verify changes
    await expect(page.locator('text=Updated transport cost')).toBeVisible()
    await expect(page.locator('text=$25.00')).toBeVisible()
  })

  test('user can delete transaction', async ({ page }) => {
    // Add a transaction first
    await page.click('[data-testid="add-expense-button"]')
    await page.fill('[data-testid="amount-input"]', '15')
    await page.selectOption('[data-testid="category-select"]', 'entertainment')
    await page.click('[data-testid="save-transaction-button"]')
    
    // Delete the transaction
    await page.click('[data-testid="transaction-item"]:first-child [data-testid="delete-button"]')
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete-button"]')
    
    // Verify transaction is removed
    await expect(page.locator('text=entertainment')).not.toBeVisible()
  })

  test('transactions persist after page reload', async ({ page }) => {
    // Add a transaction
    await page.click('[data-testid="add-expense-button"]')
    await page.fill('[data-testid="amount-input"]', '30')
    await page.selectOption('[data-testid="category-select"]', 'food')
    await page.fill('[data-testid="description-input"]', 'Persistent transaction')
    await page.click('[data-testid="save-transaction-button"]')
    
    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Verify transaction still exists
    await expect(page.locator('text=Persistent transaction')).toBeVisible()
    await expect(page.locator('text=$30.00')).toBeVisible()
  })
})
```

#### Offline Functionality Tests
```typescript
// e2e/offline.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Offline Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    await page.click('[data-testid="login-button"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('app works offline', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true)
    
    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
    
    // Should still be able to add transactions
    await page.click('[data-testid="add-expense-button"]')
    await page.fill('[data-testid="amount-input"]', '50')
    await page.selectOption('[data-testid="category-select"]', 'food')
    await page.fill('[data-testid="description-input"]', 'Offline transaction')
    await page.click('[data-testid="save-transaction-button"]')
    
    // Transaction should appear with pending sync status
    await expect(page.locator('text=Offline transaction')).toBeVisible()
    await expect(page.locator('[data-testid="sync-pending-icon"]')).toBeVisible()
    
    // Go back online
    await context.setOffline(false)
    
    // Wait for sync
    await page.waitForTimeout(2000)
    
    // Offline indicator should disappear
    await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible()
    
    // Sync pending icon should disappear
    await expect(page.locator('[data-testid="sync-pending-icon"]')).not.toBeVisible()
  })

  test('syncs offline changes when back online', async ({ page, context }) => {
    // Add transaction while online
    await page.click('[data-testid="add-expense-button"]')
    await page.fill('[data-testid="amount-input"]', '25')
    await page.selectOption('[data-testid="category-select"]', 'transport')
    await page.click('[data-testid="save-transaction-button"]')
    
    // Go offline and add another transaction
    await context.setOffline(true)
    await page.click('[data-testid="add-expense-button"]')
    await page.fill('[data-testid="amount-input"]', '35')
    await page.selectOption('[data-testid="category-select"]', 'food')
    await page.fill('[data-testid="description-input"]', 'Offline meal')
    await page.click('[data-testid="save-transaction-button"]')
    
    // Go back online
    await context.setOffline(false)
    
    // Wait for sync to complete
    await page.waitForFunction(() => {
      const syncIcons = document.querySelectorAll('[data-testid="sync-pending-icon"]')
      return syncIcons.length === 0
    }, {}, { timeout: 10000 })
    
    // Both transactions should be visible and synced
    await expect(page.locator('text=transport')).toBeVisible()
    await expect(page.locator('text=Offline meal')).toBeVisible()
    await expect(page.locator('[data-testid="sync-pending-icon"]')).not.toBeVisible()
  })
})
```

---

## PWA Testing Strategies

### Service Worker Testing

#### Service Worker Registration Test
```typescript
// e2e/pwa.spec.ts
import { test, expect } from '@playwright/test'

test.describe('PWA Functionality', () => {
  test('service worker registers successfully', async ({ page }) => {
    await page.goto('/')
    
    // Check if service worker is registered
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        return !!registration
      }
      return false
    })
    
    expect(swRegistered).toBe(true)
  })

  test('app caches resources for offline use', async ({ page, context }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Go offline
    await context.setOffline(true)
    
    // Reload page - should load from cache
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    
    // Basic UI should still be visible
    await expect(page.locator('[data-testid="app-header"]')).toBeVisible()
    await expect(page.locator('[data-testid="navigation"]')).toBeVisible()
  })

  test('shows install prompt on supported devices', async ({ page }) => {
    await page.goto('/')
    
    // Simulate beforeinstallprompt event
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt')
      window.dispatchEvent(event)
    })
    
    // Install button should appear
    await expect(page.locator('[data-testid="install-button"]')).toBeVisible()
  })

  test('app has proper manifest.json', async ({ page }) => {
    const response = await page.request.get('/manifest.json')
    expect(response.status()).toBe(200)
    
    const manifest = await response.json()
    expect(manifest.name).toBeTruthy()
    expect(manifest.short_name).toBeTruthy()
    expect(manifest.start_url).toBeTruthy()
    expect(manifest.display).toBe('standalone')
    expect(manifest.icons).toHaveLength(expect.any(Number))
  })

  test('app works in standalone mode', async ({ page, context }) => {
    // Simulate PWA standalone mode
    await context.addInitScript(() => {
      Object.defineProperty(window.navigator, 'standalone', {
        value: true,
        writable: false
      })
    })
    
    await page.goto('/')
    
    // App should detect standalone mode
    const isStandalone = await page.evaluate(() => {
      return window.navigator.standalone || 
             window.matchMedia('(display-mode: standalone)').matches
    })
    
    expect(isStandalone).toBe(true)
  })
})
```

### Cross-Browser PWA Testing

```typescript
// e2e/pwa-cross-browser.spec.ts
import { test, expect, devices } from '@playwright/test'

test.describe('Cross-Browser PWA Support', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test.describe(`${browserName} PWA tests`, () => {
      test.use({ 
        browserName: browserName as 'chromium' | 'firefox' | 'webkit'
      })

      test('PWA features work correctly', async ({ page }) => {
        await page.goto('/')
        
        // Test service worker support
        const hasServiceWorker = await page.evaluate(() => {
          return 'serviceWorker' in navigator
        })
        
        if (browserName === 'webkit') {
          // Safari has limited PWA support
          expect(hasServiceWorker).toBe(false)
        } else {
          expect(hasServiceWorker).toBe(true)
        }
        
        // Test IndexedDB support (required for offline storage)
        const hasIndexedDB = await page.evaluate(() => {
          return 'indexedDB' in window
        })
        expect(hasIndexedDB).toBe(true)
        
        // Test localStorage support
        const hasLocalStorage = await page.evaluate(() => {
          try {
            localStorage.setItem('test', 'test')
            localStorage.removeItem('test')
            return true
          } catch {
            return false
          }
        })
        expect(hasLocalStorage).toBe(true)
      })
    })
  })
})
```

---

## Performance Testing

### Lighthouse Automation

#### Lighthouse CI Configuration
```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:5173/', 'http://localhost:5173/dashboard'],
      startServerCommand: 'npm run dev',
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --headless',
        preset: 'desktop'
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        'categories:pwa': ['error', { minScore: 0.8 }]
      }
    },
    upload: {
      serverBaseUrl: 'https://lhci.example.com',
      token: process.env.LHCI_TOKEN
    }
  }
}
```

#### Performance Test Suite
```typescript
// e2e/performance.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(3000) // 3 seconds
  })

  test('first contentful paint is fast', async ({ page }) => {
    await page.goto('/')
    
    const fcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries()
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint')
          if (fcpEntry) {
            resolve(fcpEntry.startTime)
          }
        }).observe({ entryTypes: ['paint'] })
      })
    })
    
    expect(fcp).toBeLessThan(2000) // 2 seconds
  })

  test('app is responsive under load', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Add many transactions quickly
    for (let i = 0; i < 50; i++) {
      await page.click('[data-testid="add-expense-button"]')
      await page.fill('[data-testid="amount-input"]', `${10 + i}`)
      await page.selectOption('[data-testid="category-select"]', 'food')
      await page.click('[data-testid="save-transaction-button"]')
    }
    
    // App should remain responsive
    const startTime = Date.now()
    await page.click('[data-testid="balance-card"]')
    const responseTime = Date.now() - startTime
    
    expect(responseTime).toBeLessThan(500) // 500ms
  })

  test('bundle size is optimized', async ({ page }) => {
    const response = await page.goto('/')
    
    // Check main bundle size
    const resourceSizes = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource')
      return resources
        .filter(resource => resource.name.includes('.js'))
        .map(resource => ({
          name: resource.name,
          size: resource.transferSize
        }))
    })
    
    const mainBundle = resourceSizes.find(r => r.name.includes('index'))
    expect(mainBundle?.size).toBeLessThan(500000) // 500KB
  })

  test('images are optimized', async ({ page }) => {
    await page.goto('/')
    
    const imageMetrics = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'))
      return images.map(img => ({
        src: img.src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        displayWidth: img.width,
        displayHeight: img.height
      }))
    })
    
    // Check that images aren't significantly oversized
    imageMetrics.forEach(img => {
      const widthRatio = img.naturalWidth / img.displayWidth
      const heightRatio = img.naturalHeight / img.displayHeight
      
      expect(widthRatio).toBeLessThan(2) // Not more than 2x larger than display size
      expect(heightRatio).toBeLessThan(2)
    })
  })
})
```

### Load Testing
```typescript
// scripts/load-test.ts
import { chromium } from 'playwright'

async function loadTest() {
  const browser = await chromium.launch()
  const concurrentUsers = 10
  const testDuration = 60000 // 1 minute
  
  const promises = Array.from({ length: concurrentUsers }, async (_, index) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    
    const startTime = Date.now()
    let operationCount = 0
    
    try {
      // Login
      await page.goto('/login')
      await page.fill('[data-testid="email-input"]', `user${index}@test.com`)
      await page.fill('[data-testid="password-input"]', 'TestPassword123!')
      await page.click('[data-testid="login-button"]')
      
      // Perform operations until test duration ends
      while (Date.now() - startTime < testDuration) {
        // Add transaction
        await page.click('[data-testid="add-expense-button"]')
        await page.fill('[data-testid="amount-input"]', `${Math.random() * 100}`)
        await page.selectOption('[data-testid="category-select"]', 'food')
        await page.click('[data-testid="save-transaction-button"]')
        
        operationCount++
        
        // Small delay to simulate real user behavior
        await page.waitForTimeout(1000)
      }
    } catch (error) {
      console.error(`User ${index} error:`, error)
    } finally {
      await context.close()
    }
    
    return { user: index, operations: operationCount }
  })
  
  const results = await Promise.all(promises)
  await browser.close()
  
  console.log('Load test results:', results)
  
  const totalOperations = results.reduce((sum, r) => sum + r.operations, 0)
  const averageOps = totalOperations / concurrentUsers
  
  console.log(`Average operations per user: ${averageOps}`)
  console.log(`Total operations: ${totalOperations}`)
}

if (require.main === module) {
  loadTest().catch(console.error)
}
```

---

## Accessibility Testing

### Automated Accessibility Testing

#### axe-core Integration
```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility Tests', () => {
  test('homepage meets WCAG 2.1 AA standards', async ({ page }) => {
    await page.goto('/')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('dashboard meets accessibility standards', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    await page.click('[data-testid="login-button"]')
    
    await page.waitForURL('**/dashboard')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('transaction forms are accessible', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    await page.click('[data-testid="login-button"]')
    
    // Open transaction form
    await page.click('[data-testid="add-expense-button"]')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('app is keyboard navigable', async ({ page }) => {
    await page.goto('/')
    
    // Tab through interactive elements
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()
    
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()
    
    // Should be able to activate focused element with Enter/Space
    await page.keyboard.press('Enter')
    // Verify appropriate action occurred (e.g., form opened, navigation happened)
  })

  test('app works with screen reader', async ({ page }) => {
    await page.goto('/')
    
    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
    expect(headings.length).toBeGreaterThan(0)
    
    // Check for ARIA labels on interactive elements
    const buttons = await page.locator('button').all()
    for (const button of buttons) {
      const hasLabel = await Promise.race([
        button.getAttribute('aria-label').then(label => !!label),
        button.textContent().then(text => !!text?.trim()),
        button.locator('sr-only').count().then(count => count > 0)
      ])
      expect(hasLabel).toBe(true)
    }
  })

  test('color contrast meets standards', async ({ page }) => {
    await page.goto('/')
    
    const colorContrastResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('*')
      .disableRules(['color-contrast']) // We'll test this specifically
      .analyze()
    
    // Custom color contrast check
    const contrastIssues = await page.evaluate(() => {
      const issues: Array<{ element: string; ratio: number }> = []
      
      // Get all text elements
      const textElements = document.querySelectorAll('*')
      
      textElements.forEach((element) => {
        const style = window.getComputedStyle(element)
        const color = style.color
        const backgroundColor = style.backgroundColor
        
        if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)') {
          // Calculate contrast ratio (simplified - in real implementation, use proper algorithm)
          const ratio = calculateContrastRatio(color, backgroundColor)
          
          if (ratio < 4.5) { // WCAG AA requirement
            issues.push({
              element: element.tagName.toLowerCase(),
              ratio: ratio
            })
          }
        }
      })
      
      return issues
    })
    
    expect(contrastIssues).toEqual([])
  })

  test('focus indicators are visible', async ({ page }) => {
    await page.goto('/')
    
    // Check that focus indicators are visible
    await page.keyboard.press('Tab')
    
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Check that focus indicator has sufficient visual distinction
    const focusStyles = await focusedElement.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return {
        outline: style.outline,
        outlineWidth: style.outlineWidth,
        outlineColor: style.outlineColor,
        boxShadow: style.boxShadow
      }
    })
    
    // Should have either outline or box-shadow for focus indication
    const hasFocusIndicator = focusStyles.outline !== 'none' || 
                             focusStyles.boxShadow !== 'none'
    
    expect(hasFocusIndicator).toBe(true)
  })
})
```

### Manual Accessibility Testing Checklist

```typescript
// test-checklists/accessibility-manual.md
export const ACCESSIBILITY_MANUAL_CHECKLIST = {
  keyboardNavigation: [
    'All interactive elements can be reached with Tab/Shift+Tab',
    'Tab order is logical and follows visual layout',
    'All functionality available via mouse is also available via keyboard',
    'Enter/Space keys activate buttons and links',
    'Escape key closes modals and dropdowns',
    'Arrow keys navigate within component groups (menus, tabs, etc.)',
    'Focus indicators are clearly visible',
    'No keyboard traps exist'
  ],
  
  screenReaderSupport: [
    'All images have appropriate alt text',
    'Form fields have associated labels',
    'Error messages are announced',
    'Status updates are announced',
    'ARIA landmarks identify page regions',
    'Headings create logical document outline',
    'Lists use proper markup',
    'Tables have headers and captions where needed'
  ],
  
  visualDesign: [
    'Color is not the only way to convey information',
    'Text has sufficient contrast against background',
    'UI elements maintain contrast in different states',
    'Text can be resized to 200% without horizontal scrolling',
    'Content is readable and functional at high zoom levels',
    'Animations can be paused or disabled',
    'No content flashes more than 3 times per second'
  ],
  
  mobile: [
    'Touch targets are at least 44px × 44px',
    'Content adapts to portrait and landscape orientations',
    'Pinch-to-zoom is not disabled',
    'Content remains accessible when zoomed to 500%',
    'Gestures have accessible alternatives'
  ]
}
```

---

## Test Data Management

### Test Data Factory

```typescript
// src/test/factories/transactionFactory.ts
import { faker } from '@faker-js/faker'
import type { Transaction, TransactionType, Category } from '@/types'

export class TransactionFactory {
  private static categories: Category[] = [
    'food', 'transport', 'entertainment', 'utilities', 'health', 
    'shopping', 'salary', 'freelance', 'investment', 'other'
  ]

  static create(overrides: Partial<Transaction> = {}): Transaction {
    const type: TransactionType = overrides.type || faker.helpers.arrayElement(['income', 'expense'])
    const category = overrides.category || faker.helpers.arrayElement(this.categories)
    
    return {
      id: faker.string.uuid(),
      amount: parseFloat(faker.finance.amount({ min: 1, max: 1000, dec: 2 })),
      category,
      type,
      description: faker.finance.transactionDescription(),
      date: faker.date.recent({ days: 30 }),
      syncStatus: faker.helpers.arrayElement(['synced', 'pending', 'failed']),
      userId: 'test-user-id',
      createdAt: faker.date.recent({ days: 30 }),
      modifiedAt: faker.date.recent({ days: 30 }),
      ...overrides
    }
  }

  static createMany(count: number, overrides: Partial<Transaction> = {}): Transaction[] {
    return Array.from({ length: count }, () => this.create(overrides))
  }

  static createExpense(overrides: Partial<Transaction> = {}): Transaction {
    return this.create({ type: 'expense', ...overrides })
  }

  static createIncome(overrides: Partial<Transaction> = {}): Transaction {
    return this.create({ type: 'income', ...overrides })
  }

  static createPendingSync(overrides: Partial<Transaction> = {}): Transaction {
    return this.create({ syncStatus: 'pending', ...overrides })
  }

  static createDataSet(): {
    expenses: Transaction[]
    income: Transaction[]
    mixed: Transaction[]
  } {
    return {
      expenses: this.createMany(20, { type: 'expense' }),
      income: this.createMany(5, { type: 'income' }),
      mixed: this.createMany(15)
    }
  }
}
```

### Database Seeding for Tests

```typescript
// src/test/utils/seedDatabase.ts
import { collection, addDoc, doc, setDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { TransactionFactory } from '../factories/transactionFactory'
import type { User } from '@/types'

export class DatabaseSeeder {
  static async seedTestUser(userData: Partial<User> = {}): Promise<User> {
    const user: User = {
      id: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      createdAt: new Date(),
      ...userData
    }

    await setDoc(doc(db, 'users', user.id), user)
    return user
  }

  static async seedTransactions(userId: string, count: number = 50): Promise<Transaction[]> {
    const transactions = TransactionFactory.createMany(count, { 
      userId,
      syncStatus: 'synced'
    })

    const promises = transactions.map(transaction => 
      addDoc(collection(db, 'transactions'), transaction)
    )

    await Promise.all(promises)
    return transactions
  }

  static async seedScenario(scenario: 'fresh-user' | 'active-user' | 'heavy-user'): Promise<{
    user: User
    transactions: Transaction[]
  }> {
    const user = await this.seedTestUser()

    let transactions: Transaction[] = []

    switch (scenario) {
      case 'fresh-user':
        // New user with no transactions
        break
        
      case 'active-user':
        transactions = await this.seedTransactions(user.id, 25)
        break
        
      case 'heavy-user':
        transactions = await this.seedTransactions(user.id, 200)
        break
    }

    return { user, transactions }
  }

  static async cleanup(): Promise<void> {
    // Implementation depends on testing environment
    // In Firestore emulator, you can clear all data
    // In test project, delete test documents
  }
}
```

### Mock Services

```typescript
// src/test/mocks/firebaseService.ts
import { vi } from 'vitest'
import type { Transaction } from '@/types'

export class MockFirebaseService {
  private transactions: Map<string, Transaction> = new Map()
  private mockUser = { uid: 'test-user-id' }

  constructor() {
    this.setupMocks()
  }

  private setupMocks() {
    vi.mock('@/services/firebaseService', () => ({
      FirebaseService: vi.fn().mockImplementation(() => ({
        addTransaction: vi.fn().mockImplementation(this.addTransaction.bind(this)),
        updateTransaction: vi.fn().mockImplementation(this.updateTransaction.bind(this)),
        deleteTransaction: vi.fn().mockImplementation(this.deleteTransaction.bind(this)),
        getTransactions: vi.fn().mockImplementation(this.getTransactions.bind(this)),
        subscribeToTransactions: vi.fn().mockImplementation(this.subscribeToTransactions.bind(this))
      }))
    }))
  }

  async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<string> {
    const id = `mock-id-${Date.now()}`
    const newTransaction: Transaction = {
      ...transaction,
      id,
      userId: this.mockUser.uid,
      createdAt: new Date(),
      modifiedAt: new Date()
    }
    
    this.transactions.set(id, newTransaction)
    return id
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    const existing = this.transactions.get(id)
    if (existing) {
      this.transactions.set(id, {
        ...existing,
        ...updates,
        modifiedAt: new Date()
      })
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    this.transactions.delete(id)
  }

  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
  }

  subscribeToTransactions(callback: (transactions: Transaction[]) => void): () => void {
    // Immediately call with current data
    callback(Array.from(this.transactions.values()))
    
    // Return unsubscribe function
    return () => {}
  }

  // Test utilities
  seedData(transactions: Transaction[]): void {
    transactions.forEach(transaction => {
      this.transactions.set(transaction.id, transaction)
    })
  }

  clearData(): void {
    this.transactions.clear()
  }

  simulateNetworkError(): void {
    vi.mocked(this.addTransaction).mockRejectedValueOnce(new Error('Network error'))
    vi.mocked(this.updateTransaction).mockRejectedValueOnce(new Error('Network error'))
    vi.mocked(this.deleteTransaction).mockRejectedValueOnce(new Error('Network error'))
  }
}
```

---

## CI/CD Testing Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '18'
  FIREBASE_PROJECT_ID: 'monefy-test'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:unit -- --coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unit
        name: unit-tests

  integration-tests:
    runs-on: ubuntu-latest
    
    services:
      firebase-emulator:
        image: andreysenov/firebase-tools
        ports:
          - 9099:9099
          - 8080:8080
        options: >-
          --health-cmd "curl -f http://localhost:8080 || exit 1"
          --health-interval 30s
          --health-timeout 10s
          --health-retries 3

    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Start Firebase Emulators
      run: |
        npm install -g firebase-tools
        firebase emulators:start --only firestore,auth --project ${{ env.FIREBASE_PROJECT_ID }} &
        sleep 10
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        FIRESTORE_EMULATOR_HOST: localhost:8080
        FIREBASE_AUTH_EMULATOR_HOST: localhost:9099

  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright browsers
      run: npx playwright install --with-deps
    
    - name: Build application
      run: npm run build
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload E2E test results
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: e2e-test-results
        path: test-results/
        retention-days: 7

  accessibility-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright browsers
      run: npx playwright install --with-deps
    
    - name: Run accessibility tests
      run: npm run test:a11y
    
    - name: Upload accessibility results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: accessibility-results
        path: accessibility-results/

  performance-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Run Lighthouse CI
      run: |
        npm install -g @lhci/cli
        lhci autorun
      env:
        LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
    
    - name: Upload Lighthouse results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: lighthouse-results
        path: .lighthouseci/

  security-scan:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Run npm audit
      run: npm audit --audit-level=high
    
    - name: Run CodeQL analysis
      uses: github/codeql-action/analyze@v2
      with:
        languages: javascript

  quality-gate:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, e2e-tests, accessibility-tests, performance-tests]
    if: always()
    
    steps:
    - name: Check test results
      run: |
        if [[ "${{ needs.unit-tests.result }}" != "success" ]]; then
          echo "Unit tests failed"
          exit 1
        fi
        if [[ "${{ needs.integration-tests.result }}" != "success" ]]; then
          echo "Integration tests failed"
          exit 1
        fi
        if [[ "${{ needs.e2e-tests.result }}" != "success" ]]; then
          echo "E2E tests failed"
          exit 1
        fi
        if [[ "${{ needs.accessibility-tests.result }}" != "success" ]]; then
          echo "Accessibility tests failed"
          exit 1
        fi
        if [[ "${{ needs.performance-tests.result }}" != "success" ]]; then
          echo "Performance tests failed"
          exit 1
        fi
        echo "All tests passed!"
```

### Test Scripts in package.json

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:unit": "vitest run --coverage",
    "test:unit:watch": "vitest",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:a11y": "playwright test --grep='accessibility'",
    "test:performance": "lighthouse-ci",
    "test:security": "npm audit && snyk test",
    "test:smoke": "playwright test --grep='@smoke'",
    "test:regression": "playwright test --grep='@regression'",
    "test:ci": "npm run test:unit && npm run test:integration && npm run test:e2e && npm run test:a11y && npm run test:performance"
  }
}
```

### Pre-commit Hooks

```yaml
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run linting
npm run lint

# Run type checking
npm run type-check

# Run unit tests for changed files
npm run test:unit -- --changed

# Run security checks
npm audit --audit-level=moderate
```

---

## Quality Gates and Metrics

### Test Coverage Requirements

```typescript
// vitest.config.ts - Coverage thresholds
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        // Specific file requirements
        'src/services/': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'src/hooks/': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    }
  }
})
```

### Quality Metrics Dashboard

```typescript
// scripts/quality-metrics.ts
interface QualityMetrics {
  testCoverage: {
    lines: number
    functions: number
    branches: number
    statements: number
  }
  testCounts: {
    unit: number
    integration: number
    e2e: number
    accessibility: number
  }
  performance: {
    lighthouse: {
      performance: number
      accessibility: number
      bestPractices: number
      seo: number
      pwa: number
    }
  }
  security: {
    vulnerabilities: {
      critical: number
      high: number
      moderate: number
      low: number
    }
  }
}

class QualityDashboard {
  async generateReport(): Promise<QualityMetrics> {
    // Collect metrics from various sources
    const coverage = await this.getCoverageMetrics()
    const testCounts = await this.getTestCounts()
    const performance = await this.getPerformanceMetrics()
    const security = await this.getSecurityMetrics()

    return {
      testCoverage: coverage,
      testCounts,
      performance,
      security
    }
  }

  private async getCoverageMetrics() {
    // Parse coverage reports
    // Return coverage percentages
  }

  private async getTestCounts() {
    // Count test files and test cases
    // Return test statistics
  }

  private async getPerformanceMetrics() {
    // Parse Lighthouse CI results
    // Return performance scores
  }

  private async getSecurityMetrics() {
    // Parse npm audit and security scan results
    // Return vulnerability counts
  }
}
```

### Continuous Quality Monitoring

```yaml
# .github/workflows/quality-monitoring.yml
name: Quality Monitoring

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM
  workflow_dispatch:

jobs:
  quality-check:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run full test suite
      run: npm run test:ci
    
    - name: Generate quality report
      run: npm run quality:report
    
    - name: Check quality thresholds
      run: npm run quality:gate
    
    - name: Notify on quality degradation
      if: failure()
      uses: 8398a7/action-slack@v3
      with:
        status: failure
        text: 'Quality gate failed! Check the latest quality report.'
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## Implementation Timeline

### Phase 1: Foundation (Week 1)
- [ ] Set up Vitest with React Testing Library
- [ ] Configure test environments and mocks
- [ ] Create basic component test examples
- [ ] Set up CI/CD pipeline basics

### Phase 2: Core Testing (Week 2-3)  
- [ ] Implement unit tests for all components
- [ ] Create integration tests for Firebase operations
- [ ] Set up test data factories and seeders
- [ ] Configure code coverage reporting

### Phase 3: Advanced Testing (Week 4-5)
- [ ] Implement E2E tests with Playwright
- [ ] Set up PWA-specific testing
- [ ] Configure accessibility testing
- [ ] Implement performance testing with Lighthouse

### Phase 4: Quality Assurance (Week 6)
- [ ] Set up continuous monitoring
- [ ] Configure quality gates
- [ ] Create testing documentation
- [ ] Train team on testing practices

---

## Conclusion

This comprehensive testing framework provides:

1. **Complete Test Coverage**: Unit, integration, E2E, PWA, performance, and accessibility testing
2. **Automated Quality Gates**: Continuous monitoring and quality enforcement
3. **Realistic Test Scenarios**: Based on actual user workflows and edge cases
4. **Maintainable Architecture**: Modular, reusable test utilities and patterns
5. **CI/CD Integration**: Automated testing in deployment pipeline
6. **Performance Monitoring**: Continuous performance tracking and optimization
7. **Accessibility Compliance**: WCAG 2.1 AA compliance verification
8. **Security Testing**: Vulnerability scanning and security best practices

The framework is designed to scale with the application, providing confidence in code quality while maintaining development velocity. All testing tools are free/open-source, aligning with the zero-cost implementation requirement.

**Key Success Metrics:**
- 90%+ test coverage across all code paths
- <2s average E2E test execution time
- 100% WCAG 2.1 AA compliance
- Lighthouse scores >80 across all categories
- Zero critical/high security vulnerabilities
- <5 minute CI/CD pipeline execution

============================================================
FILE: AGENT4_development_environment_setup.md
============================================================

# Development Environment Configuration and Setup Templates
**Generated:** 2025-07-24
**Task:** Development Environment Configuration and Setup Templates for Monefy PWA Clone
**Focus:** Comprehensive environment setup covering .env templates, Firebase setup, local development, Git hooks, Docker, database seeding, and troubleshooting

---

## Table of Contents
1. [Environment Variables Configuration](#environment-variables-configuration)
2. [Firebase Project Setup Guide](#firebase-project-setup-guide)
3. [Local Development Environment Setup](#local-development-environment-setup)
4. [Git Hooks and Pre-commit Configuration](#git-hooks-and-pre-commit-configuration)
5. [Docker Containerization](#docker-containerization)
6. [Database Seeding and Initial Data](#database-seeding-and-initial-data)
7. [Zero-Cost Deployment Setup](#zero-cost-deployment-setup)
8. [Development Workflow Patterns](#development-workflow-patterns)
9. [Troubleshooting Guide](#troubleshooting-guide)

---

## Environment Variables Configuration

### Development Environment (.env.local)
```bash
# Application Configuration
VITE_APP_NAME="Monefy PWA Clone"
VITE_APP_VERSION="1.0.0"
VITE_APP_ENVIRONMENT="development"
VITE_DEBUG_MODE=true

# Firebase Configuration (Development)
VITE_FIREBASE_API_KEY="your-dev-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project-dev.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-dev"
VITE_FIREBASE_STORAGE_BUCKET="your-project-dev.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
VITE_FIREBASE_APP_ID="1:123456789012:web:abcdef123456"
VITE_FIREBASE_MEASUREMENT_ID="G-XXXXXXXXXX"

# Firebase Emulator Configuration (Local Development)
VITE_USE_FIREBASE_EMULATOR=true
VITE_FIREBASE_EMULATOR_HOST="localhost"
VITE_FIRESTORE_EMULATOR_PORT=8080
VITE_AUTH_EMULATOR_PORT=9099

# PWA Configuration
VITE_PWA_ENABLE_SW=true
VITE_PWA_SW_SCOPE="/"
VITE_PWA_CACHE_NAME="monefy-pwa-cache-v1"

# Feature Flags
VITE_ENABLE_OFFLINE_SYNC=true
VITE_ENABLE_MULTI_USER=true
VITE_MAX_USERS=2
VITE_ENABLE_ANALYTICS=false

# Security Configuration
VITE_ENABLE_HTTPS_REDIRECT=false
VITE_SESSION_TIMEOUT=3600000
VITE_MAX_LOGIN_ATTEMPTS=5

# API Configuration
VITE_API_TIMEOUT=10000
VITE_RETRY_ATTEMPTS=3
VITE_RETRY_DELAY=1000

# UI Configuration
VITE_DEFAULT_CURRENCY="USD"
VITE_DEFAULT_LANGUAGE="en"
VITE_THEME="light"
VITE_ENABLE_DARK_MODE=true

# Development Tools
VITE_ENABLE_REDUX_DEVTOOLS=true
VITE_ENABLE_REACT_DEVTOOLS=true
VITE_SHOW_PERFORMANCE_METRICS=true
```

### Production Environment (.env.production)
```bash
# Application Configuration
VITE_APP_NAME="Monefy PWA Clone"
VITE_APP_VERSION="1.0.0"
VITE_APP_ENVIRONMENT="production"
VITE_DEBUG_MODE=false

# Firebase Configuration (Production)
VITE_FIREBASE_API_KEY="your-prod-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project-prod.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-prod"
VITE_FIREBASE_STORAGE_BUCKET="your-project-prod.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
VITE_FIREBASE_APP_ID="1:123456789012:web:prodabcdef123456"
VITE_FIREBASE_MEASUREMENT_ID="G-YYYYYYYYYY"

# Firebase Emulator Configuration (Disabled in Production)
VITE_USE_FIREBASE_EMULATOR=false

# PWA Configuration
VITE_PWA_ENABLE_SW=true
VITE_PWA_SW_SCOPE="/"
VITE_PWA_CACHE_NAME="monefy-pwa-cache-v1"

# Feature Flags
VITE_ENABLE_OFFLINE_SYNC=true
VITE_ENABLE_MULTI_USER=true
VITE_MAX_USERS=2
VITE_ENABLE_ANALYTICS=true

# Security Configuration
VITE_ENABLE_HTTPS_REDIRECT=true
VITE_SESSION_TIMEOUT=1800000
VITE_MAX_LOGIN_ATTEMPTS=3

# API Configuration
VITE_API_TIMEOUT=15000
VITE_RETRY_ATTEMPTS=2
VITE_RETRY_DELAY=2000

# UI Configuration
VITE_DEFAULT_CURRENCY="USD"
VITE_DEFAULT_LANGUAGE="en"
VITE_THEME="light"
VITE_ENABLE_DARK_MODE=true

# Development Tools (Disabled in Production)
VITE_ENABLE_REDUX_DEVTOOLS=false
VITE_ENABLE_REACT_DEVTOOLS=false
VITE_SHOW_PERFORMANCE_METRICS=false
```

### Staging Environment (.env.staging)
```bash
# Application Configuration
VITE_APP_NAME="Monefy PWA Clone (Staging)"
VITE_APP_VERSION="1.0.0-staging"
VITE_APP_ENVIRONMENT="staging"
VITE_DEBUG_MODE=true

# Firebase Configuration (Staging)
VITE_FIREBASE_API_KEY="your-staging-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project-staging.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-staging"
VITE_FIREBASE_STORAGE_BUCKET="your-project-staging.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
VITE_FIREBASE_APP_ID="1:123456789012:web:stagingabcdef123456"
VITE_FIREBASE_MEASUREMENT_ID="G-ZZZZZZZZZZ"

# Firebase Emulator Configuration
VITE_USE_FIREBASE_EMULATOR=false

# PWA Configuration
VITE_PWA_ENABLE_SW=true
VITE_PWA_SW_SCOPE="/"
VITE_PWA_CACHE_NAME="monefy-pwa-staging-cache-v1"

# Feature Flags
VITE_ENABLE_OFFLINE_SYNC=true
VITE_ENABLE_MULTI_USER=true
VITE_MAX_USERS=2
VITE_ENABLE_ANALYTICS=true

# Security Configuration
VITE_ENABLE_HTTPS_REDIRECT=true
VITE_SESSION_TIMEOUT=3600000
VITE_MAX_LOGIN_ATTEMPTS=5

# API Configuration
VITE_API_TIMEOUT=12000
VITE_RETRY_ATTEMPTS=3
VITE_RETRY_DELAY=1500

# UI Configuration
VITE_DEFAULT_CURRENCY="USD"
VITE_DEFAULT_LANGUAGE="en"
VITE_THEME="light"
VITE_ENABLE_DARK_MODE=true

# Development Tools (Enabled for Testing)
VITE_ENABLE_REDUX_DEVTOOLS=true
VITE_ENABLE_REACT_DEVTOOLS=true
VITE_SHOW_PERFORMANCE_METRICS=true
```

### Environment Configuration Best Practices

#### 1. Environment File Management
```bash
# .env files hierarchy (order of precedence)
.env.local          # Loaded in all environments except test (highest priority)
.env.development    # Loaded in development environment
.env.production     # Loaded in production environment
.env.staging        # Loaded in staging environment
.env                # Default fallback (lowest priority)
```

#### 2. Security Guidelines
- Never commit sensitive environment files to version control
- Use different Firebase projects for different environments
- Rotate API keys regularly
- Implement proper CORS configuration for production
- Use HTTPS in production and staging environments

#### 3. Environment Validation Script
Create `scripts/validate-env.js`:
```javascript
#!/usr/bin/env node

const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const optionalEnvVars = [
  'VITE_FIREBASE_MEASUREMENT_ID',
  'VITE_DEFAULT_CURRENCY',
  'VITE_DEFAULT_LANGUAGE'
];

function validateEnvironment() {
  const missing = [];
  const warnings = [];

  // Check required variables
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  // Check optional variables
  optionalEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  });

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`  - ${varName}`));
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('⚠️ Missing optional environment variables:');
    warnings.forEach(varName => console.warn(`  - ${varName}`));
  }

  console.log('✅ Environment validation passed');
}

validateEnvironment();
```

---

## Firebase Project Setup Guide

### Step 1: Create Firebase Project

#### 1.1 Access Firebase Console
1. Navigate to [Firebase Console](https://console.firebase.google.com/)
2. Sign in with your Google account
3. Click "Create a project" or "Add project"

#### 1.2 Project Configuration
```
Project Name: monefy-pwa-clone-dev (for development)
Project ID: monefy-pwa-clone-dev (auto-generated, can be customized)
Analytics: Enable Google Analytics (recommended)
Analytics Account: Default Account for Firebase or create new
```

#### 1.3 Project Settings
After project creation:
1. Click on the gear icon (Project Settings)
2. Note down the Project ID
3. Scroll down to "Your apps" section

### Step 2: Web App Registration

#### 2.1 Add Web App
1. Click on the Web icon (</>) in "Your apps" section
2. App nickname: `Monefy PWA Clone`
3. Check "Also set up Firebase Hosting for this app"
4. Click "Register app"

#### 2.2 Firebase SDK Configuration
Copy the configuration object:
```javascript
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX"
};
```

### Step 3: Enable Required Services

#### 3.1 Authentication Setup
1. Navigate to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable the following providers:
   - Email/Password (Native provider)
   - Google (recommended for ease of use)

#### 3.2 Firestore Database Setup
1. Navigate to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select a location (choose closest to your users)
5. Click "Done"

#### 3.3 Security Rules Configuration
Update Firestore Security Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow access to shared household data
      match /households/{householdId} {
        allow read, write: if request.auth != null && 
          (request.auth.uid == userId || 
           resource.data.members[request.auth.uid] != null);
      }
    }
    
    // Transactions collection
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         resource.data.householdMembers[request.auth.uid] != null);
    }
    
    // Categories collection (read-only for all authenticated users)
    match /categories/{categoryId} {
      allow read: if request.auth != null;
      allow write: if false; // Categories are managed by admin only
    }
  }
}
```

### Step 4: Firebase Hosting Setup

#### 4.1 Install Firebase CLI
```bash
# Install globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init
```

#### 4.2 Firebase Initialization
Select the following options:
```
? Which Firebase features do you want to set up?
  ◉ Firestore: Configure security rules and indexes
  ◉ Hosting: Configure files for Firebase Hosting
  ◉ Emulators: Set up local emulators

? Select a default Firebase project:
  > monefy-pwa-clone-dev (your-project-id)

? What file should be used for Firestore Rules?
  > firestore.rules

? What file should be used for Firestore indexes?
  > firestore.indexes.json

? What do you want to use as your public directory?
  > dist

? Configure as a single-page app (rewrite all urls to /index.html)?
  > Yes

? Set up automatic builds and deploys with GitHub?
  > Yes (if using GitHub Actions)

? Which emulators would you like to set up?
  ◉ Authentication Emulator
  ◉ Firestore Emulator
  ◉ Hosting Emulator
```

### Step 5: Environment-Specific Projects

#### 5.1 Create Multiple Projects
For proper CI/CD, create separate Firebase projects:

**Development Project:**
- Project ID: `monefy-pwa-clone-dev`
- Usage: Local development and testing

**Staging Project:**
- Project ID: `monefy-pwa-clone-staging`
- Usage: Pre-production testing

**Production Project:**
- Project ID: `monefy-pwa-clone-prod`
- Usage: Live application

#### 5.2 Firebase Projects Configuration
Create `.firebaserc` file:
```json
{
  "projects": {
    "default": "monefy-pwa-clone-dev",
    "development": "monefy-pwa-clone-dev",
    "staging": "monefy-pwa-clone-staging",
    "production": "monefy-pwa-clone-prod"
  },
  "targets": {},
  "etags": {}
}
```

### Step 6: Firebase Configuration Files

#### 6.1 firebase.json
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "sw.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      }
    ]
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "hosting": {
      "port": 5000
    },
    "ui": {
      "enabled": true,
      "port": 4000
    },
    "singleProjectMode": true
  }
}
```

#### 6.2 firestore.indexes.json
```json
{
  "indexes": [
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "householdId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "category",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

### Step 7: Firebase Emulator Setup

#### 7.1 Start Emulators
```bash
# Start all emulators
firebase emulators:start

# Start specific emulators
firebase emulators:start --only firestore,auth

# Start with import data
firebase emulators:start --import=./firebase-export

# Start and export data on exit
firebase emulators:start --export-on-exit=./firebase-export
```

#### 7.2 Emulator Configuration for Development
Add to `src/config/firebase.js`:
```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  // Your config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Connect to emulators in development
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099');
  } catch (error) {
    // Emulators already connected
    console.log('Emulators already connected');
  }
}

export { db, auth };
```

---

## Local Development Environment Setup

### Prerequisites Installation

#### Node.js Setup
```bash
# Install Node.js (LTS version recommended)
# Download from: https://nodejs.org/

# Verify installation
node --version  # Should be >= 18.0.0
npm --version   # Should be >= 8.0.0

# Alternative: Use Node Version Manager (nvm)
# Windows: Install nvm-windows
# macOS/Linux: Install nvm

# Install and use specific Node version
nvm install 18.17.0
nvm use 18.17.0
```

#### Package Manager Setup
```bash
# Option 1: Use npm (included with Node.js)
npm --version

# Option 2: Install Yarn (recommended)
npm install -g yarn
yarn --version

# Option 3: Install pnpm (fastest)
npm install -g pnpm
pnpm --version
```

### Project Initialization

#### 1. Create Project Structure
```bash
# Create project directory
mkdir monefy-pwa-clone
cd monefy-pwa-clone

# Initialize Git repository
git init
git branch -M main

# Create React + Vite project
npm create vite@latest . -- --template react
# or
yarn create vite . --template react
# or
pnpm create vite . --template react
```

#### 2. Install Dependencies
```bash
# Core dependencies
npm install

# Additional required packages
npm install firebase
npm install @vite-pwa/vite-plugin
npm install workbox-window
npm install zustand
npm install react-router-dom
npm install react-hook-form
npm install @hookform/resolvers
npm install yup
npm install date-fns
npm install react-hot-toast

# UI and Styling
npm install tailwindcss
npm install @headlessui/react
npm install @heroicons/react
npm install clsx
npm install tailwind-merge

# Development dependencies
npm install -D @types/react
npm install -D @types/react-dom
npm install -D @vitejs/plugin-react
npm install -D autoprefixer
npm install -D postcss
npm install -D eslint
npm install -D prettier
npm install -D husky
npm install -D lint-staged
npm install -D @typescript-eslint/eslint-plugin
npm install -D @typescript-eslint/parser
npm install -D vite-plugin-eslint
```

#### 3. Project Structure Setup
```
monefy-pwa-clone/
├── public/
│   ├── icons/
│   │   ├── icon-192x192.png
│   │   ├── icon-512x512.png
│   │   └── favicon.ico
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── forms/
│   │   ├── layout/
│   │   └── ui/
│   ├── hooks/
│   ├── services/
│   │   ├── firebase/
│   │   └── api/
│   ├── stores/
│   ├── utils/
│   ├── styles/
│   ├── types/
│   └── pages/
├── scripts/
├── docs/
├── .env.example
├── .env.local
├── .gitignore
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── firebase.json
├── .firebaserc
└── README.md
```

### Development Tools Configuration

#### 1. VS Code Setup
Install recommended extensions:
```json
// .vscode/extensions.json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-typescript-next",
    "usernamehw.errorlens",
    "gruntfuggly.todo-tree",
    "ms-vscode.vscode-json"
  ]
}
```

VS Code settings:
```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  },
  "tailwindCSS.includeLanguages": {
    "javascript": "javascript",
    "html": "HTML"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

#### 2. Prettier Configuration
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid"
}
```

```
// .prettierignore
node_modules
dist
build
coverage
.next
.nuxt
.vscode
.idea
*.log
package-lock.json
yarn.lock
pnpm-lock.yaml
```

#### 3. ESLint Configuration
```json
// .eslintrc.json
{
  "root": true,
  "env": {
    "browser": true,
    "es2020": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended"
  ],
  "ignorePatterns": ["dist", ".eslintrc.cjs"],
  "parser": "@typescript-eslint/parser",
  "plugins": ["react-refresh"],
  "rules": {
    "react-refresh/only-export-components": [
      "warn",
      { "allowConstantExport": true }
    ],
    "react/prop-types": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "prefer-const": "error",
    "no-var": "error"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

#### 4. Vite Configuration
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import eslint from 'vite-plugin-eslint';

export default defineConfig({
  plugins: [
    react(),
    eslint(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheKeyWillBeUsed: async ({ request }) => {
                return `${request.url}?${new Date().getTime()}`;
              },
            },
          },
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Monefy PWA Clone',
        short_name: 'Monefy',
        description: 'Personal expense tracker with offline capabilities',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3000,
    open: true,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

#### 5. Tailwind CSS Configuration
```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        expense: {
          500: '#ef4444',
          600: '#dc2626',
        },
        income: {
          500: '#10b981',
          600: '#059669',
        },
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
```

```css
/* src/styles/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: 'Inter', system-ui, sans-serif;
  }
  
  body {
    @apply bg-gray-50 text-gray-900;
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors;
  }
  
  .btn-secondary {
    @apply bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors;
  }
  
  .card {
    @apply bg-white rounded-lg shadow-sm border border-gray-200 p-4;
  }
}
```

### Development Scripts

#### Package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext js,jsx,ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext js,jsx,ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{js,jsx,ts,tsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{js,jsx,ts,tsx,json,css,md}\"",
    "type-check": "tsc --noEmit",
    "firebase:emulators": "firebase emulators:start",
    "firebase:deploy:dev": "firebase use development && firebase deploy",
    "firebase:deploy:staging": "firebase use staging && firebase deploy",
    "firebase:deploy:prod": "firebase use production && firebase deploy",
    "validate-env": "node scripts/validate-env.js",
    "prepare": "husky install",
    "test": "echo \"Add tests here\"",
    "build:analyze": "vite build --mode analyze"
  }
}
```

### Environment Setup Verification

#### Health Check Script
Create `scripts/health-check.js`:
```javascript
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function checkCommand(command, name) {
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(`✅ ${name}: ${output.trim()}`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}: Not installed or not in PATH`);
    return false;
  }
}

function checkFile(filePath, name) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${name}: Found`);
    return true;
  } else {
    console.log(`❌ ${name}: Missing`);
    return false;
  }
}

function runHealthCheck() {
  console.log('🏥 Development Environment Health Check\n');

  let allGood = true;

  // Check Node.js and npm
  allGood &= checkCommand('node --version', 'Node.js');
  allGood &= checkCommand('npm --version', 'npm');

  // Check optional tools
  checkCommand('yarn --version', 'Yarn (optional)');
  checkCommand('pnpm --version', 'pnpm (optional)');

  // Check Firebase CLI
  allGood &= checkCommand('firebase --version', 'Firebase CLI');

  // Check Git
  allGood &= checkCommand('git --version', 'Git');

  console.log('\n📁 Project Files:');
  
  // Check important files
  allGood &= checkFile('package.json', 'package.json');
  allGood &= checkFile('vite.config.js', 'vite.config.js');
  allGood &= checkFile('.env.local', '.env.local');
  allGood &= checkFile('firebase.json', 'firebase.json');
  allGood &= checkFile('.firebaserc', '.firebaserc');

  console.log('\n🔧 Dependencies:');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = ['react', 'firebase', 'vite'];
    
    requiredDeps.forEach(dep => {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
      } else {
        console.log(`❌ ${dep}: Missing from dependencies`);
        allGood = false;
      }
    });
  } catch (error) {
    console.log('❌ Cannot read package.json');
    allGood = false;
  }

  console.log('\n' + '='.repeat(50));
  
  if (allGood) {
    console.log('🎉 All checks passed! Your environment is ready for development.');
  } else {
    console.log('⚠️ Some issues found. Please resolve them before starting development.');
    process.exit(1);
  }
}

runHealthCheck();
```

Make it executable and add to package.json:
```json
{
  "scripts": {
    "health-check": "node scripts/health-check.js"
  }
}
```

---

## Git Hooks and Pre-commit Configuration

### Husky Setup

#### 1. Install and Initialize Husky
```bash
# Install husky
npm install -D husky

# Initialize husky
npx husky-init

# Or manually create
npx husky install
```

#### 2. Configure Package.json
```json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,css,md}": [
      "prettier --write"
    ]
  }
}
```

#### 3. Install lint-staged
```bash
npm install -D lint-staged
```

### Git Hooks Configuration

#### Pre-commit Hook
Create `.husky/pre-commit`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Run lint-staged
npx lint-staged

# Validate environment variables
npm run validate-env

# Type checking
npm run type-check

echo "✅ Pre-commit checks passed!"
```

#### Pre-push Hook
Create `.husky/pre-push`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🚀 Running pre-push checks..."

# Get current branch
branch=$(git rev-parse --abbrev-ref HEAD)

# Prevent pushing to main/production branches directly
if [ "$branch" = "main" ] || [ "$branch" = "production" ]; then
    echo "❌ Direct push to $branch branch is not allowed!"
    echo "Please create a pull request instead."
    exit 1
fi

# Run build to ensure code compiles
echo "🏗️ Building project..."
npm run build

# Run tests if available
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    echo "🧪 Running tests..."
    npm test
fi

echo "✅ Pre-push checks passed!"
```

#### Commit Message Hook
Create `.husky/commit-msg`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Commit message format validation
commit_msg_file=$1
commit_msg=$(cat $commit_msg_file)

# Define the pattern for conventional commits
pattern="^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?: .{1,50}"

if [[ ! $commit_msg =~ $pattern ]]; then
    echo "❌ Invalid commit message format!"
    echo ""
    echo "Commit message must follow the conventional commits format:"
    echo "type(scope): description"
    echo ""
    echo "Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert"
    echo "Example: feat(auth): add user authentication"
    echo "Example: fix(ui): correct button alignment issue"
    echo ""
    exit 1
fi

echo "✅ Commit message format is valid!"
```

### Conventional Commits Configuration

#### Commitizen Setup
```bash
# Install commitizen globally
npm install -g commitizen

# Install conventional changelog adapter
npm install -D cz-conventional-changelog

# Configure package.json
```

Add to package.json:
```json
{
  "config": {
    "commitizen": {
      "path": "./node_modules/cz-conventional-changelog"
    }
  },
  "scripts": {
    "commit": "cz"
  }
}
```

#### Custom Commit Types
Create `.czrc`:
```json
{
  "path": "cz-conventional-changelog",
  "types": {
    "feat": "A new feature",
    "fix": "A bug fix",
    "docs": "Documentation only changes",
    "style": "Changes that do not affect the meaning of the code",
    "refactor": "A code change that neither fixes a bug nor adds a feature",
    "perf": "A code change that improves performance",
    "test": "Adding missing tests or correcting existing tests",
    "build": "Changes that affect the build system or external dependencies",
    "ci": "Changes to our CI configuration files and scripts",
    "chore": "Other changes that don't modify src or test files",
    "revert": "Reverts a previous commit"
  },
  "scopes": [
    "auth",
    "ui",
    "api",
    "database",
    "pwa",
    "firebase",
    "components",
    "utils",
    "config",
    "deps"
  ]
}
```

### Branch Protection and Workflow

#### Git Workflow Configuration
Create `.github/workflows/ci.yml`:
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run linting
      run: npm run lint
      
    - name: Run type checking
      run: npm run type-check
      
    - name: Run tests
      run: npm test
      
    - name: Build project
      run: npm run build
      
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: build-files
        path: dist/

  deploy-staging:
    needs: lint-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build for staging
      run: npm run build
      env:
        VITE_APP_ENVIRONMENT: staging
        
    - name: Deploy to Firebase Staging
      uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: '${{ secrets.GITHUB_TOKEN }}'
        firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT_STAGING }}'
        projectId: monefy-pwa-clone-staging
        channelId: live

  deploy-production:
    needs: lint-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build for production
      run: npm run build
      env:
        VITE_APP_ENVIRONMENT: production
        
    - name: Deploy to Firebase Production
      uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: '${{ secrets.GITHUB_TOKEN }}'
        firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT_PRODUCTION }}'
        projectId: monefy-pwa-clone-prod
        channelId: live
```

#### Branch Protection Rules
Configure in GitHub repository settings:
```
Branch: main
- Require a pull request before merging
- Require approvals: 1
- Dismiss stale PR approvals when new commits are pushed
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Require conversation resolution before merging
- Restrict pushes that create files larger than 100MB

Branch: develop  
- Require a pull request before merging
- Require status checks to pass before merging
- Require branches to be up to date before merging
```

---

## Docker Containerization

### Development Docker Setup

#### 1. Dockerfile for Development
Create `Dockerfile.dev`:
```dockerfile
# Development Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

#### 2. Production Dockerfile
Create `Dockerfile`:
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### 3. Nginx Configuration
Create `nginx.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Don't cache the service worker
        location /sw.js {
            add_header Cache-Control "no-cache";
            proxy_cache_bypass $http_pragma;
            proxy_cache_revalidate on;
            expires off;
            access_log off;
        }

        # Don't cache the web app manifest
        location /manifest.json {
            add_header Cache-Control "no-cache";
            expires off;
        }
    }
}
```

### Docker Compose Setup

#### 1. Development Environment
Create `docker-compose.dev.yml`:
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - CHOKIDAR_USEPOLLING=true
    env_file:
      - .env.local
    depends_on:
      - firebase-emulator

  firebase-emulator:
    image: node:18-alpine
    working_dir: /app
    volumes:
      - .:/app
    ports:
      - "4000:4000"  # Emulator UI
      - "8080:8080"  # Firestore
      - "9099:9099"  # Authentication
      - "5000:5000"  # Hosting
    command: >
      sh -c "
        npm install -g firebase-tools &&
        firebase emulators:start --import=./firebase-export --export-on-exit=./firebase-export
      "
    env_file:
      - .env.local

volumes:
  node_modules:
```

#### 2. Production Environment
Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    
  # Optional: Add monitoring
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana
    restart: unless-stopped

volumes:
  grafana-storage:
```

#### 3. Testing Environment
Create `docker-compose.test.yml`:
```yaml
version: '3.8'

services:
  test:
    build:
      context: .
      dockerfile: Dockerfile.test
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - CI=true
    command: npm test -- --coverage --watchAll=false

  e2e-test:
    build:
      context: .
      dockerfile: Dockerfile.e2e
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - CI=true
    depends_on:
      - app
    command: npm run test:e2e
```

### Docker Development Workflow

#### 1. Development Scripts
Add to package.json:
```json
{
  "scripts": {
    "docker:dev": "docker-compose -f docker-compose.dev.yml up",
    "docker:dev:build": "docker-compose -f docker-compose.dev.yml up --build",
    "docker:prod": "docker-compose -f docker-compose.prod.yml up",
    "docker:test": "docker-compose -f docker-compose.test.yml up --abort-on-container-exit",
    "docker:clean": "docker-compose down -v && docker system prune -f"
  }
}
```

#### 2. .dockerignore
```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.env.local
.env.production
.nyc_output
coverage
.vscode
.idea
dist
build
```

#### 3. Docker Health Checks
Add to Dockerfile:
```dockerfile
# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1
```

### Container Optimization

#### 1. Multi-stage Build Optimization
```dockerfile
# Optimized production build
FROM node:18-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
RUN apk add --no-cache curl
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

#### 2. Build Optimization Script
Create `scripts/docker-optimize.sh`:
```bash
#!/bin/bash

echo "🐳 Optimizing Docker build..."

# Build with specific target
docker build --target builder -t monefy-pwa:builder .

# Build production image
docker build -t monefy-pwa:latest .

# Analyze image size
docker images monefy-pwa:latest

# Security scan (if available)
if command -v trivy &> /dev/null; then
    echo "🔍 Running security scan..."
    trivy image monefy-pwa:latest
fi

echo "✅ Docker optimization complete!"
```

---

## Database Seeding and Initial Data

### Firestore Data Structure

#### 1. Collections Schema
```javascript
// src/config/firestore-schema.js
export const COLLECTIONS = {
  USERS: 'users',
  HOUSEHOLDS: 'households',
  TRANSACTIONS: 'transactions',
  CATEGORIES: 'categories',
  BUDGETS: 'budgets',
  RECURRING_TRANSACTIONS: 'recurringTransactions'
};

export const USER_SCHEMA = {
  uid: 'string',
  email: 'string',
  displayName: 'string',
  photoURL: 'string',
  householdId: 'string',
  preferences: {
    currency: 'string',
    language: 'string',
    theme: 'string',
    notifications: 'boolean'
  },
  createdAt: 'timestamp',
  updatedAt: 'timestamp'
};

export const HOUSEHOLD_SCHEMA = {
  id: 'string',
  name: 'string',
  members: {
    '[userId]': {
      role: 'admin|member',
      joinedAt: 'timestamp'
    }
  },
  settings: {
    currency: 'string',
    sharedCategories: 'boolean',
    requireApproval: 'boolean'
  },
  createdAt: 'timestamp',
  updatedAt: 'timestamp'
};

export const TRANSACTION_SCHEMA = {
  id: 'string',
  userId: 'string',
  householdId: 'string',
  type: 'income|expense',
  amount: 'number',
  currency: 'string',
  category: 'string',
  subcategory: 'string',
  description: 'string',
  date: 'timestamp',
  recurring: 'boolean',
  recurringId: 'string',
  tags: 'array',
  location: {
    lat: 'number',
    lng: 'number',
    address: 'string'
  },
  createdAt: 'timestamp',
  updatedAt: 'timestamp'
};

export const CATEGORY_SCHEMA = {
  id: 'string',
  name: 'string',
  type: 'income|expense',
  icon: 'string',
  color: 'string',
  parentId: 'string',
  isDefault: 'boolean',
  isActive: 'boolean',
  order: 'number',
  createdAt: 'timestamp'
};
```

### Seeding Scripts

#### 1. Main Seeding Script
Create `scripts/seed-database.js`:
```javascript
#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  writeBatch,
  connectFirestoreEmulator 
} from 'firebase/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Firebase configuration (use emulator for seeding)
const firebaseConfig = {
  projectId: "monefy-pwa-clone-dev"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to emulator for seeding
try {
  connectFirestoreEmulator(db, 'localhost', 8080);
  console.log('Connected to Firestore emulator');
} catch (error) {
  console.log('Emulator already connected or not available');
}

// Load seed data
function loadSeedData(filename) {
  const filePath = join(__dirname, 'seed-data', filename);
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

// Seed categories
async function seedCategories() {
  console.log('🌱 Seeding categories...');
  
  const categories = loadSeedData('categories.json');
  const batch = writeBatch(db);
  
  categories.forEach(category => {
    const docRef = doc(collection(db, 'categories'));
    batch.set(docRef, {
      ...category,
      id: docRef.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });
  
  await batch.commit();
  console.log(`✅ Seeded ${categories.length} categories`);
}

// Seed sample users
async function seedUsers() {
  console.log('🌱 Seeding sample users...');
  
  const users = loadSeedData('users.json');
  
  for (const user of users) {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      ...user,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  console.log(`✅ Seeded ${users.length} users`);
}

// Seed sample households
async function seedHouseholds() {
  console.log('🌱 Seeding sample households...');
  
  const households = loadSeedData('households.json');
  
  for (const household of households) {
    const householdRef = doc(db, 'households', household.id);
    await setDoc(householdRef, {
      ...household,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  console.log(`✅ Seeded ${households.length} households`);
}

// Seed sample transactions
async function seedTransactions() {
  console.log('🌱 Seeding sample transactions...');
  
  const transactions = loadSeedData('transactions.json');
  const batch = writeBatch(db);
  
  transactions.forEach(transaction => {
    const docRef = doc(collection(db, 'transactions'));
    batch.set(docRef, {
      ...transaction,
      id: docRef.id,
      date: new Date(transaction.date),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });
  
  await batch.commit();
  console.log(`✅ Seeded ${transactions.length} transactions`);
}

// Main seeding function
async function seedDatabase() {
  try {
    console.log('🚀 Starting database seeding...\n');
    
    await seedCategories();
    await seedUsers();
    await seedHouseholds();
    await seedTransactions();
    
    console.log('\n🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export { seedDatabase };
```

#### 2. Categories Seed Data
Create `scripts/seed-data/categories.json`:
```json
[
  {
    "name": "Food & Dining",
    "type": "expense",
    "icon": "🍽️",
    "color": "#FF6B6B",
    "parentId": null,
    "isDefault": true,
    "isActive": true,
    "order": 1
  },
  {
    "name": "Groceries",
    "type": "expense",
    "icon": "🛒",
    "color": "#4ECDC4",
    "parentId": null,
    "isDefault": true,
    "isActive": true,
    "order": 2
  },
  {
    "name": "Transportation",
    "type": "expense",
    "icon": "🚗",
    "color": "#45B7D1",
    "parentId": null,
    "isDefault": true,
    "isActive": true,
    "order": 3
  },
  {
    "name": "Gas",
    "type": "expense",
    "icon": "⛽",
    "color": "#FFA07A",
    "parentId": null,
    "isDefault": true,
    "isActive": true,
    "order": 4
  },
  {
    "name": "Entertainment",
    "type": "expense",
    "icon": "🎬",
    "color": "#98D8C8",
    "parentId": null,
    "isDefault": true,
    "isActive": true,
    "order": 5
  },
  {
    "name": "Healthcare",
    "type": "expense",
    "icon": "🏥",
    "color": "#F7DC6F",
    "parentId": null,
    "isDefault": true,
    "isActive": true,
    "order": 6
  },
  {
    "name": "Shopping",
    "type": "expense",
    "icon": "🛍️",
    "color": "#BB8FCE",
    "parentId": null,
    "isDefault": true,
    "isActive": true,
    "order": 7
  },
  {
    "name": "Bills & Utilities",
    "type": "expense",
    "icon": "💡",
    "color": "#85C1E9",
    "parentId": null,
    "isDefault": true,
    "isActive": true,
    "order": 8
  },
  {
    "name": "Salary",
    "type": "income",
    "icon": "💰",
    "color": "#58D68D",
    "parentId": null,
    "isDefault": true,
    "isActive": true,
    "order": 9
  },
  {
    "name": "Freelance",
    "type": "income",
    "icon": "💼",
    "color": "#82E0AA",
    "parentId": null,
    "isDefault": true,
    "isActive": true,
    "order": 10
  },
  {
    "name": "Investment",
    "type": "income",
    "icon": "📈",
    "color": "#A9DFBF",
    "parentId": null,
    "isDefault": true,
    "isActive": true,
    "order": 11
  },
  {
    "name": "Gift",
    "type": "income",
    "icon": "🎁",
    "color": "#D5F4E6",
    "parentId": null,
    "isDefault": true,
    "isActive": true,
    "order": 12
  }
]
```

#### 3. Users Seed Data
Create `scripts/seed-data/users.json`:
```json
[
  {
    "uid": "demo-user-1",
    "email": "demo1@example.com",
    "displayName": "Demo User 1",
    "photoURL": null,
    "householdId": "demo-household-1",
    "preferences": {
      "currency": "USD",
      "language": "en",
      "theme": "light",
      "notifications": true
    }
  },
  {
    "uid": "demo-user-2",
    "email": "demo2@example.com",
    "displayName": "Demo User 2",
    "photoURL": null,
    "householdId": "demo-household-1",
    "preferences": {
      "currency": "USD",
      "language": "en",
      "theme": "dark",
      "notifications": false
    }
  }
]
```

#### 4. Households Seed Data
Create `scripts/seed-data/households.json`:
```json
[
  {
    "id": "demo-household-1",
    "name": "Demo Family",
    "members": {
      "demo-user-1": {
        "role": "admin",
        "joinedAt": "2024-01-01T00:00:00.000Z"
      },
      "demo-user-2": {
        "role": "member",
        "joinedAt": "2024-01-02T00:00:00.000Z"
      }
    },
    "settings": {
      "currency": "USD",
      "sharedCategories": true,
      "requireApproval": false
    }
  }
]
```

#### 5. Sample Transactions Data
Create `scripts/seed-data/transactions.json`:
```json
[
  {
    "userId": "demo-user-1",
    "householdId": "demo-household-1",
    "type": "expense",
    "amount": 25.50,
    "currency": "USD",
    "category": "Food & Dining",
    "subcategory": "Restaurant",
    "description": "Lunch at cafe",
    "date": "2024-01-15T12:30:00.000Z",
    "recurring": false,
    "tags": ["lunch", "weekend"]
  },
  {
    "userId": "demo-user-1",
    "householdId": "demo-household-1",
    "type": "expense",
    "amount": 89.99,
    "currency": "USD",
    "category": "Groceries",
    "subcategory": "Supermarket",
    "description": "Weekly grocery shopping",
    "date": "2024-01-14T16:45:00.000Z",
    "recurring": false,
    "tags": ["groceries", "weekly"]
  },
  {
    "userId": "demo-user-1",
    "householdId": "demo-household-1",
    "type": "income",
    "amount": 3500.00,
    "currency": "USD",
    "category": "Salary",
    "subcategory": "Monthly Salary",
    "description": "January salary",
    "date": "2024-01-01T09:00:00.000Z",
    "recurring": true,
    "tags": ["salary", "monthly"]
  },
  {
    "userId": "demo-user-2",
    "householdId": "demo-household-1",
    "type": "expense",
    "amount": 45.00,
    "currency": "USD",
    "category": "Gas",
    "subcategory": "Car",
    "description": "Gas station fill-up",
    "date": "2024-01-13T18:20:00.000Z",
    "recurring": false,
    "tags": ["gas", "car"]
  },
  {
    "userId": "demo-user-2",
    "householdId": "demo-household-1",
    "type": "expense",
    "amount": 120.00,
    "currency": "USD",
    "category": "Bills & Utilities",
    "subcategory": "Electricity",
    "description": "Monthly electricity bill",
    "date": "2024-01-12T10:00:00.000Z",
    "recurring": true,
    "tags": ["utilities", "monthly"]
  }
]
```

### Database Management Scripts

#### 1. Reset Database Script
Create `scripts/reset-database.js`:
```javascript
#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  deleteDoc,
  connectFirestoreEmulator 
} from 'firebase/firestore';

const firebaseConfig = {
  projectId: "monefy-pwa-clone-dev"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to emulator
try {
  connectFirestoreEmulator(db, 'localhost', 8080);
} catch (error) {
  console.log('Emulator connection error or already connected');
}

async function clearCollection(collectionName) {
  console.log(`🗑️ Clearing ${collectionName} collection...`);
  
  const snapshot = await getDocs(collection(db, collectionName));
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  
  await Promise.all(deletePromises);
  console.log(`✅ Cleared ${snapshot.docs.length} documents from ${collectionName}`);
}

async function resetDatabase() {
  try {
    console.log('🚀 Resetting database...\n');
    
    const collections = ['transactions', 'categories', 'users', 'households', 'budgets'];
    
    for (const collectionName of collections) {
      await clearCollection(collectionName);
    }
    
    console.log('\n🎉 Database reset completed!');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase();
```

#### 2. Backup Script
Create `scripts/backup-database.js`:
```javascript
#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs,
  connectFirestoreEmulator 
} from 'firebase/firestore';
import { writeFileSync } from 'fs';
import { join } from 'path';

const firebaseConfig = {
  projectId: "monefy-pwa-clone-dev"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to emulator if needed
if (process.env.USE_EMULATOR === 'true') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (error) {
    console.log('Emulator connection error or already connected');
  }
}

async function backupCollection(collectionName) {
  console.log(`📦 Backing up ${collectionName}...`);
  
  const snapshot = await getDocs(collection(db, collectionName));
  const documents = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  const filename = `backup-${collectionName}-${Date.now()}.json`;
  const filepath = join(process.cwd(), 'backups', filename);
  
  writeFileSync(filepath, JSON.stringify(documents, null, 2));
  console.log(`✅ Backed up ${documents.length} documents to ${filename}`);
  
  return documents.length;
}

async function backupDatabase() {
  try {
    console.log('📦 Starting database backup...\n');
    
    // Create backups directory if it doesn't exist
    const { mkdirSync } = await import('fs');
    const { existsSync } = await import('fs');
    
    if (!existsSync('backups')) {
      mkdirSync('backups');
    }
    
    const collections = ['transactions', 'categories', 'users', 'households', 'budgets'];
    let totalDocuments = 0;
    
    for (const collectionName of collections) {
      const count = await backupCollection(collectionName);
      totalDocuments += count;
    }
    
    console.log(`\n🎉 Backup completed! Total documents: ${totalDocuments}`);
  } catch (error) {
    console.error('❌ Error backing up database:', error);
    process.exit(1);
  }
}

backupDatabase();
```

#### 3. Database Management Package Scripts
Add to package.json:
```json
{
  "scripts": {
    "db:seed": "node scripts/seed-database.js",
    "db:reset": "node scripts/reset-database.js",
    "db:backup": "node scripts/backup-database.js",
    "db:reset-and-seed": "npm run db:reset && npm run db:seed",
    "db:backup-and-reset": "npm run db:backup && npm run db:reset"
  }
}
```

---

## Zero-Cost Deployment Setup

### Deployment Strategy Overview

#### Free Tier Limitations and Optimization
```
Firebase Hosting (Spark Plan):
- 10GB storage
- 10GB/month transfer
- Custom domain support
- SSL certificates included

Firestore (Spark Plan):
- 1GB storage
- 50,000 reads/day
- 20,000 writes/day
- 20,000 deletes/day

Firebase Authentication:
- Unlimited users on Spark plan
- Email/password and Google sign-in included

Vercel (Free Plan):
- 100GB bandwidth/month
- Unlimited personal projects
- Automatic HTTPS
- Edge Network
```

### Firebase Hosting Deployment

#### 1. Deployment Configuration
Update `firebase.json`:
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css|woff2)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "/sw.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          }
        ]
      },
      {
        "source": "/manifest.json",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=86400"
          }
        ]
      }
    ],
    "cleanUrls": true,
    "trailingSlash": false
  }
}
```

#### 2. Build Optimization for Deployment
Update `vite.config.js` for production:
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5000000, // 5MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Monefy PWA Clone',
        short_name: 'Monefy',
        description: 'Personal expense tracker with offline capabilities',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  build: {
    outDir: 'dist',
    sourcemap: mode === 'development',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
          router: ['react-router-dom'],
        },
      },
    },
  },
}));
```

#### 3. Automated Deployment Scripts
Create `scripts/deploy.sh`:
```bash
#!/bin/bash

set -e

echo "🚀 Starting deployment process..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please login first:"
    echo "firebase login"
    exit 1
fi

# Parse command line arguments
ENVIRONMENT=${1:-staging}
PROJECT_ID=""

case $ENVIRONMENT in
    "development"|"dev")
        PROJECT_ID="monefy-pwa-clone-dev"
        ;;
    "staging"|"stage")
        PROJECT_ID="monefy-pwa-clone-staging"
        ;;
    "production"|"prod")
        PROJECT_ID="monefy-pwa-clone-prod"
        ;;
    *)
        echo "❌ Invalid environment. Use: development, staging, or production"
        exit 1
        ;;
esac

echo "📦 Building for $ENVIRONMENT environment..."

# Set environment variables
export NODE_ENV=$ENVIRONMENT
export VITE_APP_ENVIRONMENT=$ENVIRONMENT

# Build the project
npm run build

echo "🔍 Running pre-deployment checks..."

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

# Check if index.html exists
if [ ! -f "dist/index.html" ]; then
    echo "❌ Build failed - index.html not found"
    exit 1
fi

echo "🚀 Deploying to Firebase Hosting ($PROJECT_ID)..."

# Deploy to Firebase
firebase use $PROJECT_ID
firebase deploy --only hosting

echo "✅ Deployment completed successfully!"
echo "🌐 Your app is live at: https://$PROJECT_ID.web.app"
```

Make it executable:
```bash
chmod +x scripts/deploy.sh
```

#### 4. Deployment Package Scripts
Add to package.json:
```json
{
  "scripts": {
    "deploy:dev": "./scripts/deploy.sh development",
    "deploy:staging": "./scripts/deploy.sh staging",
    "deploy:prod": "./scripts/deploy.sh production",
    "predeploy": "npm run lint && npm run build",
    "preview:build": "vite preview"
  }
}
```

### Vercel Deployment Alternative

#### 1. Vercel Configuration
Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/sw.js",
      "headers": {
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "buildCommand": "npm run build"
}
```

#### 2. Environment Variables on Vercel
Create `.env.example` for Vercel setup:
```bash
# Copy these to Vercel Environment Variables
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Netlify Deployment Alternative

#### 1. Netlify Configuration
Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_ENV = "production"
  
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "max-age=31536000"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "max-age=31536000"

[[headers]]
  for = "/*.woff2"
  [headers.values]
    Cache-Control = "max-age=31536000"
```

#### 2. Environment Variables Management
Create `scripts/env-manager.js`:
```javascript
#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const platforms = {
  vercel: {
    command: 'vercel env add',
    format: (key, value) => `${key} ${value}`
  },
  netlify: {
    command: 'netlify env:set',
    format: (key, value) => `${key} "${value}"`
  },
  firebase: {
    command: 'firebase functions:config:set',
    format: (key, value) => `${key.toLowerCase()}="${value}"`
  }
};

function loadEnvFile(filename) {
  try {
    const content = readFileSync(filename, 'utf8');
    const envVars = {};
    
    content.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    });
    
    return envVars;
  } catch (error) {
    console.error(`Error reading ${filename}:`, error.message);
    return {};
  }
}

function deployEnvVars(platform, envVars) {
  const config = platforms[platform];
  if (!config) {
    console.error(`Unsupported platform: ${platform}`);
    return;
  }
  
  console.log(`🚀 Deploying environment variables to ${platform}...`);
  
  Object.entries(envVars).forEach(([key, value]) => {
    if (key.startsWith('VITE_')) {
      try {
        const command = `${config.command} ${config.format(key, value)}`;
        execSync(command, { stdio: 'inherit' });
        console.log(`✅ Set ${key}`);
      } catch (error) {
        console.error(`❌ Failed to set ${key}:`, error.message);
      }
    }
  });
}

// CLI usage
const [,, platform, envFile = '.env.production'] = process.argv;

if (!platform || !platforms[platform]) {
  console.log('Usage: node scripts/env-manager.js <platform> [env-file]');
  console.log('Platforms:', Object.keys(platforms).join(', '));
  process.exit(1);
}

const envVars = loadEnvFile(envFile);
deployEnvVars(platform, envVars);
```

### Cost Optimization Strategies

#### 1. Firebase Usage Optimization
Create `src/utils/firebase-optimizer.js`:
```javascript
// Optimize Firestore reads/writes
export class FirestoreOptimizer {
  constructor() {
    this.cache = new Map();
    this.batchQueue = [];
    this.batchTimeout = null;
  }

  // Batch writes to reduce API calls
  batchWrite(operation) {
    this.batchQueue.push(operation);
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, 1000); // Wait 1 second before processing
  }

  async processBatch() {
    if (this.batchQueue.length === 0) return;
    
    const batch = writeBatch(db);
    this.batchQueue.forEach(operation => {
      operation(batch);
    });
    
    await batch.commit();
    this.batchQueue = [];
    this.batchTimeout = null;
  }

  // Client-side caching to reduce reads
  async getCachedDoc(docRef, cacheTimeMs = 300000) { // 5 minutes default
    const cacheKey = docRef.path;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cacheTimeMs) {
      return cached.data;
    }
    
    const docSnap = await getDoc(docRef);
    const data = docSnap.exists() ? docSnap.data() : null;
    
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }

  // Pagination to limit reads
  async getPaginatedDocs(query, pageSize = 25, lastDoc = null) {
    let paginatedQuery = query.limit(pageSize);
    
    if (lastDoc) {
      paginatedQuery = paginatedQuery.startAfter(lastDoc);
    }
    
    const snapshot = await getDocs(paginatedQuery);
    return {
      docs: snapshot.docs,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      hasMore: snapshot.docs.length === pageSize
    };
  }
}

export const firestoreOptimizer = new FirestoreOptimizer();
```

#### 2. Bundle Size Optimization
Create `scripts/analyze-bundle.js`:
```javascript
#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

function analyzeBundleSize() {
  console.log('📊 Analyzing bundle size...');
  
  // Build the project
  execSync('npm run build', { stdio: 'inherit' });
  
  // Read dist directory
  const distPath = join(process.cwd(), 'dist');
  const files = [];
  
  function readDirRecursive(dir) {
    const { readdirSync, statSync } = require('fs');
    const entries = readdirSync(dir);
    
    entries.forEach(entry => {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        readDirRecursive(fullPath);
      } else {
        const relativePath = fullPath.replace(distPath, '');
        files.push({
          path: relativePath,
          size: stat.size,
          type: entry.split('.').pop()
        });
      }
    });
  }
  
  readDirRecursive(distPath);
  
  // Group by type and calculate totals
  const grouped = files.reduce((acc, file) => {
    acc[file.type] = acc[file.type] || { count: 0, size: 0, files: [] };
    acc[file.type].count++;
    acc[file.type].size += file.size;
    acc[file.type].files.push(file);
    return acc;
  }, {});
  
  // Sort by size
  Object.values(grouped).forEach(group => {
    group.files.sort((a, b) => b.size - a.size);
  });
  
  // Display results
  console.log('\n📦 Bundle Analysis Results:\n');
  
  Object.entries(grouped)
    .sort(([,a], [,b]) => b.size - a.size)
    .forEach(([type, group]) => {
      console.log(`${type.toUpperCase()} files: ${group.count} (${formatBytes(group.size)})`);
      group.files.slice(0, 3).forEach(file => {
        console.log(`  - ${file.path}: ${formatBytes(file.size)}`);
      });
      if (group.files.length > 3) {
        console.log(`  - ... and ${group.files.length - 3} more`);
      }
      console.log('');
    });
  
  const totalSize = Object.values(grouped).reduce((sum, group) => sum + group.size, 0);
  console.log(`Total bundle size: ${formatBytes(totalSize)}`);
  
  // Warnings
  if (totalSize > 5 * 1024 * 1024) { // 5MB
    console.log('⚠️ Bundle size is large (>5MB). Consider code splitting.');
  }
  
  const jsSize = grouped.js?.size || 0;
  if (jsSize > 2 * 1024 * 1024) { // 2MB
    console.log('⚠️ JavaScript bundle is large (>2MB). Consider lazy loading.');
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

analyzeBundleSize();
```

Add to package.json:
```json
{
  "scripts": {
    "analyze": "node scripts/analyze-bundle.js"
  }
}
```

---

## Development Workflow Patterns

### Branching Strategy

#### Git Flow for Small Teams
```
main (production)
  ├── develop (integration)
  │   ├── feature/user-authentication
  │   ├── feature/transaction-crud
  │   └── feature/offline-sync
  ├── hotfix/critical-bug-fix
  └── release/v1.0.0
```

#### Branch Naming Conventions
```bash
# Features
feature/feature-name
feature/auth-integration
feature/pwa-setup

# Bug fixes
bugfix/bug-description
bugfix/transaction-validation
bugfix/offline-sync-issue

# Hotfixes
hotfix/critical-issue
hotfix/security-patch

# Releases
release/v1.0.0
release/v1.1.0
```

### Daily Development Workflow

#### 1. Morning Setup Routine
Create `scripts/dev-start.sh`:
```bash
#!/bin/bash

echo "🌅 Starting development session..."

# Check git status
echo "📊 Git Status:"
git status --short

# Check for updates
echo "📦 Checking for updates..."
git fetch origin

# Show branch info
current_branch=$(git branch --show-current)
echo "🌿 Current branch: $current_branch"

# Check if branch is behind
behind=$(git rev-list --count HEAD..origin/$current_branch 2>/dev/null || echo "0")
if [ "$behind" -gt 0 ]; then
    echo "⚠️ Branch is $behind commits behind origin/$current_branch"
    read -p "Pull latest changes? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git pull origin $current_branch
    fi
fi

# Start development servers
echo "🚀 Starting development servers..."

# Start Firebase emulators in background
firebase emulators:start --import=./firebase-export &
FIREBASE_PID=$!

# Wait for emulators to start
sleep 5

# Start development server
npm run dev &
DEV_PID=$!

echo "✅ Development environment ready!"
echo "🔥 Firebase Emulators: http://localhost:4000"
echo "⚛️ React App: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Handle shutdown
trap 'echo "🛑 Stopping servers..."; kill $FIREBASE_PID $DEV_PID; exit' INT

# Wait for processes
wait
```

#### 2. Pre-commit Workflow
Create `scripts/pre-commit-check.sh`:
```bash
#!/bin/bash

echo "🔍 Running pre-commit checks..."

# 1. Lint code
echo "🔧 Linting code..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Linting failed. Please fix the issues."
    exit 1
fi

# 2. Format code
echo "💅 Formatting code..."
npm run format

# 3. Type check
echo "🔤 Type checking..."
npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ Type checking failed. Please fix the issues."
    exit 1
fi

# 4. Build check
echo "🏗️ Build check..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the issues."
    exit 1
fi

# 5. Test (if available)
if grep -q '"test"' package.json; then
    echo "🧪 Running tests..."
    npm test -- --run
    if [ $? -ne 0 ]; then
        echo "❌ Tests failed. Please fix the issues."
        exit 1
    fi
fi

echo "✅ All pre-commit checks passed!"
```

#### 3. Feature Development Workflow
Create `scripts/new-feature.sh`:
```bash
#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: ./scripts/new-feature.sh <feature-name>"
    echo "Example: ./scripts/new-feature.sh user-authentication"
    exit 1
fi

FEATURE_NAME=$1
BRANCH_NAME="feature/$FEATURE_NAME"

echo "🆕 Creating new feature branch: $BRANCH_NAME"

# Ensure we're on develop
git checkout develop
git pull origin develop

# Create and checkout feature branch
git checkout -b $BRANCH_NAME

echo "✅ Feature branch created successfully!"
echo "🌿 Current branch: $(git branch --show-current)"
echo ""
echo "Next steps:"
echo "1. Implement your feature"
echo "2. Commit changes: git add . && git commit -m 'feat: add $FEATURE_NAME'"
echo "3. Push branch: git push -u origin $BRANCH_NAME"
echo "4. Create pull request to develop branch"
```

#### 4. Code Review Workflow
Create `.github/pull_request_template.md`:
```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] This change requires a documentation update

## Testing
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have tested this change manually

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] Any dependent changes have been merged and published

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Additional Notes
Any additional information that reviewers should know.
```

### Testing Workflow

#### 1. Testing Setup
```bash
# Install testing dependencies
npm install -D @testing-library/react
npm install -D @testing-library/jest-dom
npm install -D @testing-library/user-event
npm install -D vitest
npm install -D jsdom
npm install -D @vitest/ui
```

#### 2. Vitest Configuration
Create `vitest.config.js`:
```javascript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        'vite.config.js',
        'tailwind.config.js',
      ],
    },
  },
});
```

#### 3. Test Setup File
Create `src/test/setup.js`:
```javascript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  onSnapshot: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

// Mock service worker
Object.defineProperty(window, 'navigator', {
  value: {
    serviceWorker: {
      register: vi.fn(() => Promise.resolve()),
    },
  },
});
```

#### 4. Test Scripts
Add to package.json:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch"
  }
}
```

### Performance Monitoring

#### 1. Performance Monitoring Setup
Create `src/utils/performance-monitor.js`:
```javascript
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
    this.setupObservers();
  }

  setupObservers() {
    // Performance Observer for navigation timing
    if ('PerformanceObserver' in window) {
      const perfObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric(entry.name, entry);
        }
      });
      
      perfObserver.observe({ entryTypes: ['navigation', 'measure', 'paint'] });
      this.observers.push(perfObserver);
    }

    // Web Vitals monitoring
    this.observeWebVitals();
  }

  async observeWebVitals() {
    try {
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals');
      
      getCLS(this.recordWebVital.bind(this));
      getFID(this.recordWebVital.bind(this));
      getFCP(this.recordWebVital.bind(this));
      getLCP(this.recordWebVital.bind(this));
      getTTFB(this.recordWebVital.bind(this));
    } catch (error) {
      console.warn('Web Vitals not available:', error);
    }
  }

  recordWebVital(vital) {
    this.recordMetric(`web-vital-${vital.name}`, {
      value: vital.value,
      delta: vital.delta,
      id: vital.id,
      timestamp: Date.now(),
    });

    // Send to analytics if in production
    if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
      this.sendToAnalytics('web-vital', vital);
    }
  }

  recordMetric(name, value) {
    this.metrics.set(name, value);
    
    if (import.meta.env.DEV) {
      console.log(`📊 Performance Metric: ${name}`, value);
    }
  }

  startTiming(name) {
    performance.mark(`${name}-start`);
  }

  endTiming(name) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name, 'measure')[0];
    this.recordMetric(name, measure.duration);
    
    return measure.duration;
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  sendToAnalytics(type, data) {
    // Implement analytics sending logic
    if (window.gtag) {
      window.gtag('event', type, {
        custom_parameter_1: data.name,
        custom_parameter_2: data.value,
      });
    }
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

#### 2. Development Performance Dashboard
Create `src/components/DevTools/PerformanceDashboard.jsx`:
```jsx
import React, { useState, useEffect } from 'react';
import { performanceMonitor } from '../../utils/performance-monitor';

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!import.meta.env.DEV) return null;

  return (
    <>
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full z-50"
        title="Performance Dashboard"
      >
        📊
      </button>
      
      {isVisible && (
        <div className="fixed bottom-16 right-4 bg-white border rounded-lg shadow-lg p-4 max-w-sm max-h-96 overflow-auto z-50">
          <h3 className="font-bold mb-2">Performance Metrics</h3>
          
          {Object.entries(metrics).map(([key, value]) => (
            <div key={key} className="text-sm mb-1">
              <span className="font-medium">{key}:</span>{' '}
              <span>
                {typeof value === 'number' 
                  ? `${value.toFixed(2)}ms` 
                  : JSON.stringify(value)
                }
              </span>
            </div>
          ))}
          
          {Object.keys(metrics).length === 0 && (
            <p className="text-gray-500 text-sm">No metrics available</p>
          )}
        </div>
      )}
    </>
  );
}
```

### Development Utilities

#### 1. Environment Switcher
Create `src/utils/env-switcher.js`:
```javascript
export class EnvironmentSwitcher {
  constructor() {
    this.environments = {
      development: {
        apiUrl: 'http://localhost:3000',
        firebaseProject: 'monefy-pwa-clone-dev',
        useEmulator: true,
      },
      staging: {
        apiUrl: 'https://staging.monefyclone.app',
        firebaseProject: 'monefy-pwa-clone-staging',
        useEmulator: false,
      },
      production: {
        apiUrl: 'https://monefyclone.app',
        firebaseProject: 'monefy-pwa-clone-prod',
        useEmulator: false,
      },
    };
  }

  getCurrentEnvironment() {
    return import.meta.env.VITE_APP_ENVIRONMENT || 'development';
  }

  getConfig(env = this.getCurrentEnvironment()) {
    return this.environments[env] || this.environments.development;
  }

  isDevelopment() {
    return this.getCurrentEnvironment() === 'development';
  }

  isProduction() {
    return this.getCurrentEnvironment() === 'production';
  }

  isStaging() {
    return this.getCurrentEnvironment() === 'staging';
  }
}

export const envSwitcher = new EnvironmentSwitcher();
```

#### 2. Development Logger
Create `src/utils/logger.js`:
```javascript
class Logger {
  constructor() {
    this.isDev = import.meta.env.DEV;
    this.isDebug = import.meta.env.VITE_DEBUG_MODE === 'true';
  }

  log(message, ...args) {
    if (this.isDev) {
      console.log(`🔍 ${new Date().toISOString()} - ${message}`, ...args);
    }
  }

  warn(message, ...args) {
    if (this.isDev) {
      console.warn(`⚠️ ${new Date().toISOString()} - ${message}`, ...args);
    }
  }

  error(message, ...args) {
    console.error(`❌ ${new Date().toISOString()} - ${message}`, ...args);
  }

  debug(message, ...args) {
    if (this.isDev && this.isDebug) {
      console.debug(`🐛 ${new Date().toISOString()} - ${message}`, ...args);
    }
  }

  group(title, fn) {
    if (this.isDev) {
      console.group(title);
      fn();
      console.groupEnd();
    } else {
      fn();
    }
  }

  time(label) {
    if (this.isDev) {
      console.time(label);
    }
  }

  timeEnd(label) {
    if (this.isDev) {
      console.timeEnd(label);
    }
  }
}

export const logger = new Logger();
```

---

## Troubleshooting Guide

### Common Setup Issues

#### 1. Node.js and npm Issues

**Issue: Node.js version mismatch**
```
Error: The engine "node" is incompatible with this module.
```
**Solution:**
```bash
# Check current Node.js version
node --version

# Install correct version using nvm
nvm install 18.17.0
nvm use 18.17.0

# Or update to latest LTS
nvm install --lts
nvm use --lts

# Verify version
node --version
```

**Issue: npm permission errors**
```
Error: EACCES: permission denied
```
**Solution:**
```bash
# Fix npm permissions on macOS/Linux
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Alternative: Use npm prefix
npm config set prefix ~/.npm-global
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Windows: Run as Administrator or use nvm-windows
```

**Issue: Package lock conflicts**
```
npm ERR! peer dep missing
```
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and lock file
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install

# Fix peer dependencies
npm install --legacy-peer-deps
```

#### 2. Firebase Setup Issues

**Issue: Firebase project not found**
```
Error: HTTP Error: 404, Project not found
```
**Solution:**
```bash
# Check if logged in
firebase login

# List available projects
firebase projects:list

# Set correct project
firebase use your-project-id

# Verify project selection
firebase projects:list
```

**Issue: Firestore emulator connection refused**
```
Error: ECONNREFUSED 127.0.0.1:8080
```
**Solution:**
```bash
# Check if emulator is running
firebase emulators:start --only firestore

# Check port availability
netstat -an | grep 8080  # Linux/macOS
netstat -an | findstr 8080  # Windows

# Use different port if needed
firebase emulators:start --only firestore --port 8081
```

**Issue: Authentication emulator issues**
```
Error: Cannot connect to Authentication emulator
```
**Solution:**
```javascript
// Ensure proper emulator connection in code
import { connectAuthEmulator } from 'firebase/auth';

// Only connect once
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  } catch (error) {
    // Already connected
    console.log('Auth emulator already connected');
  }
}
```

**Issue: Firebase security rules errors**
```
Error: Missing or insufficient permissions
```
**Solution:**
```javascript
// Temporary development rules (firestore.rules)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all reads and writes for development
    match /{document=**} {
      allow read, write: if true;
    }
  }
}

// Deploy rules
firebase deploy --only firestore:rules
```

#### 3. PWA and Service Worker Issues

**Issue: Service worker not updating**
```
Service worker stuck on old version
```
**Solution:**
```javascript
// Force service worker update
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
    });
  });
  
  // Clear all caches
  caches.keys().then(cacheNames => {
    cacheNames.forEach(cacheName => {
      caches.delete(cacheName);
    });
  });
}

// Hard refresh
window.location.reload(true);
```

**Issue: PWA not installable**
```
Add to Home Screen not showing
```
**Solution:**
```javascript
// Check manifest.json
{
  "name": "Monefy PWA Clone",
  "short_name": "Monefy",
  "display": "standalone",
  "start_url": "/",
  "scope": "/",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}

// Verify HTTPS (required for PWA)
// Check service worker registration
// Ensure manifest is served with correct MIME type
```

**Issue: Offline functionality not working**
```
App doesn't work offline
```
**Solution:**
```javascript
// Check service worker caching strategy
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Cache API responses
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
  })
);
```

#### 4. Development Environment Issues

**Issue: Hot reload not working**
```
Changes not reflecting in browser
```
**Solution:**
```javascript
// vite.config.js
export default defineConfig({
  server: {
    hmr: {
      overlay: false
    },
    watch: {
      usePolling: true, // For Docker or network drives
    }
  }
});

// Check if files are being watched
// Restart dev server
npm run dev

// Clear browser cache
```

**Issue: CORS errors in development**
```
Access-Control-Allow-Origin error
```
**Solution:**
```javascript
// vite.config.js
export default defineConfig({
  server: {
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});
```

**Issue: Environment variables not loading**
```
import.meta.env.VITE_API_KEY is undefined
```
**Solution:**
```bash
# Check file naming
.env.local          # Correct
env.local           # Wrong
.env.development    # Correct
.development.env    # Wrong

# Check variable prefix
VITE_API_KEY=xxx    # Correct (starts with VITE_)
API_KEY=xxx         # Wrong (no VITE_ prefix)

# Restart dev server after changing env files
npm run dev
```

#### 5. Build and Deployment Issues

**Issue: Build fails with memory errors**
```
JavaScript heap out of memory
```
**Solution:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Or add to package.json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' vite build"
  }
}

# Alternative: Use --max-old-space-size flag
node --max-old-space-size=4096 ./node_modules/.bin/vite build
```

**Issue: Build fails with TypeScript errors**
```
Type errors preventing build
```
**Solution:**
```bash
# Skip type checking during build
npm run build -- --mode production --no-type-check

# Or fix in vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['typescript'] // Skip TypeScript processing
    }
  }
});

# Better: Fix TypeScript errors
npm run type-check
```

**Issue: Deployment fails**
```
Firebase deployment error
```
**Solution:**
```bash
# Check Firebase CLI version
firebase --version

# Update Firebase CLI
npm install -g firebase-tools@latest

# Clear Firebase cache
firebase logout
firebase login

# Check project configuration
firebase projects:list
firebase use your-project-id

# Deploy specific targets
firebase deploy --only hosting
firebase deploy --only firestore:rules
```

### Performance Issues

#### 1. Slow Initial Load

**Diagnosis:**
```javascript
// Add to main.jsx for development
if (import.meta.env.DEV) {
  console.log('Performance Timing:', performance.timing);
  
  window.addEventListener('load', () => {
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    console.log(`Page load time: ${loadTime}ms`);
  });
}
```

**Solutions:**
```javascript
// 1. Code splitting
const TransactionForm = lazy(() => import('./components/TransactionForm'));

// 2. Preload critical resources
<link rel="preload" href="/fonts/font.woff2" as="font" type="font/woff2" crossorigin>

// 3. Optimize images
// Use WebP format
// Implement lazy loading
// Use appropriate sizes

// 4. Minimize initial bundle
// Move non-critical dependencies to dynamic imports
const chart = await import('chart.js');
```

#### 2. Slow Firestore Queries

**Diagnosis:**
```javascript
// Add query performance monitoring
const startTime = performance.now();
const snapshot = await getDocs(query);
const endTime = performance.now();
console.log(`Query took ${endTime - startTime} milliseconds`);
```

**Solutions:**
```javascript
// 1. Add proper indexes
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "date", "order": "DESCENDING"}
      ]
    }
  ]
}

// 2. Limit query results
const q = query(
  collection(db, 'transactions'),
  where('userId', '==', userId),
  orderBy('date', 'desc'),
  limit(50) // Add limit
);

// 3. Use pagination
const firstBatch = query(
  collection(db, 'transactions'),
  orderBy('date', 'desc'),
  limit(25)
);

const next = query(
  collection(db, 'transactions'),
  orderBy('date', 'desc'),
  startAfter(lastVisible),
  limit(25)
);
```

### Diagnostic Tools

#### 1. Health Check Script
Create `scripts/health-check-extended.js`:
```javascript
#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import fetch from 'node-fetch';

async function runHealthCheck() {
  console.log('🏥 Extended Health Check\n');

  const checks = [
    {
      name: 'Node.js Version',
      check: () => {
        const version = process.version;
        const major = parseInt(version.slice(1).split('.')[0]);
        return major >= 18 ? { status: 'pass', message: version } : { status: 'fail', message: `${version} (requires >= 18)` };
      }
    },
    {
      name: 'Firebase CLI',
      check: () => {
        try {
          const version = execSync('firebase --version', { encoding: 'utf8' }).trim();
          return { status: 'pass', message: version };
        } catch (error) {
          return { status: 'fail', message: 'Not installed' };
        }
      }
    },
    {
      name: 'Git Configuration',
      check: () => {
        try {
          const username = execSync('git config user.name', { encoding: 'utf8' }).trim();
          const email = execSync('git config user.email', { encoding: 'utf8' }).trim();
          return { status: 'pass', message: `${username} <${email}>` };
        } catch (error) {
          return { status: 'fail', message: 'Not configured' };
        }
      }
    },
    {
      name: 'Environment File',
      check: () => {
        if (existsSync('.env.local')) {
          const content = readFileSync('.env.local', 'utf8');
          const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
          return { status: 'pass', message: `${lines.length} variables` };
        }
        return { status: 'warn', message: 'Not found' };
      }
    },
    {
      name: 'Firebase Emulator',
      check: async () => {
        try {
          const response = await fetch('http://localhost:4000');
          return { status: 'pass', message: 'Running' };
        } catch (error) {
          return { status: 'warn', message: 'Not running' };
        }
      }
    },
    {
      name: 'Development Server',
      check: async () => {
        try {
          const response = await fetch('http://localhost:3000');
          return { status: 'pass', message: 'Running' };
        } catch (error) {
          return { status: 'warn', message: 'Not running' };
        }
      }
    }
  ];

  for (const { name, check } of checks) {
    try {
      const result = await check();
      const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
      console.log(`${icon} ${name}: ${result.message}`);
    } catch (error) {
      console.log(`❌ ${name}: Error - ${error.message}`);
    }
  }

  console.log('\n🎯 Recommendations:');
  console.log('- Run `npm run firebase:emulators` to start Firebase emulators');
  console.log('- Run `npm run dev` to start development server');
  console.log('- Check .env.local file exists and has required variables');
}

runHealthCheck();
```

#### 2. Bundle Analyzer
```bash
# Install bundle analyzer
npm install -D rollup-plugin-visualizer

# Add to vite.config.js
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ],
});
```

---

This comprehensive Development Environment Configuration and Setup Templates guide provides everything needed to establish a robust, zero-cost development environment for the Monefy PWA clone. The templates cover all aspects from basic environment setup to advanced deployment strategies, ensuring a smooth development experience and reliable production deployment.