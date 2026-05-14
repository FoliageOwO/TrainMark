# TrainMark AI MVP API

This document records the current MVP API surface implemented by the Spring Boot services.

Gateway base URL:

```text
http://localhost:8080
```

All current endpoints return the shared response envelope:

```json
{
  "success": true,
  "data": {},
  "message": "ok"
}
```

Most services still use in-memory data for local MVP demonstration. The gateway forwards `/api/**` requests to the service ports listed below.

## Service Ports

| Service | Port | Gateway path |
|---|---:|---|
| gateway-service | 8080 | n/a |
| auth-service | 8081 | `/api/auth/**` |
| user-service | 8082 | `/api/organizations/**`, `/api/users/**` |
| course-service | 8083 | `/api/courses/**`, `/api/assignments/**` |
| file-service | 8084 | `/api/uploads/**`, `/api/submissions/**` |
| grading-service | 8085 | `/api/rubrics/**`, `/api/grading/**` |
| ocr-service | 8086 | `/api/ocr/**` |
| similarity-service | 8087 | `/api/similarity/**` |
| notification-service | 8089 | `/api/notifications/**` |
| admin-service | 8090 | no MVP public API yet |
| analytics-service | 8091 | `/api/analytics/**` |

## Auth

| Method | Path | Request | Response data |
|---|---|---|---|
| `POST` | `/api/auth/login` | `LoginRequest` | `LoginResponse` |
| `POST` | `/api/auth/refresh` | none | `LoginResponse` |
| `POST` | `/api/auth/logout` | none | empty object |
| `GET` | `/api/auth/me` | none | `UserProfile` |

## Users And Organizations

| Method | Path | Request | Response data |
|---|---|---|---|
| `GET` | `/api/organizations` | none | `OrganizationSummary[]` |
| `POST` | `/api/organizations` | `CreateOrganizationRequest` | `OrganizationSummary` |
| `GET` | `/api/users?role=STUDENT` | optional `role` query | `UserSummary[]` |
| `POST` | `/api/users` | `CreateUserRequest` | `UserSummary` |
| `POST` | `/api/users/students/import` | `StudentImportRequest` | `StudentImportResult` |

## Courses And Assignments

| Method | Path | Request | Response data |
|---|---|---|---|
| `GET` | `/api/courses` | none | `CourseSummary[]` |
| `POST` | `/api/courses` | `CreateCourseRequest` | `CourseSummary` |
| `GET` | `/api/courses/{courseId}/classes` | none | `TeachingClassSummary[]` |
| `POST` | `/api/courses/{courseId}/classes` | `CreateTeachingClassRequest` | `TeachingClassSummary` |
| `GET` | `/api/assignments?courseId=1` | optional `courseId` query | `AssignmentSummary[]` |
| `POST` | `/api/assignments` | `CreateAssignmentRequest` | `AssignmentSummary` |

## Submissions And Uploads

| Method | Path | Request | Response data |
|---|---|---|---|
| `POST` | `/api/submissions/upload/init` | `InitializeUploadRequest` | `InitializeUploadResponse` |
| `POST` | `/api/submissions/upload/complete` | `CompleteUploadRequest` | `SubmissionReceipt` |
| `GET` | `/api/submissions?assignmentId=1&studentId=2` | optional `assignmentId`, `studentId` query | `SubmissionSummary[]` |

## Collection And Reminders

| Method | Path | Request | Response data |
|---|---|---|---|
| `GET` | `/api/notifications/assignments/{assignmentId}/collection` | none | `SubmissionCollectionOverview` |
| `GET` | `/api/notifications/assignments/{assignmentId}/unsubmitted` | none | `UnsubmittedStudent[]` |
| `POST` | `/api/notifications/remind-unsubmitted` | `ReminderRequest` | `ReminderResult` |

## Rubrics And Grading Jobs

| Method | Path | Request | Response data |
|---|---|---|---|
| `GET` | `/api/rubrics?assignmentId=1` | optional `assignmentId` query | `RubricSummary[]` |
| `POST` | `/api/rubrics` | `CreateRubricRequest` | `RubricSummary` |
| `GET` | `/api/grading/jobs?assignmentId=1` | optional `assignmentId` query | `GradingJobSummary[]` |
| `POST` | `/api/grading/jobs` | `CreateGradingJobRequest` | `GradingJobSummary` |

## OCR

| Method | Path | Request | Response data |
|---|---|---|---|
| `GET` | `/api/ocr/jobs?submissionId=1` | optional `submissionId` query | `OcrJobSummary[]` |
| `POST` | `/api/ocr/jobs` | `CreateOcrJobRequest` | `OcrJobSummary` |
| `GET` | `/api/ocr/jobs/{jobId}/result` | none | `OcrResultSummary` |

## Manual Review And Grade Publishing

| Method | Path | Request | Response data |
|---|---|---|---|
| `GET` | `/api/grading/results?assignmentId=1&reviewStatus=IN_REVIEW` | optional `assignmentId`, `reviewStatus` query | `GradingResultSummary[]` |
| `GET` | `/api/grading/results/{resultId}` | none | `GradingResultSummary` |
| `PATCH` | `/api/grading/results/{resultId}/items` | `UpdateReviewItemRequest` | `GradingResultSummary` |
| `POST` | `/api/grading/results/{resultId}/approve` | `ReviewDecisionRequest` | `GradingResultSummary` |
| `GET` | `/api/grading/results/publications?assignmentId=1&publicationStatus=PUBLISHED` | optional `assignmentId`, `publicationStatus` query | `GradePublicationSummary[]` |
| `POST` | `/api/grading/results/{resultId}/publish` | `PublishGradeRequest` | `GradingResultSummary` |
| `POST` | `/api/grading/results/{resultId}/withdraw` | `WithdrawGradeRequest` | `GradingResultSummary` |
| `GET` | `/api/grading/results/{resultId}/publication-audits` | none | `GradePublicationAuditEntry[]` |
| `GET` | `/api/grading/exports?assignmentId=1` | optional `assignmentId` query | `GradeExportSummary[]` |
| `POST` | `/api/grading/exports` | `CreateGradeExportRequest` | `GradeExportSummary` |

## Appeals

| Method | Path | Request | Response data |
|---|---|---|---|
| `GET` | `/api/grading/results/appeals?resultId=1&studentId=2` | optional `resultId`, `studentId` query | `AppealSummary[]` |
| `POST` | `/api/grading/results/appeals` | `CreateAppealRequest` | `AppealSummary` |
| `POST` | `/api/grading/results/appeals/{appealId}/resolve` | `ResolveAppealRequest` | `AppealSummary` |

## Similarity

| Method | Path | Request | Response data |
|---|---|---|---|
| `GET` | `/api/similarity/jobs?assignmentId=1` | optional `assignmentId` query | `SimilarityJobSummary[]` |
| `POST` | `/api/similarity/jobs` | `CreateSimilarityJobRequest` | `SimilarityJobSummary` |
| `GET` | `/api/similarity/jobs/{jobId}` | none | `SimilarityJobSummary` |

## Analytics

| Method | Path | Request | Response data |
|---|---|---|---|
| `GET` | `/api/analytics/grade-statistics?assignmentId=1` | required `assignmentId` query | `GradeStatisticsSummary` |
| `GET` | `/api/analytics/loss-points?assignmentId=1` | required `assignmentId` query | `LossPointSummary[]` |
| `GET` | `/api/analytics/course-outcomes?assignmentId=1` | required `assignmentId` query | `CourseOutcomeAchievementSummary[]` |

## Frontend HTTP Mode

The frontend uses mock data by default. To read through the gateway:

```bash
VITE_API_MODE=http pnpm dev:web
```

Set `VITE_API_BASE_URL` in `.env` to override the gateway URL. Each frontend read request falls back to local mock data if the target service is unavailable, which keeps partial-service integration usable during MVP development.
