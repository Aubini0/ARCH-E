from typing import List
from search import Search
from jina_reader import JinaReader
from search_reranker import JinaReranker


class SearchRunner:
    def __init__(self, google_api_key: str, search_engine_id: str, jina_api_key: str):
        """
        Initializes the SearchRunner with API keys for Google Search and Jina.

        :param google_api_key: API key for Google Search
        :param search_engine_id: Search engine ID for Google Custom Search
        :param jina_api_key: API key for Jina
        """
        self.search = Search(google_api_key, search_engine_id)
        self.reader = JinaReader()
        self.jina_api_key = jina_api_key

    def run(self, query: str, num_top_results: int = 5, k_results: int = 3) -> List[str]:
        """
        Runs the search and reranking process for a given query.

        :param query: The search query string
        :param num_top_results: Number of top search results to consider (default is 5)
        :param k_results: Number of top passages to return after reranking (default is 3)
        :return: A list of the most relevant passages extracted from the search results
        """
        links = self.search.get_links(query)
        documents = ""
        for link in links[:num_top_results]:
            page_content = self.reader.read_text(link)
            documents += page_content
        reranker = JinaReranker(documents, self.jina_api_key)
        results = reranker.get_top_k(query, k_results)
        return results
