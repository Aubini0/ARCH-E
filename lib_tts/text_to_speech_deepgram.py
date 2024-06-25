import asyncio
import os
from lib_infrastructure.dispatcher import (
    Dispatcher,Message,
    MessageHeader,MessageType,
)
from deepgram import (
    DeepgramClient,
    SpeakOptions
)



class TextToSpeechDeepgram : 
    def __init__(self, guid , output_file_name ,  dispatcher: Dispatcher , api_key) -> None:
        self.guid = guid 
        self.output_file_name = output_file_name
        self.dispatcher = dispatcher
        self.api_key = api_key
        self.deepgram_tts = DeepgramClient( api_key= self.api_key )




    async def convert_text_to_file(self , text ,  model = "aura-asteria-en" ):
        try:
            file_name = f'{self.guid}_{self.output_file_name}'
            self.options_tts = SpeakOptions( model="aura-asteria-en"  )
            audio_folder = os.path.join("public", "audio")
            if not os.path.exists(audio_folder):
                os.makedirs(audio_folder)
            filename = os.path.join(audio_folder, file_name)
            self.deepgram_tts.speak.v("1").save(filename, {"text":text}, self.options_tts)
            audio_url = f"/public/audio/{os.path.basename(file_name)}"
            data_object = { "final_msg" : False , "audio" : audio_url }
            await self.dispatcher.broadcast(
                self.guid,
                Message(
                    MessageHeader(MessageType.CALL_WEBSOCKET_PUT),
                    data= data_object ,
                ),
            )

        except Exception as e:
            raise ValueError(f"Speech synthesis failed: {str(e)}")



    async def convert_via_deepgram(self, words):
        SPEAK_OPTIONS = { "text": words }
        print( SPEAK_OPTIONS )
        self.options_tts = SpeakOptions( model="aura-asteria-en"  , encoding="linear16" , sample_rate=16000  )
        response = self.deepgram_tts.speak.v("1").stream( SPEAK_OPTIONS , self.options_tts)    
        response = response.stream.read()

        

        data_object = { "final_msg" : False , "audio" : response }
        await self.dispatcher.broadcast(
            self.guid,
            Message(
                MessageHeader(MessageType.CALL_WEBSOCKET_PUT),
                data= data_object ,
            ),
        )


    
    async def run_async(self):
        async with await self.dispatcher.subscribe(
            self.guid, MessageType.LLM_GENERATED_TEXT
        ) as llm_generated_text :             
            async for event in llm_generated_text:              
                # asyncio.create_task(self.convert_via_deepgram(event.message.data))  
                # # await self.convert_via_deepgram(event.message.data)
                # await self.convert_text_to_file( event.message.data )
                asyncio.create_task(self.convert_text_to_file( event.message.data ))

