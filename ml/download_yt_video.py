from pytubefix import YouTube  # Ensure pytube is installed and working
from audio_extract import extract_audio
import os
import shutil  # For clearing the chunks folder
from dotenv import load_dotenv
from faster_whisper import WhisperModel  # Import faster-whisper
from pydub import AudioSegment

load_dotenv()

def download_video(youtube_url, output_path="adani_video1.mp4"):
    yt = YouTube(youtube_url)
    stream = yt.streams.filter(progressive=True, file_extension='mp4').first()
    stream.download(filename=output_path)
    print(f"Download complete! Saved as {output_path}")
    return output_path

from audio_extract import extract_audio

extract_audio(input_path="video.mp4", output_path="atom_audio.mp3")


# download_video("https://www.youtube.com/watch?v=ICdcPVGDv9A")
