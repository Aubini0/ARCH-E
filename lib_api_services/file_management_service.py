from bson.objectid import ObjectId
from fastapi import status , HTTPException
from lib_utils.file_utils import ( upload_file )
from api_request_schemas import folder_schema
from lib_db_repos import ( FilesRepo , FoldersRepo )



def upload_file_service(user_id , file , folder_id = None):
    try : 
        file_server_location = "public/uploads/files"
        file_base_url_path = "https://api.arche.social/uploads/files"
        response = upload_file( user_id , file , file_server_location , file_base_url_path , False)

        if response["status"] : 
            file_url = response["location"]
            # preparing payload
            data = { "user_id" :  ObjectId(user_id) , "file_name" : file.filename , "file_url" : file_url }
            if folder_id : 
                data["folder_id"] = ObjectId(folder_id)
            file_id = FilesRepo.insert_file( data )

            if file_id : 
                response = {
                    "status" : True,
                    "message": "File Uploaded.",
                    "data" : { "file_url" : file_url }
                }

                return response , status.HTTP_200_OK

            else : 
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File Not saved"
                )

        else : 
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"File Not saved having error : {response['message']}"
            )
            


    except Exception as e : 
        print(e)
        if isinstance(e , HTTPException) : status_code = e.status_code
        else : status_code = status.HTTP_400_BAD_REQUEST
        response = {
            "status" : False,
            "message": "Failed to upload file.",
            "data" : {},
            "error": str(e),
        }

        return response , status_code

def retrieve_files_service(user_id):
    try : 
        files = FilesRepo.get_files( user_id )
        if files : 
            response = {
                "status" : True,
                "message": "File Retrieved.",
                "data" : { "files" : files }
            }
            return response , status.HTTP_200_OK

        else : 
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Files not found"
            )

    except Exception as e : 
        print(e)
        if isinstance(e , HTTPException) : status_code = e.status_code
        else : status_code = status.HTTP_400_BAD_REQUEST
        response = {
            "status" : False,
            "message": "Failed to Retrieve files.",
            "data" : {},
            "error": str(e),
        }

        return response , status_code

def create_folder_service(user_id , folder_payload : folder_schema):
    try : 
        data = { "user_id" : ObjectId(user_id) , "folder_name" : folder_payload.folder_name }
        folder_id = FoldersRepo.create_folder(data)
        print(">>>>" , folder_id)
        folder_name = folder_payload.folder_name
        if folder_id : 
            response = {
                "status" : True,
                "message": "Folder Created.",
                "data" : { "fodler_id" : str(folder_id) , "folder_name" : folder_name }
            }

            return response , status.HTTP_200_OK

        else : 
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Folder Not created"
            )            


    except Exception as e : 
        if isinstance(e , HTTPException) : status_code = e.status_code
        else : status_code = status.HTTP_400_BAD_REQUEST
        response = {
            "status" : False,
            "message": "Failed to create Folder.",
            "data" : {},
            "error": str(e),
        }

        return response , status_code

def retrieve_folders_service(user_id):
    try : 
        folders = FoldersRepo.get_folders( user_id )
        if folders : 
            response = {
                "status" : True,
                "message": "Folders Retrieved.",
                "data" : { "folders" : folders }
            }
            return response , status.HTTP_200_OK

        else : 
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Folders not found"
            )

    except Exception as e : 
        print(e)
        if isinstance(e , HTTPException) : status_code = e.status_code
        else : status_code = status.HTTP_400_BAD_REQUEST
        response = {
            "status" : False,
            "message": "Failed to Retrieve folders.",
            "data" : {},
            "error": str(e),
        }

        return response , status_code




def retrieve_files_of_folder_service(folder_id):
    try : 
        files = FilesRepo.get_files_by_folder( folder_id )
        if files : 
            response = {
                "status" : True,
                "message": "Files Retrieved.",
                "data" : { "files" : files }
            }
            return response , status.HTTP_200_OK

        else : 
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Files not found"
            )

    except Exception as e : 
        print(e)
        if isinstance(e , HTTPException) : status_code = e.status_code
        else : status_code = status.HTTP_400_BAD_REQUEST
        response = {
            "status" : False,
            "message": "Failed to Retrieve Files.",
            "data" : {},
            "error": str(e),
        }

        return response , status_code
