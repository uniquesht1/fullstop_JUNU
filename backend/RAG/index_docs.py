from langchain_community.document_loaders import UnstructuredMarkdownLoader,DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

import os
import shutil
from pathlib import Path

CHROMA_PATH = "chroma"
DATA_PATH = "Data"
emb_model = HuggingFaceEmbeddings(model_name="sentence-transformers/paraphrase-multilingual-mpnet-base-v2")


# Initialize lists to hold documents
md_documents = []

def generate_data_store():
    print("Start")
    documents = load_documents() 
    print(f"Loaded {len(documents)} documents")
    chunks = split_text(documents)
    print("Chunks generated")
    save_to_chroma(chunks)

def load_documents():
    data_folder = Path(DATA_PATH)
    for file_path in data_folder.iterdir():
        if file_path.suffix == '.md':
            loader = UnstructuredMarkdownLoader(str(file_path))
            md_documents.extend(loader.load())
            print(md_documents)

    # Combine documents
    all_documents=md_documents
    return all_documents

def split_text(documents: list[Document]):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1200,
        chunk_overlap=300,
        length_function=len,
        add_start_index=True,
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Split {len(documents)} documents into {len(chunks)} chunks.")

    return chunks

def save_to_chroma(chunks: list[Document]):
    # Clear out the database first.
    if os.path.exists(CHROMA_PATH):
        shutil.rmtree(CHROMA_PATH)
        
    # Create a new DB from the documents.
    db = Chroma.from_documents(
        chunks, emb_model, persist_directory=CHROMA_PATH
    )
    db.persist()
    print(f"Saved {len(chunks)} chunks to {CHROMA_PATH}.")

if __name__ == "__main__":
    generate_data_store()