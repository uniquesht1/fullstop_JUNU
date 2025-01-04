from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.chat_models import ChatOpenAI

from server.constants import CHROMA_PATH, EMBEDDING_MODEL_NAME, GPT_MODEL

def load_vector_store(embedding_model:str, persist_directory):
    """
    Returns an instance of Chrome DB with the given embedding model and persist directory.
    """

    emb_model = HuggingFaceEmbeddings(model_name=embedding_model)
    return Chroma(persist_directory, emb_model)

def query_vector_store(vector_store, user_input):
    """
    Takes the vector store and promt as input
    Returns the related document to promt in stored in vector store
    """

    results = vector_store.similarity_search_with_relevance_scores(user_input, k=3)
    if len(results) == 0 or results[0][1] < 0.3:
        return "सम्बन्धित परिणाम भेटिएन।"
    return "\n---\n".join([doc.page_content for doc, _score in results])


def format_chat_prompt(conversation_history, user_question, context_text, max_history=5):

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

    trimmed_history = conversation_history[-max_history:]
    formatted_history = "\n".join([
        f"{'प्रयोगकर्ता' if entry['sender'] == 'user' else 'सहायक'}: {entry['text']}"
        for entry in trimmed_history
    ])
    
    
    return prompt_template.format(
        conversation_history=formatted_history,
        user_question=user_question,
        context=context_text
    )

def format_voice_prompt(conversation_history, user_question, context_text, max_history=5):
    prompt_template = """
    तपाईं एउटा ज्ञानयुक्त सहायक हुनुहुन्छ जसले नेपाली भाषामा स्वाभाविक, स्पष्ट र प्रासङ्गिक उत्तरहरू प्रदान गर्नुहुन्छ। 
    आवाज कुराकानीका लागि तपाईंको उत्तरहरू स्वाभाविक र वार्तालाप शैलीमा हुनुपर्छ। चरणहरूको सट्टा, 
    तपाईं जानकारीलाई सहज प्रवाहको साथ साझा गर्नुहुन्छ, ताकि प्रयोगकर्ताले सहजै बुझ्न सकून्। 

    --- 

    **कुराकानीको इतिहास:** 
    {conversation_history}

    **हालको प्रयोगकर्ताको प्रश्न:** 
    {user_question}

    **प्राप्त दस्तावेज डेटा:** 
    {context}

    ---
    """

    # Trim history to the most recent exchanges
    trimmed_history = conversation_history[-max_history:]

    # Format the conversation history in a natural dialogue flow
    formatted_history = "\n".join([
        f"{'प्रयोगकर्ता' if entry['sender'] == 'user' else 'सहायक'}: {entry['text']}"
        for entry in trimmed_history
    ])
    
    return prompt_template.format(
        conversation_history=formatted_history,
        user_question=user_question,
        context=context_text
    )

db = load_vector_store(persist_directory=CHROMA_PATH, embedding_model=EMBEDDING_MODEL_NAME)

def getResponseFromModel(user_input, conversation_history, mode):    

    context_text = query_vector_store(db, user_input)

    if not context_text:
        context_text = "सम्बन्धित डेटा उपलब्ध छैन।"

    if mode == "text":
        prompt = format_chat_prompt(conversation_history, user_input, context_text)
    elif mode == "voice":
        prompt = format_voice_prompt(conversation_history, user_input, context_text)
    else:
        print(mode)
        raise ValueError("Invalid mode. Choose 'text' or 'voice'.")

    response = ChatOpenAI(model=GPT_MODEL).invoke(prompt).content
    conversation_history.append({"user": user_input, "assistant": response})
    return response

