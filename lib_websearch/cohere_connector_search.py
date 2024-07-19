import cohere

class CohereWebSearch : 
    Cohere_Models = {
        "r+" : "command-r-plus",
        "r" : "command-r"
        }

    def __init__(self , api_key , model : str = "r") : 
        self.model = model
        self.api_key = api_key
        self.co = cohere.Client(api_key=self.api_key)



    def run( self , query ): 
        response = self.co.chat(
            model=CohereWebSearch.Cohere_Models[ self.model ],
            message=query,  
            connectors=[{"id": "web-search"}]  ,
        )

        citations , documents = response.citations , response.documents
        docs , citation_urls = [] , set()

        for citation in citations:
            docs.append(citation.text)
            for document in documents :
                if document['id'] in citation.document_ids :  
                    citation_urls.add( document['url'] )

        return docs , list(citation_urls)