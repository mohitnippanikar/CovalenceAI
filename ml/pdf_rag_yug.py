from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Load API keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize OpenAI embeddings
embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)

# Function to chunk text into smaller pieces
def chunk_text(text, file_name, chunk_size=1000, chunk_overlap=100):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    chunks = text_splitter.split_text(text)
    return [Document(page_content=chunk, metadata={"file_name": file_name}) for chunk in chunks]

# Function to process PDF files
def process_pdf(file_path):
    loader = PyPDFLoader(file_path)
    pages = loader.load()  # Extract text from the PDF file

    # Combine all pages into a single string
    combined_text = " ".join([page.page_content for page in pages])

    # Chunk the combined text
    documents = chunk_text(combined_text, file_name=os.path.basename(file_path))
    return documents

# Function to create ChromaDB and store embeddings
def create_chroma_db(documents, persist_directory="pdf_chroma_db"):
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
    You are an AI assistant that answers questions based on the provided context only.
    Use the context below to answer the query as accurately as possible. If the question is outside the context or the context does not provide enough information, specify to the user that the information is not available in the context. Be apologetic if you can't answer, but try to infer answers from the context when possible. Do not provide any information that is not present in the context.
    
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

# One-time setup to create embeddings and store them in ChromaDB
def setup_embeddings(pdf_file_paths, persist_directory="pdf_chroma_db"):
    all_documents = []
    for file_path in pdf_file_paths:
        print(f"Processing PDF file: {file_path}")
        documents = process_pdf(file_path)
        all_documents.extend(documents)

    # Create ChromaDB and store embeddings
    chroma_db = create_chroma_db(all_documents, persist_directory=persist_directory)
    print("Embeddings created and stored in ChromaDB.")
    return chroma_db

# Function to answer a query using the conversation history
def answer_query(query, chroma_db, chat_memory, k=5):
    # Fetch relevant documents
    relevant_docs = fetch_relevant_docs(query, chroma_db, k=k)
    context = " ".join([doc.page_content for doc in relevant_docs])

    # Add conversation history to the context
    conversation_history = "\n".join(chat_memory)
    full_context = f"{conversation_history}\n\n{context}"

    # Generate response using Groq
    response = generate_response_with_groq(query, full_context)

    # Update chat memory
    chat_memory.append(f"User: {query}")
    chat_memory.append(f"Assistant: {response}")

    return response

# Example usage
if __name__ == "__main__":
    # List of PDF file paths
    pdf_file_paths = [
        "historyy.pdf"
    ]

    # One-time setup to create embeddings
    persist_directory = "pdf_chroma_db"
    chroma_db = setup_embeddings(pdf_file_paths, persist_directory=persist_directory)

    # Initialize chat memory
    chat_memory = []

    # Example query
    query = "What impression does the image of Brahmans offering Shastras to Britannia create?"
    response = answer_query(query, chroma_db, chat_memory)
    print("\nResponse:")
    print(response)