from dotenv import load_dotenv
import os
import shutil
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document

load_dotenv()

# Load API keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize OpenAI embeddings
embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)

# Function to chunk text into smaller pieces
def chunk_text(text, chunk_size=800, chunk_overlap=50):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    chunks = text_splitter.split_text(text)
    return [Document(page_content=chunk) for chunk in chunks]

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
        # Close the ChromaDB instance if it exists
        try:
            chroma_db.close()
        except NameError:
            pass
        shutil.rmtree(persist_directory)
        os.makedirs(persist_directory)
        chroma_db = Chroma.from_documents(documents, embeddings, persist_directory=persist_directory)
        chroma_db.persist()
        return chroma_db

# Function to fetch relevant documents using ChromaDB
def fetch_relevant_docs(query, chroma_db, k=5):
    retriever = chroma_db.as_retriever(search_kwargs={"k": k})
    return retriever.get_relevant_documents(query)

# Function to generate a response using Groq
def generate_response_with_groq(query, context):
    prompt = f"""
    You are an AI assistant that answers questions based on the provided context only.
    You must only and only answer using the context. If the question is outside the context then specify to the user that the info you have asked is not given in the context and hence you cannot answer about it.Be apologetic if you cant answer that you dont have access to those things.. Donot give any other answer outside the context strictly. Use the context below to answer the query:
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

# Main function to implement RAG-based chatbot
def rag_chatbot(transcript_text, query):
    # Step 1: Chunk the transcript text
    documents = chunk_text(transcript_text)

    # Step 2: Create ChromaDB and store embeddings
    chroma_db = create_chroma_db(documents)

    # Step 3: Fetch relevant documents
    relevant_docs = fetch_relevant_docs(query, chroma_db)
    context = " ".join([doc.page_content for doc in relevant_docs])

    # Step 4: Generate response using Groq
    response = generate_response_with_groq(query, context)
    return response, context

# Example usage
if __name__ == "__main__":
    # Read transcript text from transcription.txt
    transcription_file = "transcription.txt"
    if not os.path.exists(transcription_file):
        print(f"Error: {transcription_file} not found.")
        exit(1)

    with open(transcription_file, "r", encoding="utf-8") as f:
        transcript_text = f.read()

    # Example query
    # query = "What is Artificial Intelligence and its applications?"
    query = "name some imporatant scientist who made some discoveries about atoms?"

    # Generate response and context
    response, context = rag_chatbot(transcript_text, query)

    # Print context and response
    print("Context:")
    print(context)
    print("\nResponse:")
    print(response)