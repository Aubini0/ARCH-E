import os
from dotenv import load_dotenv
from pymongo import MongoClient
# from lib_database.db_configurations import create_vector_index

load_dotenv()

MONGO_HOST = os.getenv("DB_HOST")
MONGO_USERNAME = os.getenv("USERMONGO")
MONGO_PASSWORD = os.getenv("PASSWORDMONGO")

MONGO_HOST_PROD = os.getenv("DB_HOST_PROD")
MONGO_USERNAME_PROD = os.getenv("USERMONGO_PROD")
MONGO_PASSWORD_PROD = os.getenv("PASSWORDMONGO_PROD")



MONGO_URI = f'mongodb+srv://{MONGO_USERNAME}:{MONGO_PASSWORD}@{MONGO_HOST}/?retryWrites=true&w=majority'
# MONGO_URI_PROD = f'mongodb+srv://{MONGO_USERNAME_PROD}:{MONGO_PASSWORD_PROD}@{MONGO_HOST_PROD}/?retryWrites=true&w=majority'

client = MongoClient(MONGO_URI)
dbName = os.getenv("DB_NAME")
userdbName = os.getenv("USER_DB_NAME")
collectionName = os.getenv("EMBEDDINGS_COLLECTION")
users_collection_name = os.getenv("USER_DB_COLLECTION")
embeddings_collection = client[dbName][collectionName]
users_collection = client[userdbName][users_collection_name]


# db configurations functions
# create_vector_index( embeddings_collection )


