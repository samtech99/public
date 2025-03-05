import boto3
import time
import json
from datetime import timedelta
import os
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import CountVectorizer
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


s3 = boto3.client('s3')
BUCKET_NAME = 'videos-xxxx'
FILE_NAME = 'xxxx.mp4'
LANGUAGE = 'de-DE'
TESTING_FOLDER = 'testing'
TARGET_LANGUGAGE = 'en'

#'es-US' for US Spanish
#'fr-FR' for French
#'de-DE' for German
#en-US


def translate_text(text, TARGET_LANGUGAGE):
    client = boto3.client('translate')
    response = client.translate_text(
        Text=text,
        SourceLanguageCode='de',  # Source language code
        TargetLanguageCode=TARGET_LANGUGAGE  # Target language code e.g., 'en' for English
    )
    translated_text = response.get('TranslatedText')
    return translated_text



def get_custom_model_status(model_name):
    client = boto3.client('transcribe')
    response = client.describe_language_model(
        ModelName=model_name
    )
    return response['LanguageModel']['ModelStatus']


def delete_transcription_job_if_exists(job_name):
    client = boto3.client('transcribe')
    try:
        client.delete_transcription_job(TranscriptionJobName=job_name)
        logging.info(f"Deleted existing transcription job with name: {job_name}")
    except client.exceptions.BadRequestException:
        # Job with the provided name doesn't exist, we can continue
        pass


def transcribe_video(job_name, file_uri, bucket_name, language_code, model_name=None):
    client = boto3.client('transcribe')
    
    # Delete the transcription job if it already exists
    delete_transcription_job_if_exists(job_name)
    
    # Transcription settings
    settings = {
        'TranscriptionJobName': job_name,
        'Media': {'MediaFileUri': f's3://{bucket_name}/{file_uri}'},
        'MediaFormat': 'mp4',
        'LanguageCode': language_code,
        'OutputBucketName': bucket_name
    }
    
    if model_name:
        settings['ModelSettings'] = {'LanguageModelName': model_name}

    try:
        client.start_transcription_job(**settings)
    except Exception as e:
        logging.info(f"Error starting transcription job: {e}")
        return None
    
    MAX_RETRIES = 1000
    retries = 0

    while retries < MAX_RETRIES:
        status = client.get_transcription_job(TranscriptionJobName=job_name)
        if status['TranscriptionJob']['TranscriptionJobStatus'] in ['COMPLETED', 'FAILED']:
            return status
        time.sleep(10)
        retries += 1
    
    logging.info("Maximum retries reached. Check the transcription job manually.")
    return None



def convert_transcript_to_srt(transcript, TARGET_LANGUGAGE):
    content = json.loads(transcript)
    items = content['results']['items']

    srt_content = ''
    index = 1
    phrase_start_time = None
    last_word_end_time = None
    phrase = ''

    MAX_SUBTITLE_DURATION = 7.0  # Maximum duration for a subtitle in seconds

    for item in items:
        if item["type"] == "punctuation":
            phrase += item["alternatives"][0]["content"]
            
            # Check if the punctuation is a sentence end or if the duration exceeds the maximum
            end_condition = (
                item["alternatives"][0]["content"] in ['.', '!', '?'] or
                (last_word_end_time - phrase_start_time) > MAX_SUBTITLE_DURATION
            )
            
            if end_condition and phrase_start_time is not None:
                translated_phrase = translate_text(phrase.strip(), TARGET_LANGUGAGE)
                srt_content += f"{index}\n"
                srt_content += f"{str(timedelta(seconds=phrase_start_time)).split('.')[0]},{int(phrase_start_time*1000)%1000:03} --> "
                srt_content += f"{str(timedelta(seconds=last_word_end_time)).split('.')[0]},{int(last_word_end_time*1000)%1000:03}\n"
                srt_content += phrase.strip() + "\n\n"
                index += 1
                phrase = ''
                phrase_start_time = None
        else:
            if phrase_start_time is None:
                phrase_start_time = float(item["start_time"])
            last_word_end_time = float(item["end_time"])
            phrase += item["alternatives"][0]["content"] + " "

    # Handle the case where the last sentence doesn't end with punctuation
    if phrase.strip() != '':
        srt_content += f"{index}\n"
        srt_content += f"{str(timedelta(seconds=phrase_start_time)).split('.')[0]},{int(phrase_start_time*1000)%1000:03} --> "
        srt_content += f"{str(timedelta(seconds=last_word_end_time)).split('.')[0]},{int(last_word_end_time*1000)%1000:03}\n"
        srt_content += phrase.strip() + "\n\n"

    return srt_content






def extract_text_from_srt(srt_file_path):
    with open(srt_file_path, 'r', encoding='utf-8') as file:
        lines = file.readlines()
        text = ' '.join([line.strip() for line in lines if not line.strip().isdigit() and '-->' not in line])
    return text

def measure_similarity(text1, text2):
    vectorizer = CountVectorizer().fit_transform([text1, text2])
    vectors = vectorizer.transform([text1, text2]).toarray()
    return cosine_similarity(vectors)[0, 1]

def evaluate_transcriptions(testing_folder):
    files = os.listdir(testing_folder)
    video_files = [file for file in files if file.endswith('.mp4')]
    total_similarity = 0

    for video_file in video_files:
        base_name = video_file[:-4]  # Removing '.mp4'
        srt_file_original = os.path.join(testing_folder, base_name + '.srt')

        if not os.path.exists(srt_file_original):
            logging.info(f"Original SRT file for {video_file} not found. Skipping...")
            continue
        
        # Upload and transcribe
        try:
            s3.upload_file(os.path.join(testing_folder, video_file), BUCKET_NAME, video_file)
            logging.info("File uploaded successfully!")
        except Exception as e:
            logging.info(f"File upload failed. Error: {e}")
            return

        
        result = transcribe_video_with_custom_model(base_name, video_file, BUCKET_NAME, LANGUAGE, 'Subtitles_model_german')

        if result['TranscriptionJob']['TranscriptionJobStatus'] == 'COMPLETED':
            transcript_uri = result['TranscriptionJob']['Transcript']['TranscriptFileUri']
            transcript_key = transcript_uri.split('/')[-1]
            transcript = boto3.client('s3').get_object(Bucket=BUCKET_NAME, Key=transcript_key)['Body'].read().decode()        
            srt_content_generated = convert_transcript_to_srt(transcript)

            srt_file_generated_path = os.path.join(testing_folder, base_name + '_generated.srt')
            with open(srt_file_generated_path, "w", encoding='utf-8') as srt_file:
                srt_file.write(srt_content_generated)

            # Extract text and measure similarity
            original_text = extract_text_from_srt(srt_file_original)
            generated_text = extract_text_from_srt(srt_file_generated_path)
            similarity = measure_similarity(original_text, generated_text)
            total_similarity += similarity
            logging.info(f"Similarity for {video_file}: {similarity:.2f}")
        else:
            logging.info(f"Transcription failed for {video_file}.")

    avg_similarity = total_similarity / len(video_files)
    logging.info(f"Average similarity across all videos: {avg_similarity:.2f}")


def main():
    # First, check and wait for the custom model to be ready.
    model_status = get_custom_model_status('Subtitles_model_german')
    MAX_RETRIES = 2000  
    retry_count = 0

    while model_status not in ['COMPLETED', 'FAILED']:
        if retry_count >= MAX_RETRIES:
            logging.info(f"Custom model 'Subtitles_model_german' did not reach 'COMPLETED' or 'FAILED' status after waiting for {MAX_RETRIES*30} seconds.")
            return
        logging.info(f"Custom model 'Subtitles_model_german' is in '{model_status}' status. Waiting for 30 seconds before checking again...")
        time.sleep(30)
        retry_count += 1
        model_status = get_custom_model_status('Subtitles_model_german')

    if model_status == 'FAILED':
        logging.info("Custom model 'Subtitles_model_german' failed to be ready for use. Exiting...")
        return

    # Once the custom model is ready, proceed with the transcription
    evaluate_transcriptions(TESTING_FOLDER)
    
    try:
        s3.upload_file(FILE_NAME, BUCKET_NAME, FILE_NAME)
        logging.info("File uploaded successfully!")
        logging.info("File uploaded to S3. Starting transcription...")
        base_name = FILE_NAME.rsplit('.', 1)[0]
        result = transcribe_video(base_name, FILE_NAME, BUCKET_NAME, LANGUAGE, 'Subtitles_model_german')
        #result = transcribe_video(base_name, FILE_NAME, BUCKET_NAME, LANGUAGE)

        if result['TranscriptionJob']['TranscriptionJobStatus'] == 'COMPLETED':
            logging.info("Transcription completed. Generating SRT...")
            transcript_uri = result['TranscriptionJob']['Transcript']['TranscriptFileUri']
            transcript_key = transcript_uri.split('/')[-1]
            transcript = boto3.client('s3').get_object(Bucket=BUCKET_NAME, Key=transcript_key)['Body'].read().decode()        
            srt_content = convert_transcript_to_srt(transcript, TARGET_LANGUGAGE)
            
            output_filename = f"{FILE_NAME.rsplit('.', 1)[0]}-aws.srt"
            with open(output_filename, "w") as srt_file:
                srt_file.write(srt_content)
            logging.info(f"SRT file generated as {output_filename}")
        else:
            logging.info("Transcription failed.")
    except Exception as e:
        logging.error(f"Error occurred: {e}")



     
    

if __name__ == '__main__':
    main()

