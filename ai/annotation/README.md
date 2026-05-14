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

