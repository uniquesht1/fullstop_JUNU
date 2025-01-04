import os
from dotenv import load_dotenv
import openai
load_dotenv()

subscription_key = os.environ['AZURE_SPEECH_KEY']
service_region = os.environ['AZURE_SERVICE_REGION']
sample_audio_file_path = "output.wav"


openai.api_key = os.environ['OPENAI_API_KEY']
CHROMA_PATH = "chroma"
EMBEDDING_MODEL_NAME = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
GPT_MODEL = "gpt-4o-mini"
