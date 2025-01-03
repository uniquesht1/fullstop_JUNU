import azure.cognitiveservices.speech as speechsdk
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Replace with your own subscription key and service region (e.g., "westus")
subscription_key = os.getenv('AZURE_SPEECH_KEY')
service_region = os.getenv('AZURE_SERVICE_REGION')  # e.g., "westus"

# Create the audio configuration for the microphone and the speech configuration specifying the language.
audio_config = speechsdk.audio.AudioConfig(use_default_microphone=True)
speech_config = speechsdk.SpeechConfig(subscription=subscription_key, region=service_region)

# Setting the recognition language to Nepali.
speech_config.speech_recognition_language = "ne-NP"

# Create the speech recognizer.
speech_recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)

print("Speak into your microphone...")

# Start the recognizer and wait for a result.
result = speech_recognizer.recognize_once()

# Check the result.
if result.reason == speechsdk.ResultReason.RecognizedSpeech:
    print("Recognized: {}".format(result.text))
elif result.reason == speechsdk.ResultReason.NoMatch:
    print("No speech could be recognized: {}".format(result.no_match_details))
elif result.reason == speechsdk.ResultReason.Canceled:
    cancellation_details = result.cancellation_details
    print("Speech Recognition canceled: {}".format(cancellation_details.reason))
    if cancellation_details.reason == speechsdk.CancellationReason.Error:
        print("Error details: {}".format(cancellation_details.error_details))
