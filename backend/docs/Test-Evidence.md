# Test Evidence

## How to run

```bash
cd backend
mvn test
```

The tests use an in-memory H2 database (`src/test/resources/application.properties`),
so no MySQL server or environment variables are needed.

## Latest run

Environment: Java 21.0.8, Apache Maven 3.9.12, macOS. Run on 2026-11-28.

```
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0 in com.neirah.backend.BackendApplicationTests
[INFO] Tests run: 18, Failures: 0, Errors: 0, Skipped: 0 in com.neirah.backend.integration.ApiIntegrationTest
[INFO] Tests run: 17, Failures: 0, Errors: 0, Skipped: 0 in com.neirah.backend.service.LeadServiceTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0 in com.neirah.backend.service.ConversionServiceTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0 in com.neirah.backend.service.FollowUpServiceTest
[INFO] Tests run: 45, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

Per-test reports are written to `backend/target/surefire-reports/`.

## Coverage by requirement

There are two kinds of test:
- **Unit** tests run a service with mocked repositories (Mockito).
- **Integration** tests run the full stack through MockMvc: the real JWT security filter chain, controllers, services and an H2 database.

| Assessment requirement | Test | Type |
|---|---|---|
| Rule 1: Won requires a positive deal value | `LeadServiceTest.wonLeadRequiresPositiveDealValue` | Unit |
| | `ApiIntegrationTest.wonWithoutDealValueIsRejectedAndNoAuditIsWritten` | Integration |
| Rule 2: Lost requires a loss reason | `LeadServiceTest.lostLeadRequiresReason` | Unit |
| Pipeline transitions are validated | `LeadServiceTest.invalidPipelineTransitionIsRejected` | Unit |
| Rule 3: only a manager or the owner can modify | `LeadServiceTest.salesRepCannotUpdateAnotherOwnersLead` | Unit |
| | `ApiIntegrationTest.salesRepCannotViewOrModifyAnotherRepsLead` | Integration |
| Rule 3: only managers can assign | `LeadServiceTest.salesRepCannotAssignLead` | Unit |
| Rule 4: status change creates an audit event (actor, old/new value) | `LeadServiceTest.pipelineTransitionRecordsStatusAuditEvent` | Unit |
| Rule 4 + 8: reassignment is audited, keeps the lead record and moves open follow-ups | `LeadServiceTest.managerReassignmentRecordsAuditEventAndKeepsLeadRecord` | Unit |
| Rule 8: open follow-ups move to the new owner; completed ones keep history | `ApiIntegrationTest.reassignmentMovesOpenFollowUpsToNewOwnerAndKeepsCompletedHistory` | Integration |
| Follow-ups always belong to the lead owner | `FollowUpServiceTest.followUpCannotBeAssignedToSomeoneOtherThanTheLeadOwner` | Unit |
| Any open stage can be lost (reason required) | `LeadServiceTest.newLeadCanBeMarkedLostWithReason` | Unit |
| Rule 5: overdue comes from due date and completion | `FollowUpServiceTest.overdueIsComputedFromDueDateAndCompletionStatus` | Unit |
| | `FollowUpServiceTest.salesRepScheduleIsScopedToOwnLeadsAndFilteredByStatus` | Unit |
| | `FollowUpServiceTest.pastDueDateIsAcceptedAndImmediatelyOverdue` | Unit |
| No new follow-ups on Won/Lost leads | `FollowUpServiceTest.followUpsCannotBeScheduledOnWonOrLostLeads` | Unit |
| | `ApiIntegrationTest.followUpOnClosedLeadIsRejectedByServer` | Integration |
| Rule 6: duplicate email detected | `LeadServiceTest.duplicateEmailIsDetected` | Unit |
| Rule 6: phone normalised before comparing | `LeadServiceTest.phoneDuplicateIsDetectedAfterNormalisation` | Unit |
| Rule 6: missing values are not treated as duplicates | `LeadServiceTest.missingEmailAndPhoneSkipDuplicateLookupAndCreateLead` | Unit |
| Rule 6: warn before creation, confirmation required | `LeadServiceTest.duplicateLeadCreationRequiresConfirmation` | Unit |
| Rule 6: a confirmed duplicate can still be edited | `LeadServiceTest.confirmedDuplicateLeadCanStillBeEditedWhenEmailIsUnchanged` | Unit |
| Rule 6: changing to another lead's email warns, confirm saves | `LeadServiceTest.changingEmailToAnotherLeadsEmailRequiresConfirmation` | Unit |
| | `ApiIntegrationTest.duplicateEmailWarnsBeforeCreationAndRequiresConfirmation` | Integration |
| Rule 7: conversion is idempotent | `ConversionServiceTest.firstConversionCreatesCustomerLinksLeadAndRecordsTimelineEvent` | Unit |
| | `ConversionServiceTest.repeatedConversionReturnsExistingCustomer` | Unit |
| | `ApiIntegrationTest.repeatedConversionCreatesExactlyOneCustomer` | Integration |
| Only Won leads convert | `ApiIntegrationTest.nonWonLeadCannotBeConverted` | Integration |
| | `ConversionServiceTest.nonWonLeadCannotBeConverted` | Unit |
| No duplicate customer for the same person (same email) | `ConversionServiceTest.wonLeadForExistingCustomerEmailIsLinkedNotDuplicated` | Unit |
| | `ApiIntegrationTest.secondWonLeadForSameEmailLinksToExistingCustomerAndRecordsConversion` | Integration |
| Authorization: unauthenticated → 401 | `ApiIntegrationTest.unauthenticatedRequestReturns401WithJsonError` | Integration |
| Authorization: manager-only endpoint → 403 for a rep | `ApiIntegrationTest.salesRepCannotAccessManagerOnlyEndpoint` | Integration |
| No public sign-up; only managers create sales reps | `ApiIntegrationTest.salesRepAccountsCanOnlyBeCreatedByManagers` | Integration |
| Password reset ends existing sessions | `ApiIntegrationTest.passwordResetInvalidatesExistingSessions` | Integration |
| Role-based visibility | `LeadServiceTest.managerCanViewAllLeads`, `salesRepCanViewOwnLead`, `salesRepCannotViewAnotherOwnersLead` | Unit |
| Dashboard metrics scoped by role (incl. win rate) | `ApiIntegrationTest.dashboardSummaryIsScopedByRole` | Integration |
| Stable pagination (newest first) and phone-digit search | `ApiIntegrationTest.searchIsOrderedNewestFirstAndMatchesPhoneDigits` | Integration |
| Oversized fields → 400 field errors, not a database conflict | `ApiIntegrationTest.oversizedFieldsReturnValidationErrorsInsteadOfDatabaseConflict` | Integration |
| Consistent error responses: validation → 400 with field errors | `ApiIntegrationTest.invalidRequestReturnsFieldValidationErrors` | Integration |
| Consistent error responses: missing record → 404 | `ApiIntegrationTest.missingLeadReturns404` | Integration |
| Framework errors keep their real status (unknown route → 404, unsupported method → 405, unsupported content type → 415), never 500 | `ApiIntegrationTest.frameworkClientErrorsKeepTheirStatusInsteadOf500` | Integration |
| Application context starts | `BackendApplicationTests.contextLoads` | Integration |

## Manual verification against MySQL

The Flyway migrations (`V1__initial_schema.sql`, `V2__seed_demo_data.sql`,
`V3__customer_matching_and_session_versioning.sql`) were applied to an empty MySQL 9.5 database. The application then started with `ddl-auto=validate`, which confirms
the schema matches the JPA entities. Checks run with `curl` against the seed data:

- A wrong password returns 401 `"Invalid email or password"`.
- The manager's dashboard shows 11 leads across all 6 stages, 3 overdue and 4 upcoming follow-ups, and leads by owner for 3 reps.
- A sales rep requesting another rep's lead gets 403.
- Converting the same Won lead twice returns the same `customerId`, and the second response has `alreadyConverted: true`.
- Invalid input returns 400 with `fieldErrors`, and an unknown enum value returns 400.
- The full demo walkthrough plus a check for each of the 13 logic-review fixes: **30/30 checks passed**.
