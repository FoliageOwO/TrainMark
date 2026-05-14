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

File upload validation errors also use this envelope with HTTP 400. Business
validation failures return `success: false` and a message; DTO validation
failures return field-level messages in `data`.

OCR and grading provider failures return the same envelope. Invalid requests use
HTTP 400; external command provider failures use HTTP 502 with the provider error
message in `message`.

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
| admin-service | 8090 | `/api/admin/**` |
| analytics-service | 8091 | `/api/analytics/**` |

## Auth

| Method | Path | Request | Response data |
|---|---|---|---|
| `POST` | `/api/auth/login` | `LoginRequest` | `LoginResponse` |
| `POST` | `/api/auth/refresh` | bearer access token | `LoginResponse` |
| `POST` | `/api/auth/logout` | none | empty object |
| `GET` | `/api/auth/me` | optional bearer access token | `UserProfile` |

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

Upload initialization validates file extension, content type and file size. The
default accepted formats are PDF, Word, PNG and JPG/JPEG. The default max file
size is 50MB and can be overridden with `UPLOAD_MAX_FILE_SIZE_MB`. The local
object store writes multipart upload bytes under `UPLOAD_OBJECT_ROOT` before
completion. Upload initialization and completion return `ApiResponse.fail(...)`
with HTTP 400 when the request body is invalid, file constraints fail, the
upload session is missing, the object key does not match, or the checksum is
inconsistent.

| Method | Path | Request | Response data |
|---|---|---|---|
| `POST` | `/api/submissions/upload/init` | `InitializeUploadRequest` | `InitializeUploadResponse` |
| `PUT` | `/api/submissions/upload/content` | multipart `uploadId`, `objectKey`, `file` | `UploadObjectSummary` |
| `POST` | `/api/submissions/upload/complete` | `CompleteUploadRequest` | `SubmissionReceipt` |
| `GET` | `/api/submissions?assignmentId=1&studentId=2` | optional `assignmentId`, `studentId` query | `SubmissionSummary[]` |
| `GET` | `/api/submissions/{submissionId}/file` | none | original submitted report bytes |

`SubmissionSummary` includes `objectKey` so teacher workflows can start OCR or
other AI jobs against the same stored report object returned by upload
initialization.

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

Generated MVP assets are exposed through the gateway for local demonstration:

| Method | Path | Response |
|---|---|---|
| `GET` | `/annotations/submissions/{submissionId}/annotated.pdf` | annotated PDF placeholder |
| `GET` | `/exports/assignments/{assignmentId}/{fileName}` | CSV, PDF or ZIP grade export; ZIP includes annotated PDFs under `annotations/` |

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

## Admin

| Method | Path | Request | Response data |
|---|---|---|---|
| `GET` | `/api/admin/audit-logs?action=GRADE_EXPORT&resourceType=GRADE_EXPORT` | optional `action`, `resourceType` query | `AuditLogSummary[]` |
| `GET` | `/api/admin/settings?category=AI` | optional `category` query | `SystemSettingSummary[]` |
| `PATCH` | `/api/admin/settings/{key}` | `UpdateSystemSettingRequest` | `SystemSettingSummary` |

## Frontend HTTP Mode

The frontend uses mock data by default. To read through the gateway:

```bash
VITE_API_MODE=http pnpm dev:web
```

Set `VITE_API_BASE_URL` in `.env` to override the gateway URL. Each frontend read request falls back to local mock data if the target service is unavailable, which keeps partial-service integration usable during MVP development.
