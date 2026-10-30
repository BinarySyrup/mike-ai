from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from mikeai.main import create_app
from mikeai.uploads import MAX_UPLOAD_SIZE_BYTES

PNG_SIGNATURE = b'\x89PNG\r\n\x1a\n'
JPEG_SIGNATURE = b'\xff\xd8\xff'


@pytest.fixture
def upload_dir(tmp_path: Path) -> Path:
    return tmp_path / 'job-postings'


@pytest.fixture
def client(upload_dir: Path) -> Iterator[TestClient]:
    with TestClient(create_app(upload_dir)) as test_client:
        yield test_client


def test_health_check(client: TestClient) -> None:
    response = client.get('/health')

    assert response.status_code == 200
    assert response.json() == {'status': 'ok'}


def test_upload_saves_png_with_generated_name(
    client: TestClient, upload_dir: Path
) -> None:
    image = PNG_SIGNATURE + b'screenshot-bytes'

    response = client.post(
        '/api/v1/job-postings/screenshots',
        files={'screenshot': ('job posting.png', image, 'image/png')},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload['file_name'].endswith('.png')
    assert payload['file_name'] != 'job posting.png'
    assert payload['media_type'] == 'image/png'
    assert payload['size_bytes'] == len(image)
    assert payload['status'] == 'uploaded'
    assert (upload_dir / payload['file_name']).read_bytes() == image


def test_upload_accepts_jpeg(client: TestClient, upload_dir: Path) -> None:
    image = JPEG_SIGNATURE + b'screenshot-bytes'

    response = client.post(
        '/api/v1/job-postings/screenshots',
        files={'screenshot': ('posting.jpg', image, 'image/jpeg')},
    )

    assert response.status_code == 201
    assert response.json()['file_name'].endswith('.jpg')
    assert len(list(upload_dir.iterdir())) == 1


def test_upload_rejects_unsupported_media_type(client: TestClient) -> None:
    response = client.post(
        '/api/v1/job-postings/screenshots',
        files={'screenshot': ('posting.gif', b'GIF89a', 'image/gif')},
    )

    assert response.status_code == 415


def test_upload_rejects_content_that_does_not_match_media_type(
    client: TestClient,
) -> None:
    response = client.post(
        '/api/v1/job-postings/screenshots',
        files={'screenshot': ('posting.png', JPEG_SIGNATURE, 'image/png')},
    )

    assert response.status_code == 415


def test_upload_rejects_empty_file(client: TestClient) -> None:
    response = client.post(
        '/api/v1/job-postings/screenshots',
        files={'screenshot': ('posting.png', b'', 'image/png')},
    )

    assert response.status_code == 400


def test_upload_rejects_files_over_size_limit(
    client: TestClient, upload_dir: Path
) -> None:
    image = PNG_SIGNATURE + b'x' * MAX_UPLOAD_SIZE_BYTES

    response = client.post(
        '/api/v1/job-postings/screenshots',
        files={'screenshot': ('posting.png', image, 'image/png')},
    )

    assert response.status_code == 413
    assert not list(upload_dir.glob('*.png'))
    assert not any(path.name.endswith('.part') for path in upload_dir.iterdir())
