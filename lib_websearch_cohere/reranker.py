from typing import List
from langchain.schema.document import Document
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import CohereEmbeddings
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import CohereRerank
from langchain.text_splitter import CharacterTextSplitter , RecursiveCharacterTextSplitter


class Cohere_Reranker : 
    def __init__(self , api_key) -> None:
        self.api_key = api_key
        self.cohere_rerank = CohereRerank(cohere_api_key=self.api_key , top_n=3)
        self.cohere_embeddings = CohereEmbeddings(cohere_api_key=self.api_key)



    def get_text_chunks_langchain(self , text , source_url):
        text_splitter = RecursiveCharacterTextSplitter( chunk_size = 1200 , chunk_overlap = 20)
        docs = [Document(page_content=x ,metadata={"source": source_url}) for x in text_splitter.split_text(text)]
        return docs

    def initalize_compressor(self , chunked_documents) : 
        self.documents = chunked_documents
        print("Total_Docs :> " , len(self.documents))
        self.db = Chroma.from_documents(self.documents, self.cohere_embeddings)
        self.compression_retriever = ContextualCompressionRetriever(
            base_compressor=self.cohere_rerank, 
            base_retriever=self.db.as_retriever(
                # search_kwargs = {'k': 6} 
                search_type="mmr",
                search_kwargs={'k': 6, 'lambda_mult': 0.25 , "fetch_k" : 50}                 
                 )
        )


    def get_top_k(self, query: str, k_results: int) -> List[str]:
        """
        Retrieves the top k relevant passages to the query.

        Args:
            query (str): The search query.6
            k_results (int): The number of top results to return.

        Returns:
            final_docs[str]: A list of the top k relevant passages.
            shortListedLinks[str]: A list of sources used for genersting response.
        """
        print("StartQuery")
        compressed_docs = self.compression_retriever.invoke(query)
        final_docs , shortListedLinks = [ ] , set()
        for doc in  compressed_docs[:k_results] : 
            final_docs.append({ "page_content" :  doc.page_content , "source" : doc.metadata["source"]} )
            shortListedLinks.add(doc.metadata["source"])
        shortListedLinks = list(shortListedLinks)
        print("EndQuery" , "CompressedDocs : " , len(compressed_docs) , "FinalDocs : " , len(final_docs))
        return final_docs , shortListedLinks
    