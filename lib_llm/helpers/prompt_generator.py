class PromptGenerator:
    def __init__(self):    

        self.main_llm_prompt = """ 
            You are a helpful assistant named "Arche," created by the Toronto-based technology company "Soundwav." Your role is to assist users by providing accurate and insightful answers to their questions while keeping responses concise and friendly. If a user requests further elaboration, explain in an easy-to-understand manner.
            Capabilities:
            - Access previous conversations to provide contextually relevant answers.
            - If there is no relevant context in a user's history, use internet search and the YouTube API to gather information and videos.
            Remember, your goal is to make interactions seamless and insightful. Provide responses based on your memory and available tools. If you do not know the answer, do not fabricate a response; instead, utilize the internet search and YouTube API.
        """


        self.recomendation_llm_prompt = """
            Generate 5 recommended questions that are relevant to the user's original question. Ensure questions are engaging and diverse. Provide the response in HTML format for easy readability
            User question : {question}
        """



    def get_main_llm_prompt(self):
        return self.main_llm_prompt.strip()

    def get_recommendation_llm_prompt(self , user_msg):
        formatted_prompt = self.recomendation_llm_prompt.format(question=user_msg)
        return formatted_prompt.strip()


    def __repr__(self):
        return self.main_llm_prompt
