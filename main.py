import openai
import sys
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import FileResponse

from server.inference import getResponseFromModel
from server.speechprocessing import speech_to_text, text_to_speech
from server.model import ChatResponse, ChatRequest, STTResponse, TTSResponse, TTSRequest

app = FastAPI()

conversation_history = []

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    global conversation_history

    mode = request.mode
    user_input = request.user_input
    history = request.history

    if mode not in ["text", "voice"]:
        raise HTTPException(status_code=400, detail="Invalid mode. Choose either 'text' or 'voice'.")

    response = getResponseFromModel(mode=mode, user_input=user_input, conversation_history=conversation_history)

    conversation_history.append({"user": user_question, "assistant": response})

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
        text = speech_to_text(audio_file_path)
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
@app.post("/tts", response_model=TTSResponse, status_code=status.HTTP_200_OK)
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
        text_to_speech(text, speech_output_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "TTS conversion failed", "details": str(e)}
        )

    return TTSResponse(message="TTS conversion successful", audio_url=speech_output_path)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
