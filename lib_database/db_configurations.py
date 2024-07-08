# from pymongo.operations import SearchIndexModel


# def create_vector_index( collection_name ):  
#     # Create your index model, then create the search index
#     search_index_model = SearchIndexModel(
#     definition={
#         "fields": [
#         {
#             "type": "vector",
#             "numDimensions": 1536,
#             "path": "embedding",
#             "similarity": "cosine"
#         },
#         {
#             "type": "filter",
#             "path": "user_id"
#         },
#         ]
#     },
#     name="default",
#     type="vectorSearch",
#     )

#     result = collection_name.create_search_index(model=search_index_model)
#     print( result )