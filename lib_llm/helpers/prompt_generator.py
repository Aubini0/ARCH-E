class PromptGenerator:
    def __init__(self):
        self.prompt = """
            You are a helpful assistant made by Archie. Your Name is Archie. Answer all questions to the best of your ability.
            Keep Answers concize and short.
        """
        self.serialize_prompt()

    def serialize_prompt(self) : 
        # TODO: ADD serialization logic
        return self.prompt.strip()

    def __repr__(self):
        return self.prompt
