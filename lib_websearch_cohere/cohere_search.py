import time , asyncio
from lib_websearch_cohere.search import Search
from lib_websearch_cohere.reader import Web_Reader
from lib_websearch_cohere.reranker import Cohere_Reranker

class Cohere_Websearch : 
    def __init__(self , google_api_key , search_engine_id , cohere_api_key) -> None:
        self.reader = Web_Reader()
        self.search = Search(google_api_key, search_engine_id)
        self.reranker = Cohere_Reranker( cohere_api_key )
    
    async def run(self , query , num_top_results = 6) : 
        try : 
            tasks = []
            links = self.search.get_links( query )

            for link in links[:num_top_results]:
                tasks.append(self.reader.read_text(link))

            print(f"Links : {links}")
            responses = await asyncio.gather(*tasks)
            chunked_documents = []
            for resp in responses:
                if resp["status"] : chunked_documents.extend( self.reranker.get_text_chunks_langchain( resp['page_content'] , resp['source'] ) )
                else: print(f"Failed to extract content from {link}: {resp['error']}")


            self.reranker.initalize_compressor(chunked_documents)
            compressed_docs , shortListedLinks = self.reranker.get_top_k( query , k_results=4 )

            return { 
                "status" : True , 
                "links" : shortListedLinks,
                "compressed_docs" : compressed_docs , 
                }
        
        except Exception as e :
            print(e) 
            return { "status" : False  }