from dotenv import load_dotenv
import os
import shutil
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_community.document_loaders.csv_loader import CSVLoader
from langchain_community.document_loaders import PyPDFLoader
from faster_whisper import WhisperModel
from pydub import AudioSegment
from audio_extract import extract_audio  # Ensure this is implemented for extracting audio from video

# Load environment variables
load_dotenv()

# Load API keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize OpenAI embeddings
embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)

# Global chat memory
chat_memory = []

# Function to chunk text into smaller pieces
def chunk_text(text, file_name, chunk_size=1000, chunk_overlap=100):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    chunks = text_splitter.split_text(text)
    return [Document(page_content=chunk, metadata={"file_name": file_name}) for chunk in chunks]

# Function to create ChromaDB and store embeddings
def create_chroma_db(documents, persist_directory="chroma_db"):
    if not os.path.exists(persist_directory):
        os.makedirs(persist_directory)
    try:
        chroma_db = Chroma.from_documents(documents, embeddings, persist_directory=persist_directory)
        chroma_db.persist()
        return chroma_db
    except KeyError as e:
        print(f"Error initializing ChromaDB: {e}")
        print("Clearing the persist directory and retrying...")
        shutil.rmtree(persist_directory)
        os.makedirs(persist_directory)
        chroma_db = Chroma.from_documents(documents, embeddings, persist_directory=persist_directory)
        chroma_db.persist()
        return chroma_db

# Function to fetch relevant documents using ChromaDB
def fetch_relevant_docs(query, chroma_db, k=5):
    retriever = chroma_db.as_retriever(search_kwargs={"k": k})
    return retriever.invoke(query)

# Function to generate a response using Groq
def generate_response_with_groq(query, context):
    prompt = f"""
    You are an AI assistant that answers questions based on the provided context and the conversation so far.
    Use the context below to answer the query as accurately as possible. If the question is outside the context or the context does not provide enough information, specify to the user that the information is not available in the context. Be apologetic if you can't answer, but try to infer answers from the context and conversation history when possible. Do not provide any information that is not present in the context.
    
    Context: {context}
    Query: {query}
    """
    llm = ChatGroq(temperature=0, groq_api_key=GROQ_API_KEY, model_name="llama-3.1-8b-instant")
    actual_prompt = ChatPromptTemplate.from_messages([
        ("system", prompt),
        ("human", "{input}")
    ])
    chain = actual_prompt | llm
    response = chain.invoke({"input": query})
    return response.content

# Unified function to process files
def process_file(file_path):
    file_extension = os.path.splitext(file_path)[1].lower()
    if file_extension == ".csv":
        loader = CSVLoader(file_path=file_path)
        data = loader.load()
        combined_text = " ".join([doc.page_content for doc in data])
        return chunk_text(combined_text, file_name=os.path.basename(file_path))
    elif file_extension == ".mp4":
        audio_output_path = "final_audio.mp3"
        if os.path.exists(audio_output_path):
            os.remove(audio_output_path)
        extract_audio(input_path=file_path, output_path=audio_output_path)
        return process_file(audio_output_path)
    elif file_extension == ".mp3":
        chunk_length_ms = 30000  # 30 seconds
        if os.path.exists("chunks"):
            shutil.rmtree("chunks")
        os.makedirs("chunks", exist_ok=True)
        audio = AudioSegment.from_file(file_path, format="mp3")
        chunks = [audio[i:i+chunk_length_ms] for i in range(0, len(audio), chunk_length_ms)]
        chunk_files = []
        for i, chunk in enumerate(chunks):
            chunk_path = f"chunks/chunk_{i}.wav"
            chunk.export(chunk_path, format="wav")
            chunk_files.append(chunk_path)
        model = WhisperModel("tiny.en", device="cpu", compute_type="int8")
        full_text = ""
        for chunk_path in chunk_files:
            segments, _ = model.transcribe(chunk_path)
            for segment in segments:
                full_text += segment.text + " "
        return chunk_text(full_text, file_name=os.path.basename(file_path))
    elif file_extension == ".pdf":
        loader = PyPDFLoader(file_path)
        pages = loader.load()
        combined_text = " ".join([page.page_content for page in pages])
        return chunk_text(combined_text, file_name=os.path.basename(file_path))
    else:
        raise ValueError(f"Unsupported file format: {file_extension}")

# Function to create embeddings for given file paths
def setup_embeddings(file_paths, persist_directory="chroma_db"):
    all_documents = []
    for file_path in file_paths:
        print(f"Processing file: {file_path}")
        documents = process_file(file_path)
        all_documents.extend(documents)
    chroma_db = create_chroma_db(all_documents, persist_directory=persist_directory)
    print("Embeddings created and stored in ChromaDB.")
    return chroma_db

# Function to answer a query using the conversation history
def answer_query(query, chroma_db, k=5):
    global chat_memory
    relevant_docs = fetch_relevant_docs(query, chroma_db, k=k)
    context = " ".join([doc.page_content for doc in relevant_docs])
    conversation_history = "\n".join(chat_memory)
    full_context = f"{conversation_history}\n\n{context}"
    response = generate_response_with_groq(query, full_context)
    chat_memory.append(f"User: {query}")
    chat_memory.append(f"Assistant: {response}")
    return response





# from dotenv import load_dotenv
# import os
# import shutil
# from langchain_core.prompts import ChatPromptTemplate
# from langchain_groq import ChatGroq
# from langchain_community.vectorstores import Chroma
# from langchain_community.embeddings import OpenAIEmbeddings
# from langchain.text_splitter import RecursiveCharacterTextSplitter
# from langchain.schema import Document
# from langchain_community.document_loaders.csv_loader import CSVLoader
# from langchain_community.document_loaders import PyPDFLoader
# from faster_whisper import WhisperModel
# from pydub import AudioSegment
# from audio_extract import extract_audio  # Ensure this is implemented for extracting audio from video

# # Load environment variables
# load_dotenv()

# # Load API keys
# GROQ_API_KEY = os.getenv("GROQ_API_KEY")
# OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# # Initialize OpenAI embeddings
# embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)

# # Function to chunk text into smaller pieces
# def chunk_text(text, file_name, chunk_size=1000, chunk_overlap=100):
#     text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
#     chunks = text_splitter.split_text(text)
#     return [Document(page_content=chunk, metadata={"file_name": file_name}) for chunk in chunks]

# # Function to create ChromaDB and store embeddings
# def create_chroma_db(documents, persist_directory="chroma_db"):
#     if not os.path.exists(persist_directory):
#         os.makedirs(persist_directory)
#     try:
#         chroma_db = Chroma.from_documents(documents, embeddings, persist_directory=persist_directory)
#         chroma_db.persist()
#         return chroma_db
#     except KeyError as e:
#         print(f"Error initializing ChromaDB: {e}")
#         print("Clearing the persist directory and retrying...")
#         shutil.rmtree(persist_directory)
#         os.makedirs(persist_directory)
#         chroma_db = Chroma.from_documents(documents, embeddings, persist_directory=persist_directory)
#         chroma_db.persist()
#         return chroma_db

# # Function to fetch relevant documents using ChromaDB
# def fetch_relevant_docs(query, chroma_db, k=5):
#     retriever = chroma_db.as_retriever(search_kwargs={"k": k})
#     return retriever.invoke(query)

# # Function to generate a response using Groq
# def generate_response_with_groq(query, context):
#     prompt = f"""
#     You are an AI assistant that answers questions based on the provided context and the conversation so far.
#     Use the context below to answer the query as accurately as possible. If the question is outside the context or the context does not provide enough information, specify to the user that the information is not available in the context. Be apologetic if you can't answer, but try to infer answers from the context and conversation history when possible. Do not provide any information that is not present in the context.
    
#     Context: {context}
#     Query: {query}
#     """
#     llm = ChatGroq(temperature=0, groq_api_key=GROQ_API_KEY, model_name="llama-3.1-8b-instant")
#     actual_prompt = ChatPromptTemplate.from_messages([
#         ("system", prompt),
#         ("human", "{input}")
#     ])
#     chain = actual_prompt | llm
#     response = chain.invoke({"input": query})
#     return response.content

# # Function to process CSV files
# def process_csv(file_path):
#     loader = CSVLoader(file_path=file_path)
#     data = loader.load()  # Returns a list of Document objects

#     # Combine the content of all documents into a single string
#     combined_text = " ".join([doc.page_content for doc in data])

#     # Chunk the combined text
#     documents = chunk_text(combined_text, file_name=os.path.basename(file_path))
#     return documents

# # Function to process MP4 files (video)
# def process_video(file_path):
#     audio_output_path = "final_audio.mp3"
#     if os.path.exists(audio_output_path):
#         os.remove(audio_output_path)
#     extract_audio(input_path=file_path, output_path=audio_output_path)
#     return process_audio(audio_output_path, file_name=os.path.basename(file_path))

# # Function to process MP3 files (audio)
# def process_audio(file_path, file_name):
#     # Split audio into chunks
#     chunk_length_ms = 30000  # 30 seconds
#     if os.path.exists("chunks"):
#         shutil.rmtree("chunks")
#     os.makedirs("chunks", exist_ok=True)

#     audio = AudioSegment.from_file(file_path, format="mp3")
#     chunks = [audio[i:i+chunk_length_ms] for i in range(0, len(audio), chunk_length_ms)]
#     chunk_files = []
#     for i, chunk in enumerate(chunks):
#         chunk_path = f"chunks/chunk_{i}.wav"
#         chunk.export(chunk_path, format="wav")
#         chunk_files.append(chunk_path)

#     # Transcribe audio chunks
#     model = WhisperModel("tiny.en", device="cpu", compute_type="int8")
#     full_text = ""
#     for chunk_path in chunk_files:
#         segments, _ = model.transcribe(chunk_path)
#         for segment in segments:
#             full_text += segment.text + " "
    
#     # Chunk the transcription text
#     documents = chunk_text(full_text, file_name=file_name)
#     return documents

# # Function to process PDF files
# def process_pdf(file_path):
#     loader = PyPDFLoader(file_path)
#     pages = loader.load()  # Extract text from the PDF file

#     # Combine all pages into a single string
#     combined_text = " ".join([page.page_content for page in pages])

#     # Chunk the combined text
#     documents = chunk_text(combined_text, file_name=os.path.basename(file_path))
#     return documents

# # Unified function to process files
# def process_file(file_path):
#     file_extension = os.path.splitext(file_path)[1].lower()
#     if file_extension == ".csv":
#         return process_csv(file_path)
#     elif file_extension == ".mp4":
#         return process_video(file_path)
#     elif file_extension == ".mp3":
#         return process_audio(file_path, file_name=os.path.basename(file_path))
#     elif file_extension == ".pdf":
#         return process_pdf(file_path)
#     else:
#         raise ValueError(f"Unsupported file format: {file_extension}")

# # One-time setup to create embeddings and store them in ChromaDB
# def setup_embeddings(file_paths, persist_directory="chroma_db"):
#     all_documents = []
#     for file_path in file_paths:
#         print(f"Processing file: {file_path}")
#         documents = process_file(file_path)
#         all_documents.extend(documents)

#     # Create ChromaDB and store embeddings
#     chroma_db = create_chroma_db(all_documents, persist_directory=persist_directory)
#     print("Embeddings created and stored in ChromaDB.")
#     return chroma_db

# # Function to answer a query using the conversation history
# def answer_query(query, chroma_db, chat_memory, k=5):
#     # Fetch relevant documents
#     relevant_docs = fetch_relevant_docs(query, chroma_db, k=k)
#     context = " ".join([doc.page_content for doc in relevant_docs])

#     # Add conversation history to the context
#     conversation_history = "\n".join(chat_memory)
#     full_context = f"{conversation_history}\n\n{context}"

#     # Generate response using Groq
#     response = generate_response_with_groq(query, full_context)

#     # Update chat memory
#     chat_memory.append(f"User: {query}")
#     chat_memory.append(f"Assistant: {response}")

#     return response

# # Example usage
# if __name__ == "__main__":
#     # List of file paths (CSV, MP3, MP4, PDF)
#     file_paths = [
#         "input_files/students_data.csv",
#         "input_files/yug_try_data_own.csv",
#         "input_files/adani_video2.mp4",
#         "input_files/atom_audio.mp3",
#         "input_files/historyy.pdf"
#     ]

#     # One-time setup to create embeddings
#     persist_directory = "chroma_db"
#     chroma_db = setup_embeddings(file_paths, persist_directory=persist_directory)

#     # Initialize chat memory
#     chat_memory = []

#     # Example query
#     query = "What impression does the image of Brahmans offering Shastras to Britannia create?"
#     response = answer_query(query, chroma_db, chat_memory)
#     print("\nResponse:")
#     print(response)


