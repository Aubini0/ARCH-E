import requests


class JinaReader:
    """
    A class to read text from a webpage using the Jina Reader API.

    Attributes:
        base_url (str): The base URL of the Jina Reader API.
    """

    def __init__(self, base_url: str = "https://r.jina.ai/"):
        """
        Initializes the JinaReader with the base URL.

        Args:
            base_url (str): The base URL of the Jina Reader API. Default is "https://r.jina.ai/".
        """
        self.base_url = base_url

    def read_text(self, input_url: str) -> str:
        """
        Reads text from a webpage using the Jina Reader API.

        Args:
            input_url (str): The URL of the webpage to read.

        Returns:
            str: The text content of the webpage.
        """
        full_url = self.base_url + input_url
        headers = {
            "Accept": "text/event-stream"
        }

        response = requests.get(full_url, headers=headers, stream=True)
        text = ""

        try:
            for line in response.iter_lines():
                if line:
                    decoded_line = line.decode("utf-8")
                    text += decoded_line + "\n"
        finally:
            response.close()

        return text
