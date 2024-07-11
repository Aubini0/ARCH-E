from googleapiclient.discovery import build
from pydantic import BaseModel
import yaml , os
from dotenv import load_dotenv

load_dotenv()

class YoutubeSearchConfig(BaseModel):
    api_key: str
    max_results: int
    published_after: str
    region_code: str


class YoutubeSearch:
    """
    A class to perform YouTube searches based on configured parameters.

    Attributes:
        api_key (str): API key for accessing the YouTube Data API.
        max_results (int): Maximum number of results to fetch per query.
        published_after (str): Date string (RFC 3339 format) for filtering results published after this date.
        region_code (str): Region code (ISO 3166-1 alpha-2) to filter search results by region.
    """

    def __init__(self):
        """
        Initializes the YoutubeSearch object.

        Args:
            config_file (str): Path to the YAML configuration file containing API key and search parameters.
        """
        # with open(config_file, 'r') as f:
        #     config_data = yaml.safe_load(f)
        config_data = {  
            "api_key" : os.getenv("YOUTUBE_API_KEY"),
            "max_results" : int(os.getenv("YOUTUBE_MAX_RESULTS")),
            "published_after" : os.getenv("PUBLISHED_AFTER_DATE"),
            "region_code" : os.getenv("REGION_CODE")
                    }
        
        config = YoutubeSearchConfig(**config_data)
        print(config , '<< config >>')
        self.youtube = build('youtube', 'v3', developerKey=config.api_key)
        self.max_results = config.max_results
        self.published_after = config.published_after
        self.region_code = config.region_code

    def search(self, query: str) -> list[dict]:
        """
        Performs a YouTube search based on the provided query.

        Args:
            query (str): The search query.

        Returns:
            list[dict]: A list of dictionaries containing search results. Each dictionary contains:
                - 'title': Title of the video.
                - 'thumbnails': Dictionary of thumbnail sizes and their URLs.
                - 'video_link': URL link to the YouTube video.
        """
        search_response = self.youtube.search().list(
            q=query,
            part='snippet',
            maxResults=self.max_results,
            publishedAfter=self.published_after,
            regionCode=self.region_code
        ).execute()

        results = []

        for item in search_response['items']:
            kind = item['id']['kind']

            if kind == 'youtube#video':
                videoId = item['id']['videoId']
                video_link = f"https://www.youtube.com/watch?v={videoId}"

                title = item['snippet']['title']
                thumbnails = item['snippet']['thumbnails']

                # Extract all available thumbnail sizes
                thumbnail_urls = {size: thumbnails[size]['url'] for size in thumbnails}

                result = {
                    'title': title,
                    'thumbnails': thumbnail_urls,
                    'video_link': video_link
                }

                results.append(result)

        return results
