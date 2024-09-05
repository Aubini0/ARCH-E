import requests
from typing import List


class Search:
    """
    A class to perform Google Custom Search using the Google Search API.

    Attributes:
        api_key (str): The API key for the Google Search API.
        search_engine_id (str): The search engine ID for the Google Custom Search Engine.
        url (str): The base URL for the Google Custom Search API.
    """

    def __init__(self, api_key: str, search_engine_id: str):
        """
        Initializes the Search class with the API key and search engine ID.

        Args:
            api_key (str): The API key for the Google Search API.
            search_engine_id (str): The search engine ID for the Google Custom Search Engine.
        """

        self.api_key = api_key
        self.domain = "google.com"
        self.search_engine_id = search_engine_id
        # self.excluded_sites = "youtube.com spotify.com"
        self.excluded_sites = "youtube.com"
        self.url = "https://www.googleapis.com/customsearch/v1"

    def get_links(self, query: str) -> List[str]:
        """
        Retrieves a list of links for the top search results from Google Custom Search.

        Args:
            query (str): The search query.

        Returns:
            List[str]: A list of URLs of the top search results.
        """

        params = {
            'q': query,
            'key': self.api_key,
            'cx':  self.search_engine_id,
            "googlehost" : self.domain,
            "excludeTerms" : self.excluded_sites
        }
        
        response = requests.get(self.url, params=params)

        if response.status_code == 200:
            items = response.json().get("items", [])
            links = [item['link'] for item in items]
            return links
        else:
            print(f"Error: {response.status_code}")
            return []

