import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_HOST = os.getenv("DB_HOST")
MONGO_USERNAME = os.getenv("USERMONGO")
MONGO_PASSWORD = os.getenv("PASSWORDMONGO")
MONGO_URI = f'mongodb+srv://{MONGO_USERNAME}:{MONGO_PASSWORD}@{MONGO_HOST}/?retryWrites=true&w=majority'
print("Mongo_URI :> " , MONGO_URI)

client = MongoClient(MONGO_URI)
dbName = os.getenv("DB_NAME")
collectionName = os.getenv("EMBEDDINGS_COLLECTION")
embeddings_collection = client[dbName][collectionName]


