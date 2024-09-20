import os
import time
import random

def generate_unique_id(user_id , file_extension):
    timestamp = int(time.time())  # Current time in seconds
    random_number = random.randint(1000, 9999)  # A random 4-digit number
    unique_id = f"{user_id}_{timestamp}_{random_number}{file_extension}"
    return unique_id



def upload_file(user_id , file , file_server_location ,  file_base_url_path , is_unique = True):
    try : 
        print(f"File received: {file.filename}")
        _, file_extension = os.path.splitext(file.filename)

        if is_unique : 
            file_name = f"{user_id}{file_extension}"                
            file_location = f"{file_base_url_path}/{file_name}"
            file_server_location = f"{file_server_location}/{file_name}"

        else : 
            file_unique_id = generate_unique_id( user_id , file_extension)
            file_location = f"{file_base_url_path}/{file_unique_id}"
            file_server_location = f"{file_server_location}/{file_unique_id}"


        with open(file_server_location, "wb") as f:
            f.write(file.file.read())
        
        print(file_server_location , file_location)

        return { "status" : True , "location" : file_location }
    except Exception as e : 
        return { "status" : True , "message" : str(e) }
