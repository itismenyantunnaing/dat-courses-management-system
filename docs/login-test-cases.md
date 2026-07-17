# Login Test Cases
testing
## Scope

These manual test cases cover the core login flow for the DAT Courses Management Dashboard frontend and backend integration.

## Preconditions

- Frontend is running on `http://localhost:3000`
- Backend is running on `http://localhost:8085`
- Test data exists for:
  - one active valid user
  - one user with a known wrong password case
  - one user that can be used for account lock testing

## Test Data

| Test User | Purpose |
| --- | --- |
| `EMP001` | Valid login |
| `EMP002` | Invalid password |
| `EMP003` | Account lock after repeated failures |

## TC-LOGIN-001 Valid Login

**Preconditions**
- User account exists and password is correct

**Steps**
1. Open `http://localhost:3000`
2. Enter a valid Staff ID
3. Enter the correct password
4. Click `Login`

**Expected Result**
- Login succeeds
- User is redirected to `/dashboard`
- No error message is shown

## TC-LOGIN-002 Empty Form Validation

**Steps**
1. Open `http://localhost:3000`
2. Leave Staff ID empty
3. Leave Password empty
4. Click `Login`

**Expected Result**
- Form submission is blocked
- Validation message is shown for missing credentials
- User stays on the login page

## TC-LOGIN-003 Invalid Password

**Preconditions**
- User account exists

**Steps**
1. Open `http://localhost:3000`
2. Enter a valid Staff ID
3. Enter an invalid password
4. Click `Login`

**Expected Result**
- Login fails
- Error message is shown
- User stays on the login page

## TC-LOGIN-004 Unknown Staff ID

**Steps**
1. Open `http://localhost:3000`
2. Enter a Staff ID that does not exist
3. Enter any password
4. Click `Login`

**Expected Result**
- Login fails
- Error message is shown
- User stays on the login page

## TC-LOGIN-005 Account Lock After Repeated Failures

**Preconditions**
- Test user is not already locked

**Steps**
1. Open `http://localhost:3000`
2. Enter a valid Staff ID for the lock-test user
3. Enter an invalid password
4. Click `Login`
5. Repeat the same invalid login until the lock threshold is reached
6. Try logging in again before the lock window expires

**Expected Result**
- Login attempts fail
- Account becomes locked after the configured number of failed attempts
- A lock message is shown on subsequent login attempts during the lock window

## TC-LOGIN-006 Direct Dashboard Access Without Login

**Steps**
1. Open a new browser session or log out first
2. Navigate directly to `http://localhost:3000/dashboard`

**Expected Result**
- User is redirected to `/`
- Dashboard content is not shown

## TC-LOGIN-007 Session Persists On Refresh

**Preconditions**
- User has already logged in successfully

**Steps**
1. Log in successfully
2. Wait for the dashboard to load
3. Refresh the browser tab

**Expected Result**
- Session remains valid
- Dashboard reloads successfully
- User is not redirected back to login

## TC-LOGIN-008 Root Route Redirects When Already Logged In

**Preconditions**
- User has already logged in successfully

**Steps**
1. Log in successfully
2. Open `http://localhost:3000/` in the same browser session

**Expected Result**
- User is redirected to `/dashboard`

## TC-LOGIN-009 Logout Clears Access

**Preconditions**
- User has already logged in successfully

**Steps**
1. Log in successfully
2. Click the logout action
3. Navigate to `http://localhost:3000/dashboard`

**Expected Result**
- User is returned to the login page
- Direct dashboard access is denied after logout

## TC-LOGIN-010 Forgot Password Entry Point

**Steps**
1. Open `http://localhost:3000`
2. Click `Forgot your password?`

**Expected Result**
- Forgot password dialog opens
- User can start the OTP reset flow
