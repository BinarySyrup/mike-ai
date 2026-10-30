import base64
import os
from pathlib import Path
from typing import Literal

from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential
from dotenv import load_dotenv
from pydantic import BaseModel, ValidationError

load_dotenv()


class JobQualificationAssessment(BaseModel):
    text: str
    type: Literal['required', 'preferred', 'unspecified']
    match: Literal['strong', 'partial', 'not_evidenced']
    source_text: str | None = None
    evidence: str | None = None


class JobPostingReport(BaseModel):
    job_title: str | None = None
    summary: str
    qualifications: list[JobQualificationAssessment]


class AgentOutputError(RuntimeError):
    pass


REPORT_PROMPT = (
    'Analyze the attached job-posting screenshot. Extract each stated job qualification '
    'and compare it with Mike’s documented professional background available to you. '
    'Return exactly one valid JSON object with job_title, summary, and qualifications. '
    'Each qualification must contain text, type, match, source_text, and evidence. '
    'Use required, preferred, or unspecified for type; use strong, partial, or '
    'not_evidenced for match. Preserve the qualification wording in source_text. '
    'Use only documented evidence about Mike. Do not invent experience. '
    'not_evidenced means the available profile has no supporting evidence; it does not '
    'prove Mike lacks the qualification. Do not wrap the JSON in Markdown.'
)


class FoundryJobPostingAgent:
    def __init__(self) -> None:
        endpoint = os.environ.get('AZURE_AI_PROJECT_ENDPOINT')
        if not endpoint:
            raise RuntimeError('AZURE_AI_PROJECT_ENDPOINT is required.')

        self.agent_name = os.environ.get('AZURE_AI_AGENT_NAME', 'mikeai-1-2')
        self.agent_version = os.environ.get('AZURE_AI_AGENT_VERSION', '2')
        credential = DefaultAzureCredential()
        project_client = AIProjectClient(endpoint=endpoint, credential=credential)
        self.openai_client = project_client.get_openai_client()

    def generate_report(self, image_path: Path) -> JobPostingReport:
        media_type = 'image/png' if image_path.suffix.lower() == '.png' else 'image/jpeg'
        image_data = base64.b64encode(image_path.read_bytes()).decode('ascii')
        image_url = f'data:{media_type};base64,{image_data}'

        response = self.openai_client.responses.create(
            input=[
                {
                    'role': 'user',
                    'content': [
                        {'type': 'input_text', 'text': REPORT_PROMPT},
                        {'type': 'input_image', 'image_url': image_url},
                    ],
                }
            ],
            extra_body={
                'agent_reference': {
                    'name': self.agent_name,
                    'version': self.agent_version,
                    'type': 'agent_reference',
                }
            },
        )

        try:
            return JobPostingReport.model_validate_json(response.output_text)
        except (TypeError, ValueError, ValidationError) as error:
            raise AgentOutputError('The agent did not return the expected JSON report.') from error


def create_agent() -> FoundryJobPostingAgent:
    return FoundryJobPostingAgent()
