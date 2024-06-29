from __future__ import annotations
from enum import Enum
from bs4 import BeautifulSoup
from openai import AsyncOpenAI 
from langchain_openai import ChatOpenAI
from langchain_openai import OpenAIEmbeddings
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.runnables.history import RunnableWithMessageHistory




class LLM:
    # GPT Models
    models = {
        "4": "gpt-4-turbo", 
        "35": "gpt-3.5-turbo", 
        "4+": "gpt-4-1106-preview",
        "36" : "gpt-3.5-turbo-1106",
        "37" : "gpt-3.5-turbo-16k",
        "4++" : "gpt-4-0125-preview",
        "35++" : "gpt-3.5-turbo-0125",
        "4o" : "gpt-4o"
    }

    class Role(Enum):
        USER = "user"
        ASSISTANT = "assistant"
        SYSTEM = "system"

    class LLMMessage:
        def __init__(self, role: LLM.Role, content: str) -> None:
            self.role = role
            self.content = content

        def __str__(self) -> str:
            return f"{self.role.value}: {self.content}"

    def __init__(self, guid , prompt_generator, api_key , model="4o", custom_functions=None):
        self.api_key = api_key
        self.guid = guid
        self.client = AsyncOpenAI( api_key=self.api_key )
        self.prompt_generator = prompt_generator
        self.model = LLM.models[model]
        self.custom_functions = custom_functions or []


        #self.store = {}
        self.history = {"session_id": self.guid, "bot": [], "user": []}
        #self.langchain_client = ChatOpenAI(model=self.model ,api_key=self.api_key)
        #self.embeddings = OpenAIEmbeddings(api_key=self.api_key)


        # self.reset()
        self.reset_lagchain()
        print(f"GPT_Model :> {self.model}")


    def reset(self):
        self.messages = []
        self.add_message(
            message=LLM.LLMMessage(LLM.Role.SYSTEM, str(self.prompt_generator))
        )

    def reset_lagchain(self) : 
        self.with_message_history = RunnableWithMessageHistory(self.langchain_client, self.get_session_history)

    def add_message(self, message: LLMMessage) -> None:
        self.messages.append(
            {"role": message.role.value, "content": message.content}
        )

    async def interaction(self, message: LLM.LLMMessage) -> str:
        if message.content != "":
            self.add_message(message)

        words = []

        stream = await self.client.chat.completions.create(
            model=self.model,
            messages=self.messages,
            stream=True,
            # functions=self.custom_functions,
            # function_call="auto",
            temperature=0.2
        )

        function_name = None
        function_args = ""

        async for part in stream:
            if part.choices[0].delta.content:
                words.append(part.choices[0].delta.content or "")
                yield words[-1]
            elif part.choices[0].delta.function_call:
                if part.choices[0].delta.function_call.name:
                    function_name = part.choices[0].delta.function_call.name
                if part.choices[0].delta.function_call.arguments:
                    function_args += part.choices[
                        0
                    ].delta.function_call.arguments

        if function_name:
            yield {
                "type": "function_call",
                "name": function_name,
                "args": function_args,
            }

        message = LLM.LLMMessage(
            role=LLM.Role.ASSISTANT,
            content="".join(words).strip().replace("\n", " "),
        )
        self.add_message(message)

    async def ask_model(self, content: str):
        chat_completion = await self.client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": content,
                }
            ],
            model=self.models['4o'],
        )
        return chat_completion

    async def get_answer(self, query):
        content = self.content_generator(query)
        chat_completion = await self.ask_model(content)
        answer = chat_completion.choices[0].message.content
        self.history['user'].append(query)
        self.history['bot'].append(answer)
        recommendations = await self.ask_model(self.recommendation_content())
        return {"response": answer, "recommendations": recommendations.choices[0].message.content}

    def parse_recomendations(self , html_string) : 
        soup = BeautifulSoup(html_string, 'html.parser')
        li_elements = soup.find_all('li')
        questions_list = [li.get_text() for li in li_elements]
        return questions_list

    def recommendation_content(self) -> str:
        return f"""
        Generate 5 reference questions that the user can ask based on the recent message is the Chat history below,
        And only give your answer in html format.
        
        Chat History: {self.history}
        """

    def content_generator(self, new_query) -> str:
        content = f"""
        You are a helpful assistant made by Arche. 
        Answer all questions to the best of your ability, and you will the user with what they need. 
        If the user need is not clear you will ask a follow-up questions.
        You can as well provide suggesitons of what they can ask to clarify what they need for you to help me solve their problem. 
        Below is the message history and the user new query.
        Always use the message history but don't make is obvious,  try to be conversational and natural with the user. Best of luck!.

        Message History: {self.history}
        User new query: {new_query}
        """
        return content

    async def interaction_langchain(self , message: LLM.LLMMessage) : 
        user_query = message.content
        llm_resp = self.get_answer(user_query)
        yield llm_resp


    def interaction_langchain_synchronous(self , message: LLM.LLMMessage) : 
        user_query = message.content
        llm_resp = self.get_answer(user_query)
        return llm_resp
    