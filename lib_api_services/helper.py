import re

def segregate_qa_pairs(text, session_id):
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

