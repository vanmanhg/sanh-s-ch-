# Firestore Security Specification

## 1. Data Invariants
1. **Default-Deny Catch-All**: All unspecified paths under `/databases/{database}/documents` are denied read and write access (`allow read, write: if false;`).
2. **User Profile Ownership & PII Isolation (`/users/{userId}`)**:
   - Only non-PII display attributes (`uid`, `displayName`, `photoURL`, `createdAt`, `updatedAt`) are stored.
   - Only the owning verified user (`request.auth.uid == userId && request.auth.token.email_verified == true`) may read (`get`), create, or update their profile.
   - `list` and `delete` on `/users` are strictly forbidden to prevent user enumeration.
3. **Disease Diagnosis Ownership & Relational Gate (`/diagnoses/{diagnosisId}`)**:
   - Every diagnosis document MUST have `ownerId == request.auth.uid` and verify on `create` that the parent `/users/{ownerId}` document exists.
   - `get`, `list`, `update`, and `delete` are strictly restricted to `resource.data.ownerId == request.auth.uid` (no blanket `isSignedIn()` reads or client-side query delegation).
4. **Immutable Fields & Server Timestamps**:
   - `uid` (on `/users`), `ownerId` (on `/diagnoses`), and `createdAt` cannot be modified after creation.
   - `createdAt` and `updatedAt` MUST equal `request.time`.
5. **Strict Schema, Key Allowlists, & Bounded Sizes**:
   - Every write enforces `keys().hasAll(...) && keys().hasOnly(...)` and `affectedKeys().hasOnly(...)` per action.
   - Every string checks `.size()` bounds; every array checks `.size() <= 10` and element types.
6. **Terminal State Locking**:
   - Once a diagnosis reaches `status == 'resolved'`, subsequent `update` operations are blocked.
7. **Weather Alert Preferences Isolation (`/weatherPreferences/{userId}`)**:
   - Strictly keyed by `userId == request.auth.uid`, with `list` and `delete` disabled.
   - Numeric bounds enforced on all thresholds (`heatThresholdC` 30..45, `rainThresholdMm` 5..200, `windThresholdKmH` 15..120, `coldThresholdC` 0..20) and coordinates (`lat` -90..90, `lng` -180..180).

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Identity Spoofing (Create User)**: Authenticated as `uidA`, create `/users/uidB` with `uid: "uidB"`.
2. **Owner Spoofing (Create Diagnosis)**: Authenticated as `uidA`, create `/diagnoses/diag1` with `ownerId: "uidB"`.
3. **Unverified Email Write**: Authenticated with `email_verified: false`, attempt to create `/diagnoses/diag1`.
4. **Shadow Field Injection (Ghost Field)**: Create `/diagnoses/diag1` including all valid fields plus `"isAdmin": true` or `"isVerified": true`.
5. **Cross-User Read (`get`)**: Authenticated as `uidA`, read `/diagnoses/diagOwnedByUidB`.
6. **Unfiltered `list` Query**: Authenticated as `uidA`, query `/diagnoses` without `where('ownerId', '==', 'uidA')`.
7. **PII / User Enumeration (`list`)**: Authenticated as `uidA`, attempt `list` on `/users`.
8. **ID Poisoning (1.5KB Document ID)**: Create `/diagnoses/` + `'a'.repeat(1500)` or ID with special characters `diag$1`.
9. **Client Timestamp Forgery**: Create `/diagnoses/diag1` with client-supplied past ISO timestamp instead of `request.time`.
10. **Owner Mutation on Update**: Update `/diagnoses/diag1` changing `ownerId` from `uidA` to `uidB`.
11. **Value Poisoning on Update**: Update `/diagnoses/diag1` `status` to `"hacked"` (invalid enum) or `farmerNotes` > 500 chars.
12. **Terminal State Mutation**: Update `/diagnoses/diag1` after `status` has already been set to `"resolved"`.
