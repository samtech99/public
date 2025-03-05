import boto3
import sagemaker
from sagemaker import get_execution_role
from sagemaker.tensorflow import TensorFlow
import pandas as pd
from sklearn.preprocessing import StandardScaler


# Initialize SageMaker objects
sagemaker_session = sagemaker.Session()
role = 'arn:aws:iam::xxxx:role/SageMaker'


# Local file paths
age_file_path = 'sagemaker_train_data/cleaned_age.csv'
emotion_file_path = 'sagemaker_train_data/cleaned_emotion.csv'
gender_file_path = 'sagemaker_train_data/cleaned_gender.csv'
female_features_path = 'sagemaker_train_data/female_features.csv'
male_features_path = 'sagemaker_train_data/male_features.csv'

BUCKET_NAME = 'videos-9bp1cglp2mau'
training_data_uri = f's3://{BUCKET_NAME}/SageMaker/training/data'
training_script_uri = f's3://{BUCKET_NAME}/SageMaker/training/train_script.py'

def upload_to_s3(local_path, s3_path, bucket_name):
    s3_client = boto3.client('s3')
    s3_client.upload_file(local_path, bucket_name, s3_path)

upload_to_s3('train_script.py', 'SageMaker/training/train_script.py', BUCKET_NAME)
upload_to_s3('sagemaker_train_data/cleaned_age.csv', age_file_path, BUCKET_NAME)
upload_to_s3('sagemaker_train_data/cleaned_emotion.csv', emotion_file_path, BUCKET_NAME)
upload_to_s3('sagemaker_train_data/cleaned_gender.csv', gender_file_path, BUCKET_NAME)

# Read datasets
df_age = pd.read_csv(age_file_path)
df_emotion = pd.read_csv(emotion_file_path)
df_gender = pd.read_csv(gender_file_path)
df_female_features = pd.read_csv(female_features_path)
df_male_features = pd.read_csv(male_features_path)

# Assuming you have a dictionary that maps the numerical column names to your existing feature names
column_name_mapping = {
    0: 'meanfreq',
    1: 'sd',
    2: 'median',
    3: 'Q25',
    4: 'Q75',
    5: 'IQR',
    6: 'skew',
    7: 'kurt',
    8: 'sp.ent',
    9: 'sfm',
    10: 'mode',
    11: 'centroid',
    12: 'meanfun',
    13: 'minfun',
    14: 'maxfun',
    15: 'meandom',
    16: 'mindom',
    17: 'maxdom',
    18: 'dfrange',
    19: 'modindx',
    20: 'label', 
}


##integration of other dataset
# Rename columns
df_female_features.rename(columns=column_name_mapping, inplace=True)
df_male_features.rename(columns=column_name_mapping, inplace=True)
columns_order = df_age.columns.tolist()

# Reorder columns to match the existing data
common_columns = set(columns_order).intersection(df_female_features.columns)
df_female_features = df_female_features[list(common_columns)]
df_male_features = df_male_features[list(common_columns)]


# Handle missing data (Example: Fill missing values with the mean of the column)
df_female_features.fillna(df_female_features.mean(), inplace=True)
df_male_features.fillna(df_male_features.mean(), inplace=True)

# Ensure all values are numeric
df_female_features = df_female_features.apply(pd.to_numeric, errors='coerce')
df_male_features = df_male_features.apply(pd.to_numeric, errors='coerce')

# Check for NaNs and fill them
df_female_features.fillna(df_female_features.mean(), inplace=True)
df_male_features.fillna(df_male_features.mean(), inplace=True)


# Convert all columns to float and handle missing data
df_female_features = df_female_features.apply(pd.to_numeric, errors='coerce').fillna(df_female_features.mean())
df_male_features = df_male_features.apply(pd.to_numeric, errors='coerce').fillna(df_male_features.mean())

# Inspect the DataFrame (optional, for debugging)
print(df_female_features.head())
print(df_female_features.isnull().sum())  # Check for NaN values
print(df_female_features.dtypes)  # Check data types

# Feature Scaling
scaler = StandardScaler()
df_female_features_scaled = scaler.fit_transform(df_female_features)
df_male_features_scaled = scaler.fit_transform(df_male_features)

# Label Encoding
encoder = LabelEncoder()
df_female_features['labels'] = encoder.fit_transform(df_female_features['labels'])
df_male_features['labels'] = encoder.fit_transform(df_male_features['labels'])


# Now apply scaling
scaler = StandardScaler()
df_female_features_scaled = scaler.fit_transform(df_female_features)
df_male_features_scaled = scaler.fit_transform(df_male_features)

# Feature Scaling (Example: Standardize features)
from sklearn.preprocessing import StandardScaler
scaler = StandardScaler()
df_female_features_scaled = scaler.fit_transform(df_female_features)
df_male_features_scaled = scaler.fit_transform(df_male_features)

# Label Encoding (Example: Encode the 'labels' column)
from sklearn.preprocessing import LabelEncoder
encoder = LabelEncoder()
df_female_features['labels'] = encoder.fit_transform(df_female_features['labels'])
df_male_features['labels'] = encoder.fit_transform(df_male_features['labels'])

# Concatenate along the columns
combined_df = pd.concat([df_age, df_emotion, df_gender], axis=1)

# Remove any duplicate columns (e.g., if all dataframes have an 'id' column)
combined_df = pd.concat([df_age, df_emotion, df_gender, df_female_features, df_male_features], axis=1)

# Remove any duplicate columns (e.g., if all dataframes have an 'id' column)
combined_df = combined_df.loc[:,~combined_df.columns.duplicated()]

# Save the combined DataFrame to a CSV
combined_file_path = 'sagemaker_train_data/combined_data.csv'
combined_df.to_csv(combined_file_path, index=False)

upload_to_s3('sagemaker_train_data/combined_data.csv', 'SageMaker/training/data/combined_data.csv', BUCKET_NAME)

# Configure the training job
estimator = TensorFlow(
    entry_point='train_script.py',  # Your training script
    role=role,
    instance_count=1,
    instance_type='ml.m5.xlarge',
    framework_version='2.4.1',  # Ensure this matches the TF version in your script
    py_version='py37',  # Python version
    hyperparameters={
        'learning_rate': 0.001,
        'batch_size': 16,
        'epochs': 20,
        'optimizer': 'adam',
        'momentum': 0.9,
        'evaluation_metric': 'F1',
    },
    input_mode='File',
    sagemaker_session=sagemaker_session
)

# Train the model
estimator.fit({
    'train_combined': f's3://{BUCKET_NAME}/SageMaker/training/data/combined_data.csv'
})


