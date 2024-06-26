from __future__ import annotations
from enum import Enum
from openai import AsyncOpenAI 



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

    def __init__(self, prompt_generator, api_key , model="4o", custom_functions=None):
        self.api_key = api_key
        self.client = AsyncOpenAI( api_key=self.api_key )
        self.prompt_generator = prompt_generator
        self.model = LLM.models[model]
        self.custom_functions = custom_functions or []
        self.reset()
        print(f"GPT_Model :> {self.model}")
        # print(f"Prompt : > {self.prompt_generator}")


    def reset(self):
        self.messages = []
        self.add_message(
            message=LLM.LLMMessage(LLM.Role.SYSTEM, str(self.prompt_generator))
        )

    def add_message(self, message: LLMMessage) -> None:
        self.messages.append(
            {"role": message.role.value, "content": message.content}
        )

    # Simple GPT
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