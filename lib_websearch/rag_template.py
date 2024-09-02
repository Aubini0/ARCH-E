from langchain.prompts import PromptTemplate
from lib_websearch.base_template import BasePromptTemplate
from typing import Optional

class RAGTemplate(BasePromptTemplate):
    question: str
    passages: Optional[list] = None
    previous_chat: Optional[str] = None


    prompt_template_with_question: str = """Given the following question: "{question}", please provide an informative, clear, and concise response that addresses the question being asked."""



    full_prompt_template: str = """Given the following question: "{question}", determine the context in which to generate the response. Use the retrieved passages and user previous chat history to decide whether citations are needed.
        Context:
        - Passages: {passages}
        - User Previous Chat: {previous_chat}
        Instructions:
        1. Determine Context:
        - Check if the user previous chat history provides sufficient context for the response.
        - If there is no relevant context in the user chat history, use the Passages and apply citations.
        2. Generate Response:
        - From User Chat History: Construct a response using information from the previous chat. Do not include citations.
        - From Passages: Construct a response using the retrieved passages. Include citations in the format (Source [number]) for each piece of information.
        Example Usage:
        - If the user chat history contains relevant information, the response might be: "Based on our previous discussion, Miami is well-known for its vibrant culture and scenic beaches."
        - If relying on Passages, the response might be: "Miami is famous for its beaches and nightlife (Source 1)."
        This approach ensures that citations are only applied when the response is generated from web search results, maintaining clarity and credibility.
    """




    prompt_template_without_chat: str = """Given the following question: "{question}", determine the context in which to generate the response. Use the retrieved passages to decide whether citations are needed.
        Context:
        - Passages: {passages}
        Instructions:
        1. Determine Context:
        - Use the web search results and apply citations.
        2. Generate Response:
        - From Web Search: Construct a response using the retrieved passages. Include citations in the format (Source [number]) for each piece of information.
        Example Usage:
        - If relying on web search results, the response might be: "Miami is famous for its beaches and nightlife (Source 1)."
    """





    prompt_template_without_passages: str = """Given the following question: "{question}", and considering the user previous chat history below please provide an informative, clear, and concise response that addresses the question being asked.
        Context:
        - User Previous Chat: {previous_chat}    
        Instructions:
        - Provide your response based on the context and the retrieved passages.
        - Subtly acknowledge the continuity of the conversation without explicitly mentioning the use of previous chat.
    """





    def create_template(self) -> str:
        if self.previous_chat and self.passages:
            formatted_prompt = self.full_prompt_template.format(question=self.question, passages=self.passages, previous_chat=self.previous_chat)
        elif self.passages:
            formatted_prompt = self.prompt_template_without_chat.format(question=self.question, passages=self.passages)
        elif self.previous_chat:
            formatted_prompt = self.prompt_template_without_passages.format(question=self.question, previous_chat=self.previous_chat)
        else : 
            formatted_prompt = self.prompt_template_with_question.format(question=self.question, previous_chat=self.previous_chat)

        return formatted_prompt.strip()
    





#     full_prompt_template: str = """Given the following question: "{question}", and considering the retrieved passages & User previous chat history below,
# please provide a comprehensive response that addresses the question.
# Passages:
# {passages}
# User Previous chat:
# {previous_chat}
# Please provide your response based on the context and the retrieved passages.
# DONOT MENTION that you are checking previous_chat or passages
# Your input Question: {question}
# """

#     prompt_template_without_chat: str = """Given the following question: "{question}", and considering the retrieved passages below, please provide a comprehensive response that addresses the question.
# Passages:
# {passages}
# Please provide your response making use of retrieved passages.
# DONOT MENTION that you are checking previous_chat or passages
# Your input Question: {question}
# """

#     prompt_template_without_passages: str = """Given the following question: "{question}", and considering the User previous chat history below,
# please provide a comprehensive response that addresses the question.
# User Previous chat:
# {previous_chat}
# Please provide your response based making use of previous chat context.
# DONOT MENTION that you are checking previous_chat or passages
# Your input Question: {question}
# """

#     prompt_template_with_question: str = """Given the following question: "{question}", please provide a consize & conversational response that addresses the question.
# Your input Question: {question}
# """

