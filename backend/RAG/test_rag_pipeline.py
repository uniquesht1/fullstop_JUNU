from langchain.vectorstores import Chroma
from langchain.embeddings import HuggingFaceEmbeddings
from langchain_community.chat_models import ChatOpenAI
import openai
import os
from dotenv import load_dotenv

load_dotenv()

# Get the OpenAI API key from the environment variable
openai.api_key = os.getenv("OPENAI_API_KEY")

# Paths and model configurations
CHROMA_PATH = "chroma"
MODEL_NAME = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
GPT_MODEL = "gpt-4o-mini"

# Initialize the components
def load_vector_store():
    emb_model = HuggingFaceEmbeddings(model_name=MODEL_NAME)
    return Chroma(persist_directory=CHROMA_PATH, embedding_function=emb_model)

def query_vector_store(db, query_text):
    results = db.similarity_search_with_relevance_scores(query_text, k=3)
    if len(results) == 0 or results[0][1] < 0.3:
        print("सम्बन्धित परिणाम भेटिएन।")
        return ""
    return "\n\n---\n\n".join([doc.page_content for doc, _score in results])

def format_prompt(conversation_history, user_question, context_text, max_history=5):
    prompt_template = """
    तपाईं जुनु हुनुहुन्छ, सरकारी कार्यालयका प्रक्रियाहरू बुझ्न र कार्यहरू पूरा गर्न सहयोग पुर्‍याउन नेपाली नागरिकलाई सहयोग गर्ने ज्ञानयुक्त सहायक। प्रयोगकर्ताको प्रश्न र अघिल्लो कुराकानी इतिहासबाट सम्बन्धित विवरणहरू प्रयोग गरी सटीक, संक्षिप्त, र सहायक उत्तर दिनुहोस्। स्पष्टताका लागि अघिल्लो कुराकानीलाई स्पष्ट रूपमा उल्लेख गर्न आवश्यक नभएसम्म उल्लेख नगर्नुहोस्। डेटाबेसमा भएका तथ्यहरूका आधारमा मात्र उत्तर दिनुहोस्।

    ---

    **कुराकानीको इतिहास:**
    {conversation_history}

    **हालको प्रयोगकर्ताको प्रश्न:** 
    {user_question}

    **प्राप्त दस्तावेज डेटा:**
    {context}

    ---

    """
    # Trim the conversation history to the last `max_history` entries
    trimmed_history = conversation_history[-max_history:]
    formatted_history = "\n".join([f"प्रयोगकर्ता: {entry['user']}\nसहायक: {entry['assistant']}" for entry in trimmed_history])
    return prompt_template.format(
        conversation_history=formatted_history,
        user_question=user_question,
        context=context_text
    )

# Initialize the model and vector store
model = ChatOpenAI(model=GPT_MODEL)
db = load_vector_store()

# Test cases for the RAG pipeline in Nepali
test_cases = [
    {
        "user_question": "नागरिकता प्रमाणपत्र नवीकरण गर्न के के चाहिन्छ?",
        "expected_response": "नागरिकता प्रमाणपत्र नवीकरण गर्नका लागि आवश्यक कागजातहरू र प्रक्रिया..."
    },
    {
        "user_question": "जग्गा नामसारी गर्न कस्ता कागजातहरू चाहिन्छ?",
        "expected_response": "जग्गा नामसारी गर्न आवश्यक कागजातहरूमा..."
    },
    {
        "user_question": "चलानीका लागि अनलाइन आवेदन दिन मिल्छ?",
        "expected_response": "हो, चलानीका लागि अनलाइन आवेदन दिन मिल्छ। प्रक्रिया यस्तो छ..."
    }
]

# Run tests
def test_rag_pipeline():
    for idx, test_case in enumerate(test_cases, 1):
        print(f"परीक्षण {idx}: {test_case['user_question']}")
        user_question = test_case["user_question"]
        
        # Query the vector store for context
        context_text = query_vector_store(db, user_question)
        if not context_text:
            context_text = "सम्बन्धित डेटा उपलब्ध छैन।"
        
        # Format the prompt and generate response
        conversation_history = []  # Clear history for independent tests
        prompt = format_prompt(conversation_history, user_question, context_text)
        response = model.invoke(prompt).content
        
        # Print results
        print(f"सहायकको उत्तर: {response}")
        print(f"अपेक्षित उत्तर: {test_case['expected_response']}")
        print("-" * 50)

if __name__ == "__main__":
    test_rag_pipeline()
