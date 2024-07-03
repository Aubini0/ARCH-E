import ast

from openai import OpenAI

from base_template import BasePromptTemplate
from langchain.prompts import PromptTemplate
from typing import Optional, List


class QueryExpansionPromptTemplate(BasePromptTemplate):
    question: str
    num_queries: Optional[int] = 5  # Default to 5 queries if not specified

    prompt_template: str = """Given the following question: "{question}", please generate {num_queries} paraphrased 
    queries that are similar in meaning. Each query should maintain the original intent but use different wording or 
    phrasing. Provide the results as a Python list of strings. For example:

    Input: "What are the best ways to learn Python programming?"

    Output: ["How can I effectively learn Python?", "What are the top methods to learn Python programming?", 
    "What strategies can help in learning Python?", "How to learn Python in the most efficient way?", "What are the 
    best practices for mastering Python programming?"]

    Your input question: "{question}"

    Please provide your output in the format of a Python list of strings.
    """

    def create_template(self) -> PromptTemplate:
        formatted_prompt = self.prompt_template.format(question=self.question, num_queries=self.num_queries)
        return PromptTemplate(template=formatted_prompt, input_variables=["question"], verbose=True)


class QueryExpansion:
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)

    def expand_queries(self, question: str, num_queries: int) -> List[str]:
        template_instance = QueryExpansionPromptTemplate(question=question, num_queries=num_queries)
        prompt_template = template_instance.create_template()
        expanded_queries = prompt_template.format(question=question)

        response = self.client.chat.completions.create(
            model='gpt-3.5-turbo',
            messages=[{'role': 'user', 'content': expanded_queries}],
            max_tokens=256,
            temperature=0.2,
        )

        generation = response.choices[0].message.content
        list_string = generation.split('Output: ')[1]
        output_list = ast.literal_eval(list_string)
        return output_list


