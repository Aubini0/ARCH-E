from langchain.prompts import PromptTemplate
from base_template import BasePromptTemplate


class RAGTemplate(BasePromptTemplate):
    question: str
    passages: str
    prompt_template: str = """Given the following question: "{question}", and considering the retrieved passages below,
please provide a comprehensive response that addresses the question .

Passages:
{passages}

Your input question: "{question}"

Please provide your response based on the context and the retrieved passages.
"""

    def create_template(self) -> PromptTemplate:
        formatted_prompt = self.prompt_template.format(question=self.question, passages=self.passages)
        return PromptTemplate(template=formatted_prompt, input_variables=["question", "passages"], verbose=True)