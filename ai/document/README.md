# Document Preprocessing Provider

This folder contains the document preprocessing contract used before OCR.

The current MVP uses a deterministic local converter. It does not call
LibreOffice, PDFBox, or image tooling yet; instead it normalizes the metadata
shape that a production converter must return when turning Word/PDF/image
submissions into OCR-ready PDF or image inputs.

## Local Converter

```bash
python3 ai/document/local_converter.py \
  --submission-id 1 \
  --object-key assignments/1/students/2/report.docx
```

The command writes a JSON manifest:

```json
{
  "submissionId": 1,
  "sourceObjectKey": "assignments/1/students/2/report.docx",
  "normalizedObjectKey": "converted/assignments/1/students/2/report.pdf",
  "sourceFormat": "WORD",
  "targetFormat": "PDF",
  "pageCount": 12,
  "imageCount": 2,
  "tableHintCount": 1
}
```

## OCR Service Integration

The OCR service uses the local Java preprocessor by default:

```bash
DOCUMENT_PREPROCESSOR_PROVIDER=local
```

To route preprocessing through an external converter command:

```bash
DOCUMENT_PREPROCESSOR_PROVIDER=command
DOCUMENT_PREPROCESSOR_COMMAND="python3 ai/document/local_converter.py --submission-id {submissionId} --object-key {objectKey}"
DOCUMENT_PREPROCESSOR_TIMEOUT_SECONDS=60
```

The service replaces `{submissionId}` and `{objectKey}` before running the
command. The command must write the JSON manifest above to stdout.

## Production Migration Notes

A real converter should keep this JSON shape and replace the deterministic
metadata with actual conversion output from LibreOffice/PDFBox/image tooling.
Generated files should be uploaded to object storage under the normalized object
key before OCR starts.
