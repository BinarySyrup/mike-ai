from contextlib import suppress
from pathlib import Path
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from mikeai.agent import AgentOutputError, FoundryJobPostingAgent, JobPostingReport, create_agent
from mikeai.uploads import MAX_UPLOAD_SIZE_BYTES

IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png'}
IMAGE_SIGNATURES = {
    '.jpg': b'\xff\xd8\xff',
    '.jpeg': b'\xff\xd8\xff',
    '.png': b'\x89PNG\r\n\x1a\n',
}


class ProcessedPosting(BaseModel):
    image_file: str
    status: Literal['processed', 'skipped', 'failed']
    report_file: str | None = None
    report: JobPostingReport | None = None
    error_code: str | None = None


class ProcessingBatchResponse(BaseModel):
    total_images: int
    processed: int
    skipped: int
    failed: int
    results: list[ProcessedPosting]


def _image_files(upload_dir: Path) -> list[Path]:
    if not upload_dir.exists():
        return []
    return sorted(
        path
        for path in upload_dir.iterdir()
        if path.is_file()
        and not path.is_symlink()
        and path.suffix.lower() in IMAGE_EXTENSIONS
    )


def _validate_image(image_path: Path) -> str | None:
    if image_path.stat().st_size > MAX_UPLOAD_SIZE_BYTES:
        return 'image_too_large'

    signature = IMAGE_SIGNATURES[image_path.suffix.lower()]
    with image_path.open('rb') as image_file:
        if not image_file.read(len(signature)).startswith(signature):
            return 'invalid_image'
    return None


def _save_report(report_dir: Path, image_path: Path, report: JobPostingReport) -> str:
    report_dir.mkdir(parents=True, exist_ok=True)
    report_name = f'{image_path.stem}.json'
    report_path = report_dir / report_name
    temporary_path = report_dir / f'.{image_path.stem}.{uuid4().hex}.part'
    try:
        temporary_path.write_text(report.model_dump_json(indent=2), encoding='utf-8')
        temporary_path.replace(report_path)
    finally:
        with suppress(OSError):
            temporary_path.unlink(missing_ok=True)
    return report_name


def create_processing_router(upload_dir: Path, report_dir: Path) -> APIRouter:
    router = APIRouter(prefix='/api/v1/job-postings', tags=['job-postings'])

    @router.post(
        '/process',
        response_model=ProcessingBatchResponse,
        summary='Process uploaded job-posting screenshots',
        description='Compares each PNG or JPEG in the upload directory with MikeAI and saves a JSON report per posting. Existing reports are reused unless force=true.',
    )
    def process_directory(force: bool = False) -> ProcessingBatchResponse:
        images = _image_files(upload_dir)
        if not images:
            return ProcessingBatchResponse(
                total_images=0,
                processed=0,
                skipped=0,
                failed=0,
                results=[],
            )

        agent: FoundryJobPostingAgent | None = None
        results: list[ProcessedPosting] = []
        for image_path in images:
            report_name = f'{image_path.stem}.json'
            existing_report_path = report_dir / report_name
            if not force and existing_report_path.is_file():
                try:
                    existing_report = JobPostingReport.model_validate_json(
                        existing_report_path.read_text(encoding='utf-8')
                    )
                    results.append(
                        ProcessedPosting(
                            image_file=image_path.name,
                            status='skipped',
                            report_file=report_name,
                            report=existing_report,
                        )
                    )
                    continue
                except Exception:
                    pass

            error_code = _validate_image(image_path)
            if error_code is not None:
                results.append(
                    ProcessedPosting(
                        image_file=image_path.name,
                        status='failed',
                        error_code=error_code,
                    )
                )
                continue

            try:
                if agent is None:
                    agent = create_agent()
                report = agent.generate_report(image_path)
                report_name = _save_report(report_dir, image_path, report)
                results.append(
                    ProcessedPosting(
                        image_file=image_path.name,
                        status='processed',
                        report_file=report_name,
                        report=report,
                    )
                )
            except AgentOutputError:
                results.append(
                    ProcessedPosting(
                        image_file=image_path.name,
                        status='failed',
                        error_code='invalid_agent_response',
                    )
                )
            except Exception:
                results.append(
                    ProcessedPosting(
                        image_file=image_path.name,
                        status='failed',
                        error_code='processing_failed',
                    )
                )

        return ProcessingBatchResponse(
            total_images=len(images),
            processed=sum(result.status == 'processed' for result in results),
            skipped=sum(result.status == 'skipped' for result in results),
            failed=sum(result.status == 'failed' for result in results),
            results=results,
        )

    return router
