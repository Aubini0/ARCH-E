from __future__ import annotations
import re
from lib_llm.helpers.llm import LLM
from lib_infrastructure.dispatcher import ( Dispatcher, MessageType , Message , MessageHeader )



class LargeLanguageModel:
    def __init__(self, guid , llm: LLM  ,  dispatcher: Dispatcher):
        self.guid = guid
        self.llm = llm
        self.dispatcher = dispatcher


    async def process(self, message : LLM.LLMMessage)  : 

        llm_words = []
        async for words in self.llm.interaction(message=message):
            words = words.lower()
            llm_words.append(words)
            
            try:
                if re.match(
                    r"(\D?[\?\!;\.])", llm_words[-1][-2:]
                ) and not re.match(r"\d", llm_words[-2][-1] ):
                    words = "".join(llm_words)
                    llm_words = []
                    # print("In TRY :> " , words)
                    await self.dispatcher.broadcast(
                        self.guid,
                        Message(
                            MessageHeader(
                                MessageType.LLM_GENERATED_TEXT
                            ),
                            data=words,
                        ),
                    )
            except Exception as error : 
                if re.match(
                    r"(\D?[\?\!;\.])", llm_words[-1][-2:]
                ) and not re.match(r"\d", llm_words[-1][-2]):
                    words = "".join(llm_words)
                    llm_words = []
                    # print("In EXCEPT :> " , words)
                    await self.dispatcher.broadcast(
                        self.guid,
                        Message(
                            MessageHeader(
                                MessageType.LLM_GENERATED_TEXT
                            ),
                            data=words,
                        ),
                    )                                
        if len(llm_words):
            words = "".join(llm_words)
            # print("In IF :> " , words)
            await self.dispatcher.broadcast(
                self.guid,
                Message(
                    MessageHeader(MessageType.LLM_GENERATED_TEXT),
                    data=words,
                ),
            )


    async def process_langchain(self, message : LLM.LLMMessage)  : 

        llm_words = []
        async for words in self.llm.interaction_langchain(message=message):
            tts_responce = words['response'].lower()
            # print("TTS_RESPONCE :> " , tts_responce)
            # send it to tts
            await self.dispatcher.broadcast(
                self.guid,
                Message(
                    MessageHeader(
                        MessageType.LLM_GENERATED_TEXT
                    ),
                    data=tts_responce,
                ),
            )

            # send full resp with recomendations to UI
            await self.dispatcher.broadcast(
                self.guid,
                Message(
                    MessageHeader(
                        MessageType.LLM_GENERATED_FULL_TEXT
                    ),
                    data=words,
                ),
            )




    async def run_async(self):
        async with await self.dispatcher.subscribe(
            self.guid, MessageType.CALL_ENDED 
        ) as call_ended_subscriber, await self.dispatcher.subscribe(
            self.guid, MessageType.FINAL_TRANSCRIPTION_CREATED
        ) as transcription_created_subscriber :
            
            async for event in transcription_created_subscriber:
                # await self.process(message=event.message.data)
                await self.process_langchain(message=event.message.data)

                call_ended_message = await self.dispatcher.get_nowait(
                    call_ended_subscriber
                )
                if call_ended_message is not None:
                    break  



