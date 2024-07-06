from search_runner import SearchRunner

google_api_key = "GOOGLE-API-KEY"
search_engine_id = "SEARCH-ENGINE-ID"
jina_api_key = "JINA-API-KEY"

search_runner = SearchRunner(google_api_key, search_engine_id, jina_api_key)
query = "query"
results = search_runner.run(query)

print(results)
