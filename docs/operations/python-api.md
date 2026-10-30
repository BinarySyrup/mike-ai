# Python API: Screenshot Upload

The first MikeAI API slice accepts PNG and JPEG job-posting screenshots at
`POST /api/v1/job-postings/screenshots`. Uploads are limited to 10 MiB, saved
under a generated filename in `uploads/job-postings`, and excluded from Git.
Set `MIKEAI_UPLOAD_DIR` to change the local storage directory. This endpoint
does not yet perform OCR or job matching.

## Run locally

Install the project and development dependencies, then start the API:

```bash
python -m pip install -e '.[dev]'
uvicorn mikeai.main:app --reload
```

Open `/docs` on the local server to try the upload endpoint. Run tests with:

```bash
pytest
```

## Process uploaded postings

Set the values in `.env.example` in your local `.env` file. Do not commit `.env`
or the service-principal secret. The API uses `DefaultAzureCredential` with the
Azure environment variables shown in the template.

`POST /api/v1/job-postings/process` processes PNG and JPEG files in
`MIKEAI_UPLOAD_DIR`, one at a time. It returns a JSON result per image and saves
each successful report as `reports/job-postings/<image-name>.json` by default.
Set `MIKEAI_REPORT_DIR` to change the report location. The agent is expected to
return JSON containing the job title, summary, and qualifications with match
evidence.
Existing valid reports are reused; append `?force=true` to regenerate them.
See `examples/job-match-report.sample.json` for the returned report shape.
