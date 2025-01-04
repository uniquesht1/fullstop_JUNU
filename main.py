from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from fastapi import status
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from server.index_docs import generate_data_store
from server.inference import getResponseFromModel
from server.speechprocessing import speech_to_text_from_azure, text_to_speech_from_azure
from server.model import ChatResponse, ChatRequest, STTResponse, TTSResponse, TTSRequest

app = FastAPI()

# Set up the path to the static folder
static_path = Path(__file__).parent / "dist"

# Mount the static folder to the root path
app.mount("/", StaticFiles(directory=static_path, html=True), name="static")

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    global conversation_history

    mode = request.mode
    user_input = request.user_input
    conversation_history = request.history

    if mode not in ["text", "voice"]:
        raise HTTPException(status_code=400, detail="Invalid mode. Choose either 'text' or 'voice'.")

    response = getResponseFromModel(mode=mode, user_input=user_input, conversation_history=conversation_history)

    conversation_history.append({"user": user_input, "assistant": response})

    return ChatResponse(answer=response)



# STT Endpoint
@app.post("/stt", response_model=STTResponse, status_code=status.HTTP_200_OK)
async def speech_to_text(file: UploadFile = File(...)):
    if not file.content_type == "audio/wav":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Invalid input", "details": "No valid WAV audio file provided"}
        )

    # Save the uploaded file temporarily
    audio_file_path = "uploaded_audio.wav"
    with open(audio_file_path, "wb") as audio_file:
        audio_file.write(await file.read())

    # Convert the audio to text using STT (Speech-to-Text)
    try:
        text = speech_to_text_from_azure(audio_file_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "STT conversion failed", "details": str(e)}
        )

    if not text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Invalid input", "details": "Unable to recognize speech"}
        )

    return STTResponse(text=text, message="STT conversion successful")

# TTS Endpoint
@app.post("/tts", status_code=status.HTTP_200_OK)
async def text_to_speech(request: TTSRequest):
    text = request.text
    if not text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Invalid input", "details": "Text field is missing"}
        )

    # Convert text to speech
    speech_output_path = "output_audio.wav"
    try:
        text_to_speech_from_azure(text, speech_output_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "TTS conversion failed", "details": str(e)}
        )

    # Return the generated audio file as a response
    return FileResponse(speech_output_path, media_type="audio/wav", headers={"Content-Disposition": "attachment; filename=output_audio.wav"})

if __name__ == "__main__":
    generate_data_store()
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
