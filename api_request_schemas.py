from pydantic import BaseModel

class invoke_llm_schema(BaseModel):
    guid : str
    user_msg : str
