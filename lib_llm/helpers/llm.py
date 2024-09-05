from __future__ import annotations
import re
from enum import Enum
from bson import ObjectId
from pymongo import UpdateOne
from datetime import datetime
from bs4 import BeautifulSoup
from openai import AsyncOpenAI , OpenAI
from lib_websearch.rag_template import RAGTemplate
from langchain.llms import OpenAI as langchainOpenAI
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import MongoDBAtlasVectorSearch
from lib_database.db_connect import ( embeddings_collection , chats_collection , users_collection )





class LLM:
    # GPT Models
    models = {
        "4o" : "gpt-4o",
        "4": "gpt-4-turbo", 
        "35": "gpt-3.5-turbo", 
        "37" : "gpt-3.5-turbo-16k",
        "4+": "gpt-4-1106-preview",
        "36" : "gpt-3.5-turbo-1106",
        "4++" : "gpt-4-0125-preview",
        "35++" : "gpt-3.5-turbo-0125",
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

    def __init__( 
        self, guid , session_id , qa_pairs : int , prompt_generator , 
        web_search_instance , api_key , message_id_prefix : str , 
        model="4o", custom_functions=None, 
        current_message_index : int = 0 , starting_message_index : int = 0
            ):


        self.guid = guid
        self.web_links = ""
        self.api_key = api_key
        self.qa_pairs = qa_pairs
        self.session_id = session_id
        self.model = LLM.models[model]
        self.user_message_appened = False
        self.prompt_generator = prompt_generator
        self.message_id_prefix = message_id_prefix
        self.custom_functions = custom_functions or []
        self.web_search_instance = web_search_instance
        self.client = AsyncOpenAI( api_key=self.api_key )
        self.client_sync = OpenAI( api_key=self.api_key )
        # used for updating for each successive message in websocket
        self.current_message_index = current_message_index
        # used for referencing in saving chats for a starting point in loop
        self.starting_message_index = starting_message_index
        self.langchain_llm = langchainOpenAI(openai_api_key=self.api_key, temperature=0)
        self.embeddings = OpenAIEmbeddings(openai_api_key=self.api_key)
        self.vectorStore = MongoDBAtlasVectorSearch( embeddings_collection, self.embeddings )

        self.reset()
        print(f"Model :> {self.model}")


    def vector_search(self, query , no_of_results=3 ): 
        as_output = None
        docs = self.vectorStore.similarity_search(
            query, K=no_of_results,
            pre_filter={ "user_id": { "$eq": self.guid } }
            )
        if len(docs) > 0 :
            as_output = ""
            for doc in docs : 
                as_output += doc.page_content
        return as_output

    def create_embedding_strings(self):
        # Combine pairs into strings of 2-3 pairs each
        combined_pairs , temp_combined , total_chat = [] , [] , []
        # Collect the user-assistant conversation pairs
        conversation_pairs  , temp_pair , chat_pairs  , embedding_strings = [] , [] , [] , []

        messages_array = self.messages
        for msg in messages_array:
            if msg['role'] != 'system':                
                temp_pair.append(f"{msg['role']}: {msg['content'].strip()}")
                chat_pairs.append({  "role" : msg['role'] ,  "message" : msg['content'].strip() })


                # One user and one assistant message makes a pair
                if len(temp_pair) == 2: 
                    conversation_pairs.append(" ".join(temp_pair))
                    temp_pair = []

                # One user and one assistant message makes a pair
                if len(chat_pairs) == 2 : 
                    message_id = f"{self.message_id_prefix}{self.starting_message_index}"

                    total_chat.append({ obj['role'] : obj['message'] for obj in chat_pairs })
                    total_chat[-1]['user_id'] = self.guid

                    metadata = self.all_messages.get( message_id.strip() )
                    if metadata : 
                        if metadata.get("user_msg" , None) :  del metadata["user_msg"]
                        if metadata.get("existing_msg" , None) : del metadata["existing_msg"]
                        total_chat[-1]['metadata'] = metadata

                    total_chat[-1]['session_id'] = self.session_id
                    total_chat[-1]['created_at'] = datetime.now()

                    chat_pairs = []
                    self.starting_message_index += 1

        for i, pair in enumerate(conversation_pairs):
            temp_combined.append(pair)
            # Max 3 pairs or end of list
            if len(temp_combined) == self.qa_pairs or i == len(conversation_pairs) - 1:  
                combined_pairs.append(" ".join(temp_combined))
                temp_combined = []

        embedding_strings.extend(combined_pairs)
        return embedding_strings , total_chat

    def save_previous_queries_feedback(self) : 
        operations = [ ]
        for value in self.all_messages.values() : 
            msg_id = value.get("msg_id" , None)
            rating_value = value.get("rating" , None)
            feedback_value = value.get("feedback" , None)
            existing_msg = value.get("existing_msg" , False)
            if existing_msg and msg_id and ( rating_value or feedback_value ) :
                update_fields = {}
                if rating_value is not None: update_fields["metadata.rating"] = rating_value   
                if feedback_value is not None: update_fields["metadata.feedback"] = feedback_value
                operations.append(
                    UpdateOne(
                        {"_id": ObjectId(msg_id) }, 
                        {"$set": update_fields}  # Set new values in metadata
                    )
                )
        if len(operations) > 0 : 
            chats_collection.bulk_write(operations)
            print("Previous Queries Feedback updated")

    def save_conversation(self) : 
        try : user = users_collection.find_one({ "_id" : ObjectId(self.guid) } )
        except : user = None

        if user : 
            embeddingsData , totalChat = self.create_embedding_strings(  )
            metadatas = [ ]
            for _ in range(0 , len(embeddingsData)) : 
                metadatas.append({"user_id": self.guid , "session_id" : self.session_id})
            
            if len(embeddingsData) > 0 : 
                self.vectorStore = self.vectorStore.from_texts( 
                    embeddingsData , self.embeddings , 
                    metadatas=metadatas ,  collection=embeddings_collection 
                )
            if len(totalChat) > 0 :        
                # inserting chats to chat collection
                chats_collection.insert_many( totalChat )
                
            # updating previous messages feedback if any
            self.save_previous_queries_feedback()            

            print(" ... Embddings + Chats + FeedBack Added ... ")
        else : 
            print(" ... Chat Session Ended ... ")
        
    def reset(self):
        self.messages = []
        self.all_messages = {}

        self.add_message(
            message=LLM.LLMMessage(LLM.Role.SYSTEM, self.prompt_generator.get_main_llm_prompt())
        )

        self.recomendation_messages = self.messages

    def add_message(self, message: LLMMessage) -> None:
        self.messages.append(
            {"role": message.role.value, "content": message.content}
        )

    def pop_additional_info(self , original_user_msg) -> None : 
        self.messages[-1]['content'] = original_user_msg

    def parse_recomendations(self , html_string) : 
        soup = BeautifulSoup(html_string, 'html.parser')
        li_elements = soup.find_all('li')
        questions_list = [li.get_text() for li in li_elements]
        return questions_list

    def check_web_required(self , query) -> bool : 
        messages_array = [ 
            {
                "role": LLM.Role.SYSTEM.value, 
                "content": """Given following message, analyze if it requires some web search to get updated data or not. ALWAYS RETURN BOOLEAN"""
             },
            { 
                "role" : LLM.Role.USER.value , "content" : query 
            }
            ]
        
        responce = self.client_sync.chat.completions.create(
            model=self.model,
            messages=messages_array,
            stream=False,
            temperature=0.2
        )

        responce = responce.choices[0].message.content
        if responce.lower() in [ "true" , "yes" ]:
            return True
        elif responce.lower() in [ "false" , "no"]:
            return False
        else:
            return False

    def recomendations(self, message: LLM.LLMMessage) -> str:
        reccomended_messages_array = [ 
            self.recomendation_messages[0] , 
            { 
                "role" : message.role.value , 
                "content" : self.prompt_generator.get_recommendation_llm_prompt( message.content ) 
            }
        ]

        responce = self.client_sync.chat.completions.create(
            model=self.model, messages=reccomended_messages_array,
            stream=False, temperature=0.2
        )

        responce = responce.choices[0].message.content
        responce = self.parse_recomendations(responce)
        return responce


    def remove_source_references(self , text):
        text = re.sub(r'\(Source\s*\[\s*\d+\s*\]\)', '', text)
        text = re.sub(r'\(Source\s*\d+\)', '', text)
        return text.strip()


    async def interaction(self, message: LLM.LLMMessage) -> str:
        original_user_msg = message.content
        self.check_web , web_results , self.user_message_appened = False ,  None , False


        similarity_resp = self.vector_search( message.content  )
        self.check_web = self.check_web_required( message.content )

        print(f"Check_Web :> {self.check_web}")

        if self.check_web : 
            resp = await self.web_search_instance.run( message.content )
            if resp['status'] :  web_results , self.web_links = resp['compressed_docs'] , resp['links']
            print( "... Web_Search_Retrieved ..." )
        else : self.web_links = ""


        rag_template = RAGTemplate(
            question=message.content, passages=web_results,
            previous_chat=similarity_resp
        )
        message.content = rag_template.create_template()



        # append message to current chat list
        if message.content != "": self.add_message(message)
        self.user_message_appened = True
        print("Message:> " , message)

        words = []

        stream = await self.client.chat.completions.create(
            model=self.model, messages=self.messages,
            stream=True, temperature=0.1
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
            yield { "type": "function_call", "name": function_name, "args": function_args }


        # strip out extra info from message prompt to store original message and its embeddings
        self.pop_additional_info( original_user_msg )
        self.user_message_appened = False

        # strip out source[number] from assistant content
        assistant_content = self.remove_source_references( "".join(words).strip(), )
        message = LLM.LLMMessage(
            role=LLM.Role.ASSISTANT,
            content=assistant_content
        )
        self.add_message(message)

