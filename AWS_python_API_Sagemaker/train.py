
import boto3
import os
import re
import time


language_code = 'de-DE' #'en-US'  # or 'de-DE' for German
BUCKET_NAME = 'videos-9bp1cglp2mau'

vocab_name = 'videos-subtitles-German'
model_name = 'Subtitles_model_german'
directory_path = 'subtitles'


transcribe = boto3.client('transcribe', region_name='eu-west-2')  # Replace 'us-east-1' with your region.


def delete_vocabulary_if_exists(vocab_name):
    try:
        transcribe.delete_vocabulary(VocabularyName=vocab_name)
        print(f"Deleted existing vocabulary: {vocab_name}")
        time.sleep(10)  # Introducing a delay of 10 seconds
    except transcribe.exceptions.BadRequestException:
        # Vocabulary with the provided name doesn't exist, we can continue
        pass

def delete_language_model_if_exists(model_name):
    try:
        transcribe.delete_language_model(ModelName=model_name)
        print(f"Deleted existing language model: {model_name}")
        time.sleep(10)  # Introducing a delay of 10 seconds
    except transcribe.exceptions.BadRequestException:
        # Language model with the provided name doesn't exist, we can continue
        pass



def create_custom_vocabulary(vocab_name, vocab_terms, language_code):
    # Delete the vocabulary if it already exists
    delete_vocabulary_if_exists(vocab_name)
    
    response = transcribe.create_vocabulary(
        VocabularyName=vocab_name,
        LanguageCode=language_code,
        Phrases=vocab_terms
    )
    return response

def read_file_with_fallback_encodings(filepath):
    """Try reading the file with multiple encodings."""
    encodings_to_try = ['utf-8', 'ISO-8859-1', 'windows-1252']
    for encoding in encodings_to_try:
        try:
            with open(filepath, 'r', encoding=encoding) as f:
                return f.read()
        except UnicodeDecodeError:
            pass
    raise UnicodeDecodeError(f"Failed to decode {filepath} using encodings: {', '.join(encodings_to_try)}")


def extract_unique_words_from_subtitles(directory_path):
    unique_words = set()

    # Loop through all files in the directory
    for filename in os.listdir(directory_path):
        if filename.endswith(".txt"):
            content = read_file_with_fallback_encodings(os.path.join(directory_path, filename))
            words = content.split()
            unique_words.update(words)

    return list(unique_words)



def create_custom_language_model(model_name, base_model_name, input_data_config, language_code):
    # Delete the language model if it already exists
    delete_language_model_if_exists(model_name)
    
    response = transcribe.create_language_model(
        ModelName=model_name,
        BaseModelName=base_model_name,
        InputDataConfig=input_data_config,
        LanguageCode=language_code
    )
    return response

def clean_term(term):
    # Remove non-alphanumeric characters except spaces and keep German umlauts and ß
    term = re.sub(r'[^a-zA-ZäöüÄÖÜß\s]', '', term)
    # Remove extra spaces and strip whitespace
    return ' '.join(term.split())


# Example usage:

vocab_terms = extract_unique_words_from_subtitles(directory_path)

MAX_TERMS = 5500  # Adjust this number based on your needs

if len(vocab_terms) > MAX_TERMS:
    vocab_terms = vocab_terms[:MAX_TERMS]
    vocab_terms = [clean_term(term) for term in vocab_terms if 4 < len(clean_term(term)) <= 256]
    vocab_terms = list(set(vocab_terms))




create_custom_vocabulary(vocab_name, vocab_terms, language_code)
while True:
    response = transcribe.get_vocabulary(VocabularyName=vocab_name)
    status = response.get('VocabularyState')
    print(f"Vocabulary Status: {status}")
    if status == 'READY':
        break
    elif status == 'FAILED':
        print("Vocabulary creation failed. Exiting.")
        exit(1)
    time.sleep(10) 



base_model_name = 'WideBand'  # or 'WideBand' for higher quality audio NarrowBand
input_data_config = {
    'S3Uri': f's3://{BUCKET_NAME}/training/',  # Fixed the string formatting
    'TuningDataS3Uri': f's3://{BUCKET_NAME}/tuning/',  # Fixed the string formatting
    'DataAccessRoleArn': 'arn:aws:iam::027908263895:role/TranscriptionJobName'
}



create_custom_language_model(model_name, base_model_name, input_data_config, language_code)


