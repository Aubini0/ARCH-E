import re
import copy




def find_matching_query(user_query  : str , assitant_reply : str , response_data : dict) ->list :
    for _id, qa_pairs in response_data.items():
        index , qa_pairs_copy = 0 , copy.deepcopy( qa_pairs )
        for pair in qa_pairs:
            if pair['user'].lower() == user_query.lower() and pair['assistant'].lower() == assitant_reply.lower():
                qa_pairs_copy.pop(index)
                return qa_pairs_copy , _id 
            index +=1
    return [] , None


def make_chunks(qa_list : list) -> str :
    chunk = ""
    for pair in qa_list : 
        chunk += f"user: {pair['user']} assistant: {pair['assistant']} "
    return chunk



def segregate_qa_pairs(text : str, session_id : str):
    # Split the text into chunks based on user and assistant labels
    pattern = r'(user:|assistant:)'
    segments = re.split(pattern, text)

    qa_pairs = []
    current_pair = {}

    for i in range(1, len(segments), 2):
        role = segments[i].strip().replace(":", "")
        content = segments[i + 1].strip()

        if role == "user":
            # If we already have a user statement, append the current pair and start a new one
            if "user" in current_pair:
                current_pair["session_id"] = session_id
                qa_pairs.append(current_pair)
                current_pair = {}

            current_pair["user"] = content
        elif role == "assistant":
            current_pair["assistant"] = content

    # Append the last pair if it exists
    if current_pair:
        current_pair["session_id"] = session_id
        qa_pairs.append(current_pair)

    return qa_pairs

