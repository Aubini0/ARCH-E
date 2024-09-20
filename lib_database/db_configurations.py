# from pymongo.operations import SearchIndexModel

def create_unique_index( collection_name , field_name ) : 
    collection_name.create_index([(field_name, 1)], unique=True)


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