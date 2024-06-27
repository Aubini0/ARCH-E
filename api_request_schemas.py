from pydantic import BaseModel

class invoke_llm_schema(BaseModel):
    user_msg : str
