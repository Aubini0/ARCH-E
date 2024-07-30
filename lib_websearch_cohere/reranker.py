from typing import List
from langchain.schema.document import Document
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.document_loaders import TextLoader
from langchain_community.embeddings import CohereEmbeddings
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import CohereRerank



class Cohere_Reranker : 
    def __init__(self , api_key) -> None:
        self.api_key = api_key
        self.cohere_rerank = CohereRerank(cohere_api_key=self.api_key)
        self.cohere_embeddings = CohereEmbeddings(cohere_api_key=self.api_key)



    def get_text_chunks_langchain(self , text):
        text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
        docs = [Document(page_content=x) for x in text_splitter.split_text(text)]
        return docs

    def initalize_compressor(self , raw_documents) : 
        self.documents = self.get_text_chunks_langchain( raw_documents )
        self.db = Chroma.from_documents(self.documents, self.cohere_embeddings)
        self.compression_retriever = ContextualCompressionRetriever(
            base_compressor=self.cohere_rerank, 
            base_retriever=self.db.as_retriever()
        )
        print("done compressor")


    def get_top_k(self, query: str, k_results: int) -> List[str]:
        """
        Retrieves the top k relevant passages to the query.

        Args:
            query (str): The search query.6
            k_results (int): The number of top results to return.

        Returns:
            List[str]: A list of the top k relevant passages.
        """
        print("staet query")
        compressed_docs = self.compression_retriever.invoke(query)
        print("done query")
        return [doc.page_content for doc in compressed_docs[:k_results]]