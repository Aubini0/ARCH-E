from lib_infrastructure.dispatcher import (
    Dispatcher,
    Message,
    MessageHeader,
    MessageType,
)
from fastapi import WebSocket
from fastapi.websockets import WebSocketState
import asyncio , os
from lib_infrastructure.disposable import Disposable


class WebsocketManager(Disposable):
    def __init__(
        self,
        guid,
        output_file_path,
        dispatcher: Dispatcher,
        ws: WebSocket,
        logger=None,
    ):
        self.guid = guid
        self.output_file_path = output_file_path
        self.dispatcher = dispatcher
        self.ws = ws
        self.logger = logger

    async def open(self):
        await self.ws.accept()
        self.state = WebSocketState.CONNECTED

    async def stream_text(self):
        async for message in self.ws.iter_text():
            #print("GR: TwilioWebSocket received message")
            yield message

    async def send(self, message):
        if self.is_closed():
            # print("GR: TwilioWebSocket Cannot send message on closed websocket" , flush=True)
            return
        
        # send json data object to twillio websocket 
        # await self.ws.send_bytes(message)
        if isinstance(message , dict) : 
            await self.ws.send_json(message)


    async def __close(self):
        try:
            await self.ws.close()
        except:  # noqa
            pass

    def is_closed(self):
        return (
            self.ws.application_state == WebSocketState.DISCONNECTED
            or self.ws.client_state == WebSocketState.DISCONNECTED
        )

    async def close_connection(self):
        async with await self.dispatcher.subscribe(
            self.guid, MessageType.CALL_CLOSE_CONNECTION
        ) as subscriber:
            async for event in subscriber:
                await self.__close()
                break




    async def check_connection(self):
        while True:
            if (
                self.ws.application_state == WebSocketState.DISCONNECTED
                or self.ws.client_state == WebSocketState.DISCONNECTED
            ):
                print("ServerSocker : " ,  self.ws.application_state , "ClientSocket : " , self.ws.client_state )
                await self.dispatcher.broadcast(
                    self.guid,
                    Message(MessageHeader(MessageType.CALL_ENDED), "Closed"),
                )
                break  # Exit the loop if the WebSocket is disconnected
            await asyncio.sleep(1)

    async def websocket_get(self):
        # print("TwilioWebSocket websocket_get" , flush=True)
        try : 
            async for message in self.ws.iter_bytes():
                await self.dispatcher.broadcast(
                    self.guid,
                    Message(
                        MessageHeader(MessageType.CALL_WEBSOCKET_GET), message
                    ),
                )


        except RuntimeError : 
            pass

    async def websocket_put(self):
        async with await self.dispatcher.subscribe(
            self.guid, MessageType.CALL_WEBSOCKET_PUT
        ) as subscriber:
            async for event in subscriber:
                stream_data = event.message.data
                await self.send( stream_data )


    async def websocket_put_user_transcription(self):
        async with await self.dispatcher.subscribe(
            self.guid, MessageType.FINAL_TRANSCRIPTION_CREATED
        ) as subscriber:
            async for event in subscriber:
                stream_data = event.message.data
                user_msg = stream_data.content
                user_msg_data = { "is_text" : True , "is_transcription" : True  , "msg" : user_msg }
                await self.send( user_msg_data )

    async def websocket_put_llm_responce(self):
        async with await self.dispatcher.subscribe(
            self.guid, MessageType.LLM_GENERATED_TEXT
        ) as subscriber:
            async for event in subscriber:
                llm_msg = event.message.data
                llm_msg_data = { "is_text" : True , "is_transcription" : False  , "msg" : llm_msg }
                await self.send( llm_msg_data )



    async def run_async(self):
        await self.open()
        # async background tasks for handeling websocket conenctions
        tasks = [
            # check for recieving events
            asyncio.create_task(self.websocket_get()),
            # check for sending events
            asyncio.create_task(self.websocket_put()),


            # check for sending events
            asyncio.create_task(self.websocket_put_user_transcription()),
            # check for sending events
            asyncio.create_task(self.websocket_put_llm_responce()),


            # check for close connection events
            asyncio.create_task(self.close_connection()),
            # check for socket connection state
            asyncio.create_task(self.check_connection()),
        ]
        await asyncio.gather(*tasks)

    async def dispose(self):
        # Cancel all running tasks
        for task in asyncio.all_tasks():
            if task is not asyncio.current_task():
                task.cancel()
        await self.__close()




