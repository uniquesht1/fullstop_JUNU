# from langchain_community.vectorstores import Chroma
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import Chroma
from langchain.chat_models import ChatOpenAI
from openai import OpenAI

import openai
import os

CHROMA_PATH = "chroma"
openai.api_key = os.getenv("OPENAI_API_KEY")
conversation_history = []

non_rag_prompt = """
You are Junu, a helpful assistant designed to assist Nepali citizens visiting government offices. Your purpose is to provide clear, accurate, and adequate information to help users navigate their government-related tasks effectively. Depending on the user's input, respond appropriately based on the detected intent.

- If the user greets you with "Namaste," "Hello," or similar greetings, respond by acknowledging the greeting and let them know that you're here to assist with any queries related to government office tasks in Nepal.
- If the user expresses gratitude (e.g., "Dhanyabad," "Thank you," "Thanks," "I appreciate it"), respond politely and naturally with gratitude.
- If the user asks for information related to a specific task, provide them with detailed, clear, and accurate steps or guidance to help them complete their task efficiently.
- If the user expresses confusion or frustration, respond empathetically and provide reassurance, offering additional clarity or steps to resolve their concerns.
- In all cases, maintain a helpful, polite, and professional tone, ensuring that the user feels supported and informed.

User: {user_input}
Assistant:
"""


def load_vector_store():
    # Use the HuggingFace embeddings model
    emb_model = HuggingFaceEmbeddings(model_name="sentence-transformers/paraphrase-multilingual-mpnet-base-v2")
    return Chroma(persist_directory=CHROMA_PATH, embedding_function=emb_model)


def query_vector_store(db, query_text):
    results = db.similarity_search_with_relevance_scores(query_text, k=3)
    if len(results) == 0 or results[0][1] < 0.3:
        print(f"Unable to find matching results.")
        
    context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results])
   
    return context_text


def format_prompt(conversation_history, user_question, context_text, max_history=5):
    # Define the RAG prompt template with placeholders
    prompt_template = """
    You are Junu, a knowledgeable assistant dedicated to helping Nepali citizens navigate government office processes and complete their tasks efficiently. Use the user’s question and relevant details from previous conversation history to provide an accurate, concise, and helpful response. Avoid explicitly referencing previous conversations unless absolutely necessary for clarity. Answer only based on facts present in the database.

    ---

    **Conversation History:**
    {conversation_history}

    **Current User Question:** 
    {user_question}

    **Retrieved Document Data:**
    {context}

    ---

    """

    # Limit the conversation history to the last `max_history` entries
    trimmed_history = conversation_history[-max_history:]

    # Format the trimmed conversation history as a string
    formatted_history = "\n".join([f"User: {entry['user']}\nAssistant: {entry['assistant']}" for entry in trimmed_history])

    # Fill in the placeholders in the template
    prompt = prompt_template.format(
        conversation_history=formatted_history,
        user_question=user_question,
        context=context_text
    )
    
    return prompt


model = ChatOpenAI(model="gpt-4o-mini")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
last_context = None
db = load_vector_store()


def main():
    global last_context
    while True:
        # Get user input
        user_question = input("You: ")
        
        # Perform a vector search or use last context if available
        context_text = last_context if last_context else query_vector_store(db, user_question)

        # Handle cases where no relevant context is found
        if not context_text:
            print("No relevant context found.")
            continue

        # Format the prompt with conversation history and context
        prompt = format_prompt(conversation_history, user_question, context_text)
        
        # Generate the assistant's response
        response = model.invoke(prompt)
        print(f"Junu: {response.content}")

        # Update conversation history and last context
        conversation_history.append({"user": user_question, "assistant": response.content})
        last_context = context_text


# Function for API:
def get_model_response(user_input, conversation_history, last_context):
    # Perform a vector search or use last context if available
    context_text = last_context if last_context else query_vector_store(db, user_input)

    # Format the prompt with conversation history and context
    prompt = format_prompt(conversation_history, user_input, context_text)

    # Generate the response
    response = model.invoke(prompt)
    return response.content, context_text


if __name__ == "__main__":
    main()
