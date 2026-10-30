from contextlib import suppress
from pathlib import Path
from typing import Annotated, Literal
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel

MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024
CHUNK_SIZE_BYTES = 64 * 1024
SUPPORTED_IMAGE_TYPES = {
    'image/jpeg': ('.jpg', b'\xff\xd8\xff'),
    'image/png': ('.png', b'\x89PNG\r\n\x1a\n'),
}


class ScreenshotUploadResponse(BaseModel):
    id: str
    file_name: str
    media_type: str
    size_bytes: int
    status: Literal['uploaded']


def _remove_temporary_file(path: Path | None) -> None:
    if path is not None:
        with suppress(OSError):
            path.unlink(missing_ok=True)


def create_uploads_router(upload_dir: Path) -> APIRouter:
    router = APIRouter(prefix='/api/v1/job-postings', tags=['job-postings'])

    @router.post(
        '/screenshots',
        response_model=ScreenshotUploadResponse,
        status_code=status.HTTP_201_CREATED,
    )
    async def upload_screenshot(
        screenshot: Annotated[
            UploadFile,
            File(description='A PNG or JPEG screenshot of a job posting.'),
        ],
    ) -> ScreenshotUploadResponse:
        temporary_file: Path | None = None
        try:
            media_type = screenshot.content_type or ''
            image_details = SUPPORTED_IMAGE_TYPES.get(media_type)
            if image_details is None:
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail='Only PNG and JPEG screenshots are supported.',
                )

            extension, signature = image_details
            upload_id = uuid4().hex
            file_name = f'{upload_id}{extension}'
            destination = upload_dir / file_name
            temporary_file = upload_dir / f'.{upload_id}.part'

            upload_dir.mkdir(parents=True, exist_ok=True)
            first_chunk = await screenshot.read(CHUNK_SIZE_BYTES)
            if not first_chunk:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail='The uploaded file is empty.',
                )
            if not first_chunk.startswith(signature):
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail='The file content does not match its image type.',
                )

            size_bytes = len(first_chunk)
            if size_bytes > MAX_UPLOAD_SIZE_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail='The screenshot exceeds the 10 MiB upload limit.',
                )

            with temporary_file.open('xb') as destination_file:
                destination_file.write(first_chunk)
                while chunk := await screenshot.read(CHUNK_SIZE_BYTES):
                    size_bytes += len(chunk)
                    if size_bytes > MAX_UPLOAD_SIZE_BYTES:
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail='The screenshot exceeds the 10 MiB upload limit.',
                        )
                    destination_file.write(chunk)

            temporary_file.replace(destination)
            return ScreenshotUploadResponse(
                id=upload_id,
                file_name=file_name,
                media_type=media_type,
                size_bytes=size_bytes,
                status='uploaded',
            )
        except HTTPException:
            _remove_temporary_file(temporary_file)
            raise
        except OSError as error:
            _remove_temporary_file(temporary_file)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail='The screenshot could not be saved.',
            ) from error
        finally:
            await screenshot.close()

    return router
