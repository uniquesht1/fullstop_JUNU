import azure.cognitiveservices.speech as speechsdk
from constants import subscription_key, service_region, sample_audio_file_path


def text_to_speech(text):
    speech_config = speechsdk.SpeechConfig(subscription=subscription_key, region=service_region)
    speech_config.speech_synthesis_voice_name = "ne-NP-HemkalaNeural"
    audio_config = speechsdk.audio.AudioOutputConfig(filename=filename)
    speech_synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=sample_audio_file_path)

    result = speech_synthesizer.speak_text_async(text).get()

    if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        print(f"Speech synthesized to [{filename}] for text [{text}]")
    elif result.reason == speechsdk.ResultReason.Canceled:
        cancellation_details = result.cancellation_details
        print("Speech synthesis canceled: {}".format(cancellation_details.reason))
        if cancellation_details.reason == speechsdk.CancellationReason.Error:
            if cancellation_details.error_details:
                print("Error details: {}".format(cancellation_details.error_details))
        print("Did you update the subscription info?")

def speech_to_text(filename):
    audio_config = speechsdk.audio.AudioConfig(filename=filename)
    speech_config = speechsdk.SpeechConfig(subscription=subscription_key, region=service_region)
    speech_config.speech_recognition_language = "ne-NP"
    speech_recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)

    result = speech_recognizer.recognize_once()

    if result.reason == speechsdk.ResultReason.RecognizedSpeech:
        print("Recognized: {}".format(result.text))
        return result.text
    elif result.reason == speechsdk.ResultReason.NoMatch:
        print("No speech could be recognized: {}".format(result.no_match_details))
    elif result.reason == speechsdk.ResultReason.Canceled:
        cancellation_details = result.cancellation_details
        print("Speech Recognition canceled: {}".format(cancellation_details.reason))
        if cancellation_details.reason == speechsdk.CancellationReason.Error:
            print("Error details: {}".format(cancellation_details.error_details))

