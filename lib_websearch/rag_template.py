from langchain.prompts import PromptTemplate
from lib_websearch.base_template import BasePromptTemplate
from typing import Optional

class RAGTemplate(BasePromptTemplate):
    question: str
    passages: Optional[str] = None
    previous_chat: Optional[str] = None

    full_prompt_template: str = """Given the following question: "{question}", and considering the retrieved passages & 
User previous chat history below,
please provide a comprehensive response that addresses the question.

Passages:
{passages}
User Previous chat:
{previous_chat}
Please provide your response based on the context and the retrieved passages.
Your input Question: {question}
"""

    prompt_template_without_chat: str = """Given the following question: "{question}", and considering the retrieved passages below,
please provide a comprehensive response that addresses the question.

Passages:
{passages}
Please provide your response making use of retrieved passages.
Your input Question: {question}
"""

    prompt_template_without_passages: str = """Given the following question: "{question}", and considering the retrieved passages & 
User previous chat history below,
please provide a comprehensive response that addresses the question.

User Previous chat:
{previous_chat}
Please provide your response based making use of previous chat context.
Your input Question: {question}
"""

    prompt_template_with_question: str = """Given the following question: "{question}", please provide a consize & conversational response that addresses the question.
Your input Question: {question}
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

        return formatted_prompt
    



    
# class RAGTemplate(BasePromptTemplate):
#     question: str
#     passages: str
#     previous_chat : str
#     prompt_template: str = """Given the following question: "{question}", and considering the retrieved passages & 
# User previous chat history below,
# please provide a comprehensive response that addresses the question .

# Passages:
# {passages}
# User Previous chat :
# {previous_chat}
# Please provide your response based on the context and the retrieved passages.
# Your input Question: {question}
# """

#     def create_template(self) -> PromptTemplate:
#         formatted_prompt = self.prompt_template.format(question=self.question, passages=self.passages , previous_chat=self.previous_chat )
#         return PromptTemplate(template=formatted_prompt, input_variables=["question", "passages" , "previous_chat"], verbose=True)


    