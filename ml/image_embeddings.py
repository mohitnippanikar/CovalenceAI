from chromadb.utils.embedding_functions import OpenCLIPEmbeddingFunction
from chromadb.utils.data_loaders import ImageLoader
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Load API keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Initialize CLIP embedding function
embedding_function = OpenCLIPEmbeddingFunction()

# Initialize image loader
data_loader = ImageLoader()

# Function to process images and create embeddings
def process_images(image_paths, persist_directory="image_chroma_db"):
    # Load images and generate embeddings
    documents = []
    for image_path in image_paths:
        try:
            # Load image and generate embedding
            image_data = data_loader.load(image_path)
            documents.append({
                "content": f"Image: {os.path.basename(image_path)}",
                "metadata": {"file_name": os.path.basename(image_path)},
                "embedding": embedding_function.embed(image_data)
            })
        except Exception as e:
            print(f"Error processing image {image_path}: {e}")

    # Create ChromaDB and store embeddings
    if not os.path.exists(persist_directory):
        os.makedirs(persist_directory)
    chroma_db = Chroma.from_documents(documents, embedding_function, persist_directory=persist_directory)
    chroma_db.persist()
    return chroma_db

# Function to fetch relevant images using ChromaDB
def fetch_relevant_images(query, chroma_db, k=5):
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

# Main function to implement RAG-based chatbot for images
def image_rag_chatbot(image_paths):
    # Process images and create ChromaDB
    print("Processing images and creating ChromaDB...")
    chroma_db = process_images(image_paths)

    # Interactive chatbot loop
    while True:
        query = input("\nEnter your query (type 'quit' to exit): ")
        if query.lower() == "quit":
            print("Exiting chatbot. Goodbye!")
            break

        # Fetch relevant images
        relevant_docs = fetch_relevant_images(query, chroma_db)
        context = " ".join([doc["content"] for doc in relevant_docs])
        file_names = [doc["metadata"]["file_name"] for doc in relevant_docs]

        # Generate response using Groq
        response = generate_response_with_groq(query, context)

        # Print context and response
        print("\nContext:")
        for file_name, doc in zip(file_names, relevant_docs):
            print(f"File: {file_name}\nContent: {doc['content']}\n")
        print("\nResponse:")
        print(response)

# Example usage
if __name__ == "__main__":
    # List of image file paths
    image_paths = [
        "phone.jpeg"
    ]

    # Start the chatbot
    image_rag_chatbot(image_paths)