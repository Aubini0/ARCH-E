class PromptGenerator:
    def __init__(self):
        # self.prompt = """
        #     You are a helpful assistant made by Archie. Your Name is Archie. Answer all questions to the best of your ability.
        #     Keep Answers concize and short.
        # """
        self.prompt = """
            You are a helpful assistant made by Arche. Answer all questions to the best of your ability, and you will the user with what they need. If the user need is not clear you will ask a follow-up questions or
            you can as well provide suggesitons of what they can ask to clarify what they need for you to help me solve their problem.
            KEEP IT SHORT AND CONCIZE.      
        """
        
        self.serialize_prompt()

    def serialize_prompt(self) : 
        # TODO: ADD serialization logic
        return self.prompt.strip()

    def __repr__(self):
        return self.prompt
