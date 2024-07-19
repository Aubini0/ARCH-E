from __future__ import annotations
from enum import Enum
import time
from bs4 import BeautifulSoup
from openai import AsyncOpenAI , OpenAI
from lib_database.db_connect import embeddings_collection
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import MongoDBAtlasVectorSearch
from langchain.document_loaders import DirectoryLoader
from langchain.chains import RetrievalQA
from langchain.llms import OpenAI as langchainOpenAI
from lib_websearch.rag_template import RAGTemplate

# from langchain_openai import ChatOpenAI 
# from langchain_core.chat_history import BaseChatMessageHistory
# from langchain_community.chat_message_histories import ChatMessageHistory
# from langchain_core.messages import HumanMessage, SystemMessage
# from langchain_core.runnables.history import RunnableWithMessageHistory






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

    def __init__(self, guid , prompt_generator , web_search_instance , api_key , model="4o", custom_functions=None):
        self.api_key = api_key
        self.guid = guid
        self.model = LLM.models[model]
        self.client = AsyncOpenAI( api_key=self.api_key )
        self.client_sync = OpenAI( api_key=self.api_key )
        self.langchain_llm = langchainOpenAI(openai_api_key=self.api_key, temperature=0)
        self.embeddings = OpenAIEmbeddings(openai_api_key=self.api_key)
        self.vectorStore = MongoDBAtlasVectorSearch( embeddings_collection, self.embeddings )
        self.prompt_generator = prompt_generator
        self.web_search_instance = web_search_instance
        self.custom_functions = custom_functions or []
        self.web_links = ""

        self.reset()
        print(f"GPT_Model :> {self.model}")



        # Lnagchain_Configurations
        # self.store = {}
        # self.config = {"configurable": {"session_id": self.guid}}
        # self.langchain_client = ChatOpenAI(model=self.model ,api_key=self.api_key)
        # self.embeddings = OpenAIEmbeddings(api_key=self.api_key)
        # self.reset_lagchain()

    def vector_query(self, query ):
        as_output = None
        retriever = self.vectorStore.as_retriever()
        docs = self.vectorStore.similarity_search(query, K=1)
        if len(docs) > 0 :
            as_output = docs[0].page_content


        qa = RetrievalQA.from_chain_type(self.langchain_llm, chain_type="stuff", retriever=retriever)
        # Execute the chain
        retriever_output = qa.run(query)

        print( ">>>" , as_output, ">>>" , retriever_output )
        return retriever_output

    def vector_search(self, query ): 
        as_output = None
        docs = self.vectorStore.similarity_search(
            query, K=1,
            pre_filter={ "user_id": { "$eq": self.guid } }
            )
        if len(docs) > 0 :
            as_output = docs[0].page_content
        return as_output

    def create_embedding_strings(self , qa_pairs):
        embedding_strings = []
        messages_array = self.messages

        
        # Extract the system message
        # system_message = ""
        # for msg in messages_array:
        #     if msg['role'] == 'system':
        #         system_message = msg['content'].strip()
        #         break

        # # Add the system message as the first embedding string
        # if system_message:
        #     embedding_strings.append(system_message)

        # Collect the user-assistant conversation pairs
        conversation_pairs = []
        temp_pair = []

        for msg in messages_array:
            if msg['role'] != 'system':
                temp_pair.append(f"{msg['role']}: {msg['content'].strip()}")
                if len(temp_pair) == 2:  # One user and one assistant message makes a pair
                    conversation_pairs.append(" ".join(temp_pair))
                    temp_pair = []

        # Combine pairs into strings of 2-3 pairs each
        combined_pairs = []
        temp_combined = []

        for i, pair in enumerate(conversation_pairs):
            temp_combined.append(pair)
            if len(temp_combined) == qa_pairs or i == len(conversation_pairs) - 1:  # Max 3 pairs or end of list
                combined_pairs.append(" ".join(temp_combined))
                temp_combined = []

        # Add combined pairs to embedding strings
        embedding_strings.extend(combined_pairs)

        return embedding_strings

    def add_embeddings(self) : 
        data = self.create_embedding_strings(3)
        metadatas = [ ]
        for _ in range(0 , len(data)) : 
            metadatas.append({"user_id": self.guid})

        print(data , len(data) , len(metadatas))
        self.vectorStore = self.vectorStore.from_texts( 
            data , self.embeddings , metadatas=metadatas ,  collection=embeddings_collection 
        )



        print("VECTOR_STORE :> " , self.vectorStore)
        
    def reset(self):
        self.messages = []
        self.add_message(
            message=LLM.LLMMessage(LLM.Role.SYSTEM, str(self.prompt_generator))
        )
        self.recomendation_messages = self.messages

    def add_message(self, message: LLMMessage) -> None:
        self.messages.append(
            {"role": message.role.value, "content": message.content}
        )

    def pop_additional_info(self) -> None : 
        self.messages[-1]['content'] = self.messages[-1]['content'].split("Question:")[-1]

    def parse_recomendations(self , html_string) : 
        soup = BeautifulSoup(html_string, 'html.parser')
        li_elements = soup.find_all('li')
        questions_list = [li.get_text() for li in li_elements]
        return questions_list
        
    async def interaction(self, message: LLM.LLMMessage) -> str:
        similarity_resp = self.vector_search( message.content )
        # getting web search and web links
        web_results , self.web_links = self.web_search_instance.run( message.content )
        web_results = ". ".join(web_results)

        print( "... Web_Search_Retrieved ..." )

        if similarity_resp : 
            rag_template = RAGTemplate(
                question=message.content,
                passages=web_results,
                previous_chat=similarity_resp
            )
            message.content = rag_template.create_template()
        else : 
            rag_template = RAGTemplate(
                question=message.content,
                passages=web_results
            )
            message.content = rag_template.create_template()            


        # append message to current chat list
        if message.content != "": self.add_message(message)
        
        print("Message:> " , message)
        words = []

        stream = await self.client.chat.completions.create(
            model=self.model,
            messages=self.messages,
            stream=True,
            temperature=0.1
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


        # strip out extra info from message prompt to store original message and its embeddings
        self.pop_additional_info()

        message = LLM.LLMMessage(
            role=LLM.Role.ASSISTANT,
            content="".join(words).strip().replace("\n", " "),
        )
        self.add_message(message)

    def recomendations(self, message: LLM.LLMMessage) -> str:

        messages_array = [ 
            self.recomendation_messages[0] , 
            {"role": message.role.value, "content": message.content},
            { "role" : message.role.value , "content" : "Generate 5 reference questions that the user can ask based on what we are talking about? Only give your answer in html format" }
            ]
        responce = self.client_sync.chat.completions.create(
            model=self.model,
            messages=messages_array,
            stream=False,
            temperature=0.2
        )

        responce = responce.choices[0].message.content
        responce = self.parse_recomendations(responce)
        return responce
























    # def reset_lagchain(self) : 
    #     self.with_message_history = RunnableWithMessageHistory(self.langchain_client, self.get_session_history)

    # def get_answer(self, config, user_input: str, session):
    #     response = session.invoke(
    #         [   SystemMessage(str(self.prompt_generator)),
    #             HumanMessage(content=user_input),
    #         ],
    #         config=config,
    #     )
    #     recommendation = self.get_recommendations(session, config)
    #     recommendation = self.parse_recomendations(recommendation)
    #     return {"response": response.content, "recommendations": recommendation}


    # def get_recommendations(self , session, config):
    #     response = session.invoke(
    #         [SystemMessage(str(self.prompt_generator)), HumanMessage(content="Generate 5 reference questions that the user can ask based on what we are talking about? Only give your answer in html format")],
    #         config=config,
    #     )
    #     return response.content

    # def get_session_history(self , session_id: str) -> BaseChatMessageHistory:
    #     if session_id not in self.store:
    #         self.store[session_id] = ChatMessageHistory()
    #     return self.store[session_id]

    # async def interaction_langchain(self , message: LLM.LLMMessage) : 
    #     user_query = message.content
    #     llm_resp = self.get_answer(self.config, user_query, self.with_message_history)
    #     yield llm_resp

    # def interaction_langchain_synchronous(self , message: LLM.LLMMessage) : 
    #     user_query = message.content
    #     llm_resp = self.get_answer(self.config, user_query, self.with_message_history)
    #     return llm_resp
    