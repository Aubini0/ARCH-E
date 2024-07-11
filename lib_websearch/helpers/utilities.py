def format_prompt(passages):
    """
    Formats a list of passages into an enumerated string.

    Args:
        passages (list of str): A list of passages to be formatted.

    Returns:
        str: A formatted string with each passage enumerated.
    """
    formatted_passages = ""
    for i, passage in enumerate(passages, start=1):
        formatted_passages += f"{i}. Passage {i}:\n   {passage}\n\n"
    return formatted_passages
