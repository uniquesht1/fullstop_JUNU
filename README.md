# JUNU: Your Government Office Voice Assistant

<p>
  JUNU is a voice and chat assistant designed to help citizens navigate complex government processes with ease. It provides step-by-step guidance in Nepali and English, answering questions about required documents, fees, locations, and procedures. Built using cutting-edge technologies like GPT-powered models, Azure STT/TTS, and a user-friendly React.js interface, JUNU bridges the communication gap between citizens and government offices, saving time and reducing frustration.
<p/>

## FastAPI Backend for Chat, STT, and TTS Services

This project is a FastAPI backend that provides:
1. **Chat Endpoint**: Process user inputs (text or voice) and generate responses using a conversational AI model.
2. **Speech-to-Text (STT) Endpoint**: Convert uploaded audio files (WAV format) into text using Azure STT.
3. **Text-to-Speech (TTS) Endpoint**: Convert text into speech and return the generated audio.


---

## Requirements
- **Python**: `>= 3.8`
- **Dependencies**:
  - FastAPI
  - Uvicorn
  - Azure SDKs for STT/TTS
- **Node.js**: For frontend.

---

## Installation and Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Zdrlfx/fullstop.git
   cd fullstop

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **OBuild the frontend**:
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

4. **Start the server**:
   ```bash
   uvicorn main:app --reload
   ```
   
---

## API Endpoints

1. **Chat Endpoint** (`POST /chat`):
   - Request: `ChatRequest` model (mode, user_input, history).
   - Response: AI-generated response.

2. **STT Endpoint** (`POST /stt`):
   - Upload a WAV audio file.
   - Response: Transcribed text.

3. **TTS Endpoint** (`POST /tts`):
   - Provide text input.
   - Response: Generated WAV audio file.

---

## Notes
- Ensure Azure credentials are configured for STT and TTS services.
- The frontend build process is optional but recommended for full functionality.

## .env format
- make a .env file inside fullstop repository int the following format> :
  ```
  OPENAI_API_KEY=YOUR_API_KEY
  AZURE_SPEECH_KEY=YOUR_SPEECH_API_KEY
  AZURE_SERVICE_REGION=YOUR_SERVICE_REGION
  ```

## Next step
- After running the backend, open the frontend directory in another terminal and follow the setup step that is present inside frontend directory.

---

## License
This project is licensed under the [MIT License](LICENSE).

