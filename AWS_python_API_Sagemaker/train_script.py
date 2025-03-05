import os
import boto3
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from tensorflow.keras.layers import Input
from tensorflow.keras import Model
import numpy as np


BUCKET_NAME = 'videos-xxxx'

def upload_to_s3(local_path, s3_path, bucket_name):
    s3_client = boto3.client('s3')
    s3_client.upload_file(local_path, bucket_name, s3_path)

def load_and_preprocess_data(csv_file):
    data = pd.read_csv(csv_file)
    print(data.columns) 
    # Assuming the features do not include any of the 'Unnamed: 0', 'Unnamed: 0.1', and 'X' columns
    non_feature_columns = ['Unnamed: 0', 'Unnamed: 0.1', 'X', 'label', 'label.1', 'label.2']
    X = data.drop(columns=non_feature_columns)
    
    # Assuming 'age_label', 'emotion_label', and 'gender_label' are the columns with the labels
    y_age = data['label']
    y_emotion = data['label.1']

    y_emotion = y_emotion.fillna('missing')

    y_gender = data['label.2']
    
    # Scale the features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Encode the labels to numerical values
    encoder_age = LabelEncoder()
    y_age_encoded = encoder_age.fit_transform(y_age)
    
    encoder_emotion = LabelEncoder()
    y_emotion_encoded = encoder_emotion.fit_transform(y_emotion)
    
    encoder_gender = LabelEncoder()
    y_gender_encoded = encoder_gender.fit_transform(y_gender)
    
    return X_scaled, y_age_encoded, y_emotion_encoded, y_gender_encoded



def train_and_save_combined_model(data_csv, output_dir, learning_rate, batch_size, epochs):
    # Unpack all four returned values
    X_scaled, y_age_encoded, y_emotion_encoded, y_gender_encoded = load_and_preprocess_data(data_csv)
    
    # Define the number of unique classes for each label
    num_classes_age = len(np.unique(y_age_encoded))
    num_classes_emotion = len(np.unique(y_emotion_encoded))
    num_classes_gender = len(np.unique(y_gender_encoded))

    # Define the model with multiple outputs
    input_layer = Input(shape=(X_scaled.shape[1],))
    shared_layer = Dense(64, activation='relu')(input_layer)
    output_age = Dense(num_classes_age, activation='softmax', name='output_age')(shared_layer)
    output_emotion = Dense(num_classes_emotion, activation='softmax', name='output_emotion')(shared_layer)
    output_gender = Dense(num_classes_gender, activation='softmax', name='output_gender')(shared_layer)

    # One-Hot Encode the labels
    y_age_encoded = tf.keras.utils.to_categorical(y_age_encoded, num_classes=num_classes_age)
    y_emotion_encoded = tf.keras.utils.to_categorical(y_emotion_encoded, num_classes=num_classes_emotion)
    y_gender_encoded = tf.keras.utils.to_categorical(y_gender_encoded, num_classes=num_classes_gender)

    model = Model(inputs=input_layer, outputs=[output_age, output_emotion, output_gender])

    model.compile(optimizer='adam', 
              loss={'output_age': 'categorical_crossentropy',
                    'output_emotion': 'categorical_crossentropy',
                    'output_gender': 'categorical_crossentropy'},
              metrics=['accuracy'])




    # You need to pass the labels in a dictionary as well
    model.fit(X_scaled, {'output_age': y_age_encoded, 'output_emotion': y_emotion_encoded, 'output_gender': y_gender_encoded}, epochs=epochs, batch_size=batch_size)
    
    # Save the model
    model.save(os.path.join(output_dir, 'combined_model.h5'))
    # Upload the model to S3
    upload_to_s3(os.path.join(output_dir, 'combined_model.h5'), 'SageMaker/combined_model.h5', BUCKET_NAME)



if __name__ == '__main__':
    training_dir_combined = os.environ['SM_CHANNEL_TRAIN_COMBINED']
    output_dir = os.environ['SM_MODEL_DIR']
    
    learning_rate = float(os.environ['SM_HP_LEARNING_RATE'])
    batch_size = int(os.environ['SM_HP_BATCH_SIZE'])
    epochs = int(os.environ['SM_HP_EPOCHS'])
    
    # Train and save the combined model
    train_and_save_combined_model(os.path.join(training_dir_combined, 'combined_data.csv'), output_dir, learning_rate, batch_size, epochs)
    
