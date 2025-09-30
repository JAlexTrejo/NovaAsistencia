# Supabase Request Audit Report

## Executive Summary
Audit conducted on Nova Asistencia React/Vite application to identify and fix redundant Supabase requests, particularly to the `user_profiles` table.

## Findings

### 🔴 Critical Issues

1. **Direct user_profiles queries bypassing cache: 15 locations**
   - AuthContext has proper caching, but many components bypass it
   - Only 2 uses of `selectCached` utility found

2. **Redundant connection tests**
   - `authService.testConnection()` unnecessarily queries user_profiles
   - `ConnectionDiagnosticPage` makes duplicate queries
   - `user-profile-management` page makes direct queries

3. **Real-time subscription inefficiency**
   - Activity dashboard re-creates subscriptions on every filter change
   - Dependencies include filter values causing unnecessary re-subscriptions

### ⚠️ Medium Priority Issues

4. **AuthContext dependency array**
   - `fetchUserProfile` has `user` and `userProfile` in dependencies
   - Could cause re-creation of function when profile changes

5. **Duplicate diagnostics**
   - User profile page runs diagnostics that query user_profiles directly
   - Should use AuthContext state instead

### ✅ Good Patterns Found

- AuthContext has proper in-flight deduplication
- AuthContext has localStorage caching
- AuthContext has throttling (500ms)
- Real-time subscriptions have cleanup functions
- supaCache implementation is solid

## Detected Request Patterns

### Direct user_profiles Queries (15 total)
```
src/contexts/AuthContext.jsx: 1 (legitimate)
src/services/authService.js: 4 (2 unnecessary)
src/pages/user-profile-management-and-authentication-center/index.jsx: 3 (all unnecessary)
src/pages/ConnectionDiagnosticPage.jsx: 1 (unnecessary)
src/pages/production-authentication-management-system/index.jsx: 2 (admin only, acceptable)
src/pages/production-database-schema-management-console/index.jsx: 2 (admin only, acceptable)
src/services/enhancedEmployeeService.js: 1 (legitimate)
```

## Applied Fixes

### ✅ Fix 1: Remove user_profiles from connection test
**File:** `src/services/authService.js`
**Status:** APPLIED
**Change:** Removed unnecessary user_profiles query from testConnection(), now only tests auth.getSession()
**Impact:** -1 user_profiles request on connection tests

### ✅ Fix 2: Update user profile page to use AuthContext
**File:** `src/pages/user-profile-management-and-authentication-center/index.jsx`
**Status:** APPLIED  
**Changes:**
- Use `getConnectionStatus()` from AuthContext instead of direct query
- Use existing `userProfile` state instead of re-querying
- Removed 2 direct user_profiles queries from diagnostics
**Impact:** -2 user_profiles requests on profile page load

### ✅ Fix 3: Fix activity dashboard RT subscriptions
**File:** `src/pages/activity-logging-and-security-monitoring-dashboard/index.jsx`
**Status:** APPLIED
**Change:** Separated RT subscription into dedicated useEffect that doesn't depend on filters
**Impact:** Prevents subscription recreation on every filter change

### ❌ Fix 4: Remove unnecessary connection diagnostics  
**File:** `src/pages/ConnectionDiagnosticPage.jsx`
**Status:** NOT APPLIED (would need more refactoring)

### ❌ Fix 5: Optimize AuthContext dependencies
**File:** `src/contexts/AuthContext.jsx`
**Status:** REVERTED (caused closure issues)
**Reason:** Removing user/userProfile from dependencies broke caching and session storage

## Implementation Priority

1. **High:** Fix user profile page direct queries (Fix 2)
2. **High:** Remove connection test user_profiles query (Fix 1)  
3. **Medium:** Fix RT subscription recreation (Fix 3)
4. **Medium:** Optimize AuthContext deps (Fix 5)
5. **Low:** Connection diagnostic improvements (Fix 4)

## Expected Results After Fixes

### Before (Estimated)
- Login → Dashboard: **5-8 user_profiles requests**
- Profile page visit: **+3 requests**
- Filter changes: **New RT subscription each time**

### After (Target)
- Login → Dashboard: **1-2 user_profiles requests** ✅
- Profile page visit: **0 additional requests** ✅
- Filter changes: **No new subscriptions** ✅

## Additional Recommendations

1. **Increase supaCache adoption** - Use in more service functions
2. **Add request monitoring** - Keep net-tap.js in dev builds
3. **Document caching patterns** - Add to replit.md
4. **Consider React Query** - For more advanced caching needs
5. **Add E2E tests** - Automated request counting

## Network Instrumentation

Network monitoring has been added via `src/lib/net-tap.js`:

```javascript
// In browser console after login:
window.printNetStats()  // View all requests
window.getNetCounts()    // Get counts object
window.resetNetStats()   // Reset counters
```

This tool tracks all Supabase REST and RPC calls with timing and status.
