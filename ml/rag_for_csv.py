from dotenv import load_dotenv
import os
from langchain_community.document_loaders.csv_loader import CSVLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

load_dotenv()

# Load API keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize OpenAI embeddings
embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)

# Function to load CSV data
def load_csv(file_path):
    loader = CSVLoader(file_path=file_path)
    data = loader.load()
    return data

# Function to chunk text into smaller pieces
def chunk_text(data, chunk_size=800, chunk_overlap=50):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    chunks = text_splitter.split_documents(data)
    return chunks

# Function to create or update ChromaDB with embeddings
def create_or_update_chroma_db(documents, persist_directory="chroma_db"):
    if not os.path.exists(persist_directory):
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
    You must only and only answer using the context. If the question is outside the context then specify to the user that the info you have asked is not given in the context and hence you cannot answer about it. Be apologetic if you can't answer. Do not give any other answer outside the context strictly. Use the context below to answer the query:
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

# Main function to process CSV and implement RAG-based chatbot
def process_csv_and_chatbot(csv_files, query):
    all_documents = []
    for csv_file in csv_files:
        print(f"Processing CSV file: {csv_file}")
        data = load_csv(csv_file)
        documents = chunk_text(data)
        all_documents.extend(documents)

    # Create or update ChromaDB with all documents
    chroma_db = create_or_update_chroma_db(all_documents)

    # Fetch relevant documents and generate response
    relevant_docs = fetch_relevant_docs(query, chroma_db)
    context = " ".join([doc.page_content for doc in relevant_docs])
    response = generate_response_with_groq(query, context)

    return response, context

# Example usage
if __name__ == "__main__":
    # List of CSV file paths
    csv_files = [
        "yug_try_data_own.csv",
        "students_data.csv"
        # Add more CSV file paths here
    ]

    # Example query
    query = "Tell me everything about Jaime Mcpherson"

    # Process CSV files and generate response
    response, context = process_csv_and_chatbot(csv_files, query)

    # Print context and response
    print("Context:")
    print(context)
    print("\nResponse:")
    print(response)