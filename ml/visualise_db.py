from langchain_community.vectorstores import Chroma
import os

# Load API keys (if needed for embeddings)
from dotenv import load_dotenv
load_dotenv()

# Function to visualize and save ChromaDB contents, including embeddings
def visualize_chroma_db(persist_directory="chroma_db", output_file="chroma_db_contents.txt"):
    if not os.path.exists(persist_directory):
        print(f"No ChromaDB found at {persist_directory}.")
        return

    # Load the ChromaDB
    chroma_db = Chroma(persist_directory=persist_directory)

    # Retrieve all documents, metadata, and embeddings
    all_docs = chroma_db._collection.get(include=["metadatas", "documents", "embeddings"])

    # Write the contents to a file
    with open(output_file, "w", encoding="utf-8") as file:
        file.write("ChromaDB Contents:\n")
        for i, (doc, metadata, embedding) in enumerate(zip(all_docs["documents"], all_docs["metadatas"], all_docs["embeddings"])):
            file.write(f"\nDocument {i + 1}:\n")
            file.write(f"Content: {doc}\n")
            file.write(f"Metadata: {metadata}\n")
            file.write(f"Embedding: {embedding}\n")  # Include the embedding

    print(f"ChromaDB contents saved to {output_file}")

# Example usage
if __name__ == "__main__":
    # Specify the directory where ChromaDB is stored
    persist_directory = "chroma_db"

    # Specify the output file name
    output_file = "chroma_db_contents.txt"

    # Visualize and save the contents of the ChromaDB
    visualize_chroma_db(persist_directory, output_file)