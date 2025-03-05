#upload_s3_training.py

import boto3
import os
import json
import re

# Local directories containing audio and transcriptions
LOCAL_TRANSCRIPTION_DIR = 'tuning_subtitles'

# S3 details
BUCKET_NAME = 'videos-xxxxxx'
TRANSCRIPTION_DIR_IN_S3 = 'tuning/'
merged_filename = "merged_transcriptions.txt"
cleaned_filename = "merged_transcriptions_cleaned.txt"

def is_valid_file(filename):
    # Exclude the .DS_Store file
    if filename == ".DS_Store":
        return False
    
    if filename == ".DS_Store.txt":
        return False

    # Further conditions can be added as needed
    return True


def delete_file_if_exists(filepath):
    """Delete the file if it exists."""
    try:
        os.remove(filepath)
    except FileNotFoundError:
        pass

# SRT to TXT conversion function
def srt_to_txt(srt_content):
    # Remove SRT numbering and timestamp
    pattern = re.compile(r'\d+\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}\n')
    plain_text = re.sub(pattern, '', srt_content)
    
    # Remove any remaining HTML tags
    plain_text = re.sub(r'<.*?>', '', plain_text)
    
    # Remove multi-line content enclosed in parentheses
    plain_text = re.sub(r'\(.*?\)', '', plain_text, flags=re.DOTALL)
    
    # Remove speaker labels or descriptors like "MAN:", "MAN #2:", etc.
    plain_text = re.sub(r'^[A-Z\s#]+?:\s*', '', plain_text, flags=re.MULTILINE)
    
    # Remove any non-alphanumeric characters except for basic punctuation, spaces, and umlauts
    plain_text = re.sub(r'[^a-zA-Z0-9äöüÄÖÜß\s.,?!]', '', plain_text)
    
    # Strip unnecessary whitespace and combine consecutive dialogues
    plain_text = '\n'.join([line.strip() for line in plain_text.splitlines() if line.strip()])

    return plain_text

def rename_file_extension(directory, old_file_name, new_extension):
    """
    Rename the file extension of a given file.
    """
    # 1. Remove all occurrences of the single quote (').
    base_name, ext = os.path.splitext(old_file_name)
    base_name = base_name.replace("'", "")

    # 2. Remove everything inside square brackets ([*]).
    base_name = re.sub(r'\[.*?\]', '', base_name)

    # 3. Replace all dots (.) with underscores (_), except for the last one.
    base_name = base_name.replace('.', '_')

    # Construct the new file name with the desired extension.
    new_file_name = base_name + new_extension

    # Define the old and new paths.
    old_path = os.path.join(directory, old_file_name)
    new_path = os.path.join(directory, new_file_name)

    # Rename the file.
    os.rename(old_path, new_path)

    return new_file_name


def upload_to_s3(local_path, s3_path, bucket_name):
    s3_client = boto3.client('s3')
    s3_client.upload_file(local_path, bucket_name, s3_path)



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

def merge_files_in_directory(directory, output_filename):
    """
    Merges all files in the specified directory into a single file.
    
    Args:
        directory (str): The path to the directory containing the files.
        output_filename (str): The name of the output file to create.
        
    Returns:
        str: The path to the merged file.
    """
    output_filepath = os.path.join(directory, output_filename)
    with open(output_filepath, 'w', encoding='utf-8') as outfile:
        for file in os.listdir(directory):
            if is_valid_file(file):
                filepath = os.path.join(directory, file)
                file_content = read_file_with_fallback_encodings(filepath)  # Use the fallback encoding function
                outfile.write(file_content + "\n\n")  # Adding 2 newline characters for separation.
    return output_filepath

def clean_binary_data(file_path):
    # Pattern to match potential binary data
    binary_data_pattern = re.compile(rb'[\x00-\x08\x0E-\x1F\x80-\xFF]')
    
    # Read the file in binary mode
    with open(file_path, "rb") as file:
        content_binary = file.read()
    
    # Remove binary characters and decode to UTF-8
    clean_content = re.sub(binary_data_pattern, b'', content_binary).decode('utf-8')
    
    # Save the cleaned content to a new file
    cleaned_file_path = file_path.replace(".txt", "_cleaned.txt")
    with open(cleaned_file_path, 'w', encoding='utf-8') as file:
        file.write(clean_content)
    
    return cleaned_file_path


def main():
    # Delete previous merged files if they exist
    
    delete_file_if_exists(os.path.join(LOCAL_TRANSCRIPTION_DIR, merged_filename))
    delete_file_if_exists(os.path.join(LOCAL_TRANSCRIPTION_DIR, cleaned_filename))

    # Continue with the merging process
    merged_filepath = merge_files_in_directory(LOCAL_TRANSCRIPTION_DIR, merged_filename)
    
    # Convert the content of the merged file
    content = read_file_with_fallback_encodings(merged_filepath)
    converted_text = srt_to_txt(content)
    
    # Write the converted content back to the merged file
    with open(merged_filepath, 'w', encoding='utf-8') as merged_file:
        merged_file.write(converted_text)
    
    cleaned_filepath = clean_binary_data(merged_filepath)

    # Upload the cleaned file to S3
    cleaned_filename_on_s3 = f'{TRANSCRIPTION_DIR_IN_S3}merged_transcriptions_cleaned.txt'
    upload_to_s3(cleaned_filepath, cleaned_filename_on_s3, BUCKET_NAME)

    print("Data uploaded successfully!")




if __name__ == '__main__':
    main()



