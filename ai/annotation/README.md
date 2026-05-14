# Annotation Provider

This folder contains the PDF annotation provider contract used by TrainMark AI.

The current MVP generates a deterministic local PDF artifact that can stand in
for the future annotated report. The backend and frontend already model an
`annotationPdfUrl`; this provider defines the file-generation boundary that can
later be replaced by a full PDF annotation engine.

## Local Provider

```bash
python3 ai/annotation/local_provider.py \
  --result-id 3001 \
  --submission-id 7 \
  --student-name 张三 \
  --output-dir /tmp/trainmark-annotations
```

The command writes a PDF file and prints a JSON manifest:

```json
{
  "resultId": 3001,
  "submissionId": 7,
  "annotationPdfPath": "/tmp/trainmark-annotations/annotated-7.pdf",
  "annotationPdfUrl": "/annotations/submissions/7/annotated.pdf"
}
```

## Production Migration Notes

Use `pdf-annotation.example.yml` as the first production configuration shape.
Future providers should preserve the JSON manifest contract and write generated
PDFs to the configured object-storage staging path.

## Backend Switch

`grading-service` defaults to the in-process local annotation provider. To call
an external PDF annotation command during grading:

```bash
ANNOTATION_PROVIDER=command \
ANNOTATION_COMMAND='python3 ai/annotation/local_provider.py --result-id {resultId} --submission-id {submissionId} --student-name {studentName} --output-dir {outputDir} --comment {comment}' \
ANNOTATION_OUTPUT_DIR=/tmp/trainmark-annotations \
mvn -f backend/pom.xml -pl grading-service spring-boot:run
```

Placeholders are shell-quoted by the backend before execution. The command must
print a JSON manifest containing `annotationPdfUrl`; optional `annotations`
entries are mapped back to `GradingAnnotationSummary`.

## Local Asset Endpoint

The grading service serves `/annotations/submissions/{submissionId}/annotated.pdf`.
In local mode the endpoint now looks up the grading result for that submission
and writes a PDF summary containing the student identity, score, review status,
annotation comments, item scores, and top evidence lines. If no grading result
exists yet, it returns a small placeholder PDF that states the result is not
available.
