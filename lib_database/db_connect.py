import os
from dotenv import load_dotenv
from pymongo import MongoClient
# from lib_database.db_configurations import create_vector_index

load_dotenv()


MONGO_HOST_DEV = os.getenv("DB_HOST")
MONGO_USERNAME_DEV = os.getenv("USERMONGO")
MONGO_PASSWORD_DEV = os.getenv("PASSWORDMONGO")

MONGO_HOST_PROD = os.getenv("DB_HOST_PROD")
MONGO_USERNAME_PROD = os.getenv("USERMONGO_PROD")
MONGO_PASSWORD_PROD = os.getenv("PASSWORDMONGO_PROD")


dbName = os.getenv("DB_NAME")
chat_collection_name = os.getenv("CHAT_DB_COLLECTION")
users_collection_name = os.getenv("USER_DB_COLLECTION")
embeddings_collection_name = os.getenv("EMBEDDINGS_COLLECTION")


MONGO_URI_DEV = f'mongodb+srv://{MONGO_USERNAME_DEV}:{MONGO_PASSWORD_DEV}@{MONGO_HOST_DEV}/?retryWrites=true&w=majority'
MONGO_URI_PROD = f'mongodb+srv://{MONGO_USERNAME_PROD}:{MONGO_PASSWORD_PROD}@{MONGO_HOST_PROD}/?retryWrites=true&w=majority'

client = MongoClient(MONGO_URI_DEV)
chats_collection = client[dbName][chat_collection_name]
users_collection = client[dbName][users_collection_name]
embeddings_collection = client[dbName][embeddings_collection_name]


# db configurations functions
# create_vector_index( embeddings_collection )


