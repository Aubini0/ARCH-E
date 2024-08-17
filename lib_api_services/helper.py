import re
import copy



# import spacy
# from sklearn.feature_extraction.text import TfidfVectorizer

# def extract_tfidf_keywords(texts):
#     vectorizer = TfidfVectorizer(max_features=5)  # Limit to top 5 keywords
#     X = vectorizer.fit_transform(texts)
#     feature_names = vectorizer.get_feature_names_out()
#     return feature_names

# from spacy.lang.en.stop_words import STOP_WORDS

# def extract_keywords(text):
#     doc = nlp(text)
#     keywords = [token.text for token in doc if token.text.lower() not in STOP_WORDS and len(token.text) > 3]
#     return keywords

# Load spaCy model
# nlp = spacy.load("en_core_web_sm")


# def extract_keywords(text):
#     doc = nlp(text)
#     keywords = [ent.text for ent in doc.ents if ent.label_ in ('PERSON', 'ORG', 'GPE', 'EVENT')]
#     return keywords

# def extract_keywords(text):
#     doc = nlp(text.lower())
#     keywords = [token.text for token in doc if token.is_alpha and not token.is_stop and token.pos_ in ["NOUN", "PROPN", "VERB"]]
#     print(keywords)
#     return keywords




def extract_keywords(text):
    # Basic keyword extraction (could be improved with NLP libraries like spaCy)
    words = re.findall(r'\b\w+\b', text.lower())
    keywords = [word for word in words if len(word) > 3]
    return keywords




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

