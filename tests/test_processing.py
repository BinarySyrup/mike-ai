from pathlib import Path

from fastapi.testclient import TestClient

from mikeai.agent import JobPostingReport
from mikeai.main import create_app

PNG_SIGNATURE = b'\x89PNG\r\n\x1a\n'


class FakeAgent:
    def generate_report(self, image_path: Path) -> JobPostingReport:
        return JobPostingReport(
            job_title='Senior Software Architect',
            summary='Strong alignment with documented architecture experience.',
            qualifications=[],
        )


def test_process_directory_saves_and_returns_reports(
    tmp_path: Path, monkeypatch
) -> None:
    upload_dir = tmp_path / 'uploads'
    report_dir = tmp_path / 'reports'
    upload_dir.mkdir()
    (upload_dir / 'posting.png').write_bytes(PNG_SIGNATURE + b'image-data')
    monkeypatch.setattr('mikeai.processing.create_agent', FakeAgent)
    client = TestClient(create_app(upload_dir, report_dir))

    response = client.post('/api/v1/job-postings/process')

    assert response.status_code == 200
    payload = response.json()
    assert payload['total_images'] == 1
    assert payload['processed'] == 1
    assert payload['skipped'] == 0
    assert payload['failed'] == 0
    assert payload['results'][0]['report_file'] == 'posting.json'
    assert (report_dir / 'posting.json').is_file()

    repeated_response = client.post('/api/v1/job-postings/process')

    assert repeated_response.status_code == 200
    assert repeated_response.json()['processed'] == 0
    assert repeated_response.json()['skipped'] == 1


def test_process_directory_returns_empty_result_when_no_images(tmp_path: Path) -> None:
    client = TestClient(create_app(tmp_path / 'uploads', tmp_path / 'reports'))

    response = client.post('/api/v1/job-postings/process')

    assert response.status_code == 200
    assert response.json() == {
        'total_images': 0,
        'processed': 0,
        'skipped': 0,
        'failed': 0,
        'results': [],
    }
