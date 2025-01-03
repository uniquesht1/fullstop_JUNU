import openai
import os
import sys
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from langchain.vectorstores import Chroma
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.chat_models import ChatOpenAI

# Add the directory containing speech_processing.py to sys.path
sys.path.append(os.path.abspath("../../azurespeech"))

# Now you can import the module
import speech_processing

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Azure and OpenAI setup
subscription_key = os.getenv('AZURE_SPEECH_KEY')
service_region = os.getenv('AZURE_SERVICE_REGION')
openai.api_key = os.getenv('OPENAI_API_KEY')
CHROMA_PATH = "chroma"
MODEL_NAME = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
GPT_MODEL = "gpt-4o-mini"

# Initialize vector store and chatbot
def load_vector_store():
    emb_model = HuggingFaceEmbeddings(model_name=MODEL_NAME)
    return Chroma(persist_directory=CHROMA_PATH, embedding_function=emb_model)

def query_vector_store(db, query_text):
    results = db.similarity_search_with_relevance_scores(query_text, k=3)
    if len(results) == 0 or results[0][1] < 0.3:
        return "सम्बन्धित परिणाम भेटिएन।"
    return "\n\n---\n\n".join([doc.page_content for doc, _score in results])

def format_prompt(conversation_history, user_question, context_text, max_history=5):
    prompt_template = """
    तपाईं जुनु हुनुहुन्छ, सरकारी कार्यालयका प्रक्रियाहरू बुझ्न र कार्यहरू पूरा गर्न सहयोग पुर्‍याउन नेपाली नागरिकलाई सहयोग गर्ने ज्ञानयुक्त सहायक। प्रयोगकर्ताको प्रश्न र अघिल्लो कुराकानी इतिहासबाट सम्बन्धित विवरणहरू प्रयोग गरी सटीक, संक्षिप्त, र सहायक उत्तर दिनुहोस्। स्पष्टताका लागि अघिल्लो कुराकानीलाई स्पष्ट रूपमा उल्लेख गर्न आवश्यक नभएसम्म उल्लेख नगर्नुहोस्। डेटाबेसमा भएका तथ्यहरूका आधारमा मात्र उत्तर दिनुहोस्।

    ---

    **कुराकानीको इतिहास:**
    {conversation_history}

    **हालको प्रयोगकर्ताको प्रश्न:** 
    {user_question}

    **प्राप्त दस्तावेज डेटा:**
    {context}

    ---

    """
    trimmed_history = conversation_history[-max_history:]
    formatted_history = "\n".join([f"प्रयोगकर्ता: {entry['user']}\nसहायक: {entry['assistant']}" for entry in trimmed_history])
    return prompt_template.format(
        conversation_history=formatted_history,
        user_question=user_question,
        context=context_text
    )

# FastAPI app initialization
app = FastAPI()

# Store conversation history globally
conversation_history = []
db = load_vector_store()

# Define Pydantic model for input and output
class ChatResponse(BaseModel):
    answer: str
    audio_url: str  # Include the audio URL for playback

@app.post("/chat", response_model=ChatResponse)
async def chat_with_bot(file: UploadFile = File(...)):
    global conversation_history

    # Read the audio file and process with STT (speech-to-text)
    audio_file_path = "user_audio.wav"
    with open(audio_file_path, "wb") as audio_file:
        audio_file.write(await file.read())

    # Convert the audio to text using STT (Speech-to-Text)
    user_question = speech_processing.speech_to_text(audio_file_path)

    if not user_question:
        raise HTTPException(status_code=400, detail="Unable to recognize speech")

    # Query the vector store for context
    context_text = query_vector_store(db, user_question)
    if not context_text:
        context_text = "सम्बन्धित डेटा उपलब्ध छैन।"

    # Format the prompt and generate response
    prompt = format_prompt(conversation_history, user_question, context_text)
    response = ChatOpenAI(model=GPT_MODEL).invoke(prompt).content

    # Append the conversation history
    conversation_history.append({"user": user_question, "assistant": response})

    # Convert response to speech and store it as an audio file
    speech_output_path = "response_audio.wav"
    speech_processing.text_to_speech(response)

    # Return the response and audio URL for playback
    audio_url = "/static/response_audio.wav"
    return ChatResponse(answer=response, audio_url=audio_url)

# Endpoint to serve the audio file
@app.get("/static/{filename}")
async def get_audio_file(filename: str):
    file_path = f"./{filename}"
    if os.path.exists(file_path):
        return FileResponse(file_path)
    else:
        raise HTTPException(status_code=404, detail="File not found")

# Run FastAPI server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
