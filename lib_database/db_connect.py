import os
from dotenv import load_dotenv
from pymongo import MongoClient
from lib_database.db_configurations import create_unique_index

load_dotenv()

# dev db credentials
MONGO_HOST_DEV = os.getenv("DB_HOST") 
MONGO_USERNAME_DEV = os.getenv("USERMONGO")
MONGO_PASSWORD_DEV = os.getenv("PASSWORDMONGO")

# prod db credentials
MONGO_HOST_PROD = os.getenv("DB_HOST_PROD")
MONGO_USERNAME_PROD = os.getenv("USERMONGO_PROD")
MONGO_PASSWORD_PROD = os.getenv("PASSWORDMONGO_PROD")
5

dbName = os.getenv("DB_NAME")
tasks_collection_name = os.getenv("TASKS_COLLECTION") 
notes_collection_name = os.getenv("NOTES_COLLECTION")
files_collection_name = os.getenv("FILES_COLLECTION")
chat_collection_name = os.getenv("CHAT_DB_COLLECTION")
users_collection_name = os.getenv("USER_DB_COLLECTION")
folders_collection_name = os.getenv("FOLDERS_COLLECTION")
embeddings_collection_name = os.getenv("EMBEDDINGS_COLLECTION")



MONGO_URI_DEV = f'mongodb+srv://{MONGO_USERNAME_DEV}:{MONGO_PASSWORD_DEV}@{MONGO_HOST_DEV}/?retryWrites=true&w=majority'
MONGO_URI_PROD = f'mongodb+srv://{MONGO_USERNAME_PROD}:{MONGO_PASSWORD_PROD}@{MONGO_HOST_PROD}/?retryWrites=true&w=majority'

client = MongoClient(MONGO_URI_PROD)

chats_collection = client[dbName][chat_collection_name]
users_collection = client[dbName][users_collection_name]
files_collection = client[dbName][files_collection_name]
notes_collection = client[dbName][notes_collection_name]
tasks_collection = client[dbName][tasks_collection_name]
folders_collection = client[dbName][folders_collection_name]
embeddings_collection = client[dbName][embeddings_collection_name] 



# db configurations functions
create_unique_index( folders_collection , "folder_name" )
# create_vector_index( embeddings_collection )


