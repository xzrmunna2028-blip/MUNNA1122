# Security Specifications: Enterprise SMS Gateway

## Data Invariants
1. System settings (`settings/global`) must only be read and updated by authenticated administrators or the system sync executor.
2. SMS logs (`active_sms_logs`) can be created by the webhook engine and read by authorized clients.
3. Rented numbers (`rented_numbers`) cannot have empty or malicious IDs.
4. Input validation of strings must include size limitations to prevent injection of malicious payloads.

## The "Dirty Dozen" Payloads
1. **Unauthenticated Read Settings:** Attempting to read `settings/global` without an active session.
2. **Unauthenticated Write Settings:** Attempting to modify API key or metrics without an active session.
3. **Malicious ID Injection on SMS Log:** Creating a document with ID `../../etc/passwd`.
4. **Volumetric Payload Attack on SMS Log Text:** Writing a 10MB text string as the SMS content.
5. **Identity Spoofing on SMS Log:** Injecting foreign `sender` info.
6. **State Hijacking on SMS Log:** Forcefully setting a status that is not allowed.
7. **Malicious Rented Number Creation:** Writing numbers with a script using invalid characters in country.
8. **Malicious Activity Log Creation:** Forging a status that doesn't match standard event patterns.
9. **Illegal PII Exposure:** Attempting to list all users' private details without appropriate session checks.
10. **Shadow Fields Attack:** Writing fields not present in the standard entity definition.
11. **Malicious Character Injection in Document ID:** Writing a document with non-alphanumeric characters in collection paths.
12. **Self-Elevated Privilege Modification:** Attempting to modify the security tier.

## Rules Verification Tests
- All "Dirty Dozen" malicious write and read requests must fail with `PERMISSION_DENIED`.
