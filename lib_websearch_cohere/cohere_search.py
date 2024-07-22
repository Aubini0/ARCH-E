import time , asyncio
from lib_websearch_cohere.search import Search
from lib_websearch_cohere.reader import Web_Reader
from lib_websearch_cohere.reranker import Cohere_Reranker

class Cohere_Websearch : 
    def __init__(self , google_api_key , search_engine_id , cohere_api_key) -> None:
        self.reader = Web_Reader()
        self.search = Search(google_api_key, search_engine_id)
        self.reranker = Cohere_Reranker( cohere_api_key )
    
    async def run(self , query , num_top_results = 4) : 
        tasks = []
        links = self.search.get_links( query )

        for link in links[:num_top_results]:
            tasks.append(self.reader.read_text(link))


        responses = await asyncio.gather(*tasks)
        documents = ""
        
        for resp in responses:
            if resp['status']: documents += resp['page_content'] + "\n"
            else: print(f"Failed to extract content from {link}: {resp['error']}")


        self.reranker.initalize_compressor(documents)
        compressed_docs = self.reranker.get_top_k( query , k_results=3 )
        return compressed_docs , links[ : num_top_results]
