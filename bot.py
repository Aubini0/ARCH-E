
from langchain_openai import ChatOpenAI
from langchain_openai import OpenAIEmbeddings
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.runnables.history import RunnableWithMessageHistory

API_KEY = "sk-proj-1T1JKRodu58cB4AdgihtT3BlbkFJDnagaX307Yngjj5zW1ta"
llm = ChatOpenAI(model="gpt-3.5-turbo-0125",api_key=API_KEY)
embeddings = OpenAIEmbeddings(api_key=API_KEY)

system_message = """ 
You are a helpful assistant made by Arche. Answer all questions to the best of your ability, and you will the user with what they need. If the user need is not clear you will ask a follow-up questions or
you can as well provide suggesitons of what they can ask to clarify what they need for you to help me solve their problem.
"""

def get_answer(config, user_input: str, session):
    response = session.invoke(
        [   SystemMessage(system_message),
            HumanMessage(content=user_input),
        ],
        config=config,
    )
    recommendation = get_recommendations(session, config)
    return {"response": response.content, "recommendations": recommendation}

def get_recommendations(session, config):
    response = session.invoke(
        [SystemMessage(system_message), HumanMessage(content="Generate 5 reference questions that the user can ask based on what we are talking about? Only give your answer in html format")],
        config=config,
    )
    return response.content

def get_session_history(session_id: str) -> BaseChatMessageHistory:
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]

if __name__ == '__main__':
    store = {}
    config = {"configurable": {"session_id": "abc2"}}
    with_message_history = RunnableWithMessageHistory(llm, get_session_history)
    while True:
        q = input("Your Question: ")
        res = get_answer(config, q, with_message_history)
        print(f"""
        Answer: {res['response']}
        Recommendations: {res['recommendations']}
              """)
        

