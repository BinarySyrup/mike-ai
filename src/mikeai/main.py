import os
from pathlib import Path

from fastapi import FastAPI

from mikeai.processing import create_processing_router
from mikeai.uploads import create_uploads_router


def create_app(
    upload_dir: Path | None = None,
    report_dir: Path | None = None,
) -> FastAPI:
    storage_directory = (
        upload_dir
        if upload_dir is not None
        else Path(os.environ.get('MIKEAI_UPLOAD_DIR', 'uploads/job-postings'))
    )
    report_directory = (
        report_dir
        if report_dir is not None
        else Path(os.environ.get('MIKEAI_REPORT_DIR', 'reports/job-postings'))
    )
    application = FastAPI(title='MikeAI API', version='0.1.0')
    application.include_router(create_uploads_router(storage_directory))
    application.include_router(
        create_processing_router(storage_directory, report_directory)
    )

    @application.get('/health')
    async def health() -> dict[str, str]:
        return {'status': 'ok'}

    return application


app = create_app()
