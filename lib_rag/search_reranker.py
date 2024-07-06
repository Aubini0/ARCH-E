from langchain_community.embeddings import JinaEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.retrievers import ContextualCompressionRetriever
from langchain_community.document_compressors import JinaRerank
from typing import List


class JinaReranker:
    """
    A class to split a document into chunks and extract the most relevant passages based on a query using Jina
    embeddings and reranking.

    Attributes:
        documents (str): The input document as a string.
        text_splitter (RecursiveCharacterTextSplitter): The text splitter to chunk the document.
        texts (List[str]): The list of text chunks.
        embedding (JinaEmbeddings): The Jina embeddings model.
        retriever (FAISS): The FAISS retriever.
        compressor (JinaRerank): The Jina rerank compressor.
        compression_retriever (ContextualCompressionRetriever): The contextual compression retriever.
    """

    def __init__(self, documents: str, jina_api_key: str, model_name: str = "jina-embeddings-v2-base-en",
                 chunk_size: int = 1024, chunk_overlap: int = 128, k: int = 10):
        """
        Initializes the JinaReranker with the given parameters.

        Args:
            documents (str): The input document as a string.
            jina_api_key (str): The API key for Jina.
            model_name (str): The name of the Jina embeddings model. Default is "jina-embeddings-v2-base-en".
            chunk_size (int): The size of each chunk. Default is 1024.
            chunk_overlap (int): The overlap between chunks. Default is 128.
            k (int): The number of top results to retrieve. Default is 10.
        """
        self.documents = documents
        self.text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        self.texts = self.text_splitter.split_text(self.documents)
        self.embedding = JinaEmbeddings(model_name=model_name, jina_api_key=jina_api_key)
        self.retriever = FAISS.from_texts(self.texts, self.embedding).as_retriever(search_kwargs={"k": k})
        self.compressor = JinaRerank(jina_api_key=jina_api_key)
        self.compression_retriever = ContextualCompressionRetriever(
            base_compressor=self.compressor, base_retriever=self.retriever
        )

    def get_top_k(self, query: str, k_results: int) -> List[str]:
        """
        Retrieves the top k relevant passages to the query.

        Args:
            query (str): The search query.
            k_results (int): The number of top results to return.

        Returns:
            List[str]: A list of the top k relevant passages.
        """
        compressed_docs = self.compression_retriever.invoke(query)
        return [doc.page_content for doc in compressed_docs[:k_results]]
