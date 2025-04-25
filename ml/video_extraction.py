from pytubefix import YouTube  # Ensure pytube is installed and working
from audio_extract import extract_audio
import os
import shutil  # For clearing the chunks folder
from dotenv import load_dotenv
from faster_whisper import WhisperModel  # Import faster-whisper
from pydub import AudioSegment

load_dotenv()

def download_video(youtube_url, output_path="video.mp4"):
    yt = YouTube(youtube_url)
    stream = yt.streams.filter(progressive=True, file_extension='mp4').first()
    stream.download(filename=output_path)
    print(f"Download complete! Saved as {output_path}")
    return output_path

# Preprocessing: Split MP3 audio into 30-second chunks and save as WAV
def split_audio(input_audio_path, chunk_length_ms=30000):
    # Clear the chunks folder if it exists
    if os.path.exists("chunks"):
        shutil.rmtree("chunks")
    os.makedirs("chunks", exist_ok=True)

    audio = AudioSegment.from_file(input_audio_path, format="mp3")  # explicitly tell it's mp3
    chunks = [audio[i:i+chunk_length_ms] for i in range(0, len(audio), chunk_length_ms)]
    chunk_files = []
    for i, chunk in enumerate(chunks):
        chunk_path = f"chunks/chunk_{i}.wav"
        chunk.export(chunk_path, format="wav")  # export as WAV (faster-whisper expects WAV)
        chunk_files.append(chunk_path)
    return chunk_files

# Transcription: Load model (tiny + int8) and transcribe each chunk
def transcribe_chunks(chunk_files):
    model = WhisperModel("tiny.en", device="cpu", compute_type="int8")  # safest for kernel not crashing
    full_text = ""
    for chunk_path in chunk_files:
        segments, _ = model.transcribe(chunk_path)
        for segment in segments:
            full_text += segment.text + " "
    return full_text

# def get_transcription(input_file):
#     if input_file.startswith("http://") or input_file.startswith("https://"):
#         video_path = download_video(input_file)
#     else:
#         video_path = input_file

#     audio_output_path = "final_audio.mp3"
#     if os.path.exists(audio_output_path):
#         os.remove(audio_output_path)
#         print(f"Removed existing file: {audio_output_path}")

#     extract_audio(input_path=video_path, output_path=audio_output_path)
#     print("Extracted audio from video")
#     chunk_files = split_audio(audio_output_path)
#     transcription = transcribe_chunks(chunk_files)

#     # Save transcription to a text file
#     transcription_file = "transcription_adani_vid2.txt"
#     with open(transcription_file, "w", encoding="utf-8") as f:
#         f.write(transcription)
#     print(f"Transcription saved to {transcription_file}")

#     # Print transcription
#     print("Transcription:")
#     print(transcription)

#     return transcription


def get_transcription(video_file_path):
    """
    Process the provided video file, extract audio, split it into chunks, 
    transcribe the audio, and return/save the transcription.
    
    Args:
        video_file_path (str): Path to the video file (MP4 format).
    
    Returns:
        str: The transcription of the video.
    """
    # Ensure the provided file exists
    if not os.path.exists(video_file_path):
        raise FileNotFoundError(f"Video file not found: {video_file_path}")

    # Define the output path for the extracted audio
    audio_output_path = "final_audio.mp3"
    if os.path.exists(audio_output_path):
        os.remove(audio_output_path)
        print(f"Removed existing file: {audio_output_path}")

    # Extract audio from the video file
    extract_audio(input_path=video_file_path, output_path=audio_output_path)
    print("Extracted audio from video")

    # Split the audio into chunks
    chunk_files = split_audio(audio_output_path)
    print(f"Audio split into {len(chunk_files)} chunks")

    # Transcribe the audio chunks
    transcription = transcribe_chunks(chunk_files)

    # Save the transcription to a text file
    transcription_file = "transcription_output.txt"
    with open(transcription_file, "w", encoding="utf-8") as f:
        f.write(transcription)
    print(f"Transcription saved to {transcription_file}")

    # Print transcription
    print("Transcription:")
    print(transcription)

    return transcription

# if __name__ == "__main__":
#     input_file = input("Enter a file path : ")
#     transcript = get_transcription(input_file)