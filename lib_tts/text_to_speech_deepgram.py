import asyncio , os , base64
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
        self.options_tts = SpeakOptions( model="aura-perseus-en"  , encoding="linear16" , sample_rate=16000  )



    async def convert_via_deepgram(self, words):
        SPEAK_OPTIONS = { "text": words }
        # print( SPEAK_OPTIONS )
        response = self.deepgram_tts.speak.v("1").stream( SPEAK_OPTIONS , self.options_tts)    
        response = response.stream.read()

        # print( "responce recieved" )
        
        base64_audio = base64.b64encode(response).decode("utf-8")
        data_object = { "final_msg" : False , "audio" : base64_audio }
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
                asyncio.create_task(self.convert_via_deepgram(event.message.data))  
                # print(event.message.data)
                # await self.convert_via_deepgram(event.message.data)
