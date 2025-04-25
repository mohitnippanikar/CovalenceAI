import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import confusion_matrix, accuracy_score
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
import pickle

# Load the dataset
data = pd.read_csv('synthetic_access_data_10000.csv')

# Select only the needed columns
columns_to_use = ['user_role', 'department', 'employee_status', 'resource_type', 'resource_sensitivity', 'employee_join_date', 'past_violations', 'is_approved']
data = data[columns_to_use]

# Drop rows with missing values
data.dropna(inplace=True)

# Feature engineering: derive time spent in months
current_date = pd.to_datetime('today')
data['employee_join_date'] = pd.to_datetime(data['employee_join_date'], errors='coerce')
data.dropna(subset=['employee_join_date'], inplace=True)
data['time_spent_months'] = (current_date - data['employee_join_date']).dt.days // 30

# Drop the original 'employee_join_date'
data.drop('employee_join_date', axis=1, inplace=True)

label_encoders = {}
categorical_cols = ['user_role', 'department', 'employee_status', 'resource_type', 'resource_sensitivity']
for col in categorical_cols:
    le = LabelEncoder()
    data[col] = le.fit_transform(data[col])  # Fit on original strings
    label_encoders[col] = le  # Save the encoder

    
# Define features and target
X = data.drop('is_approved', axis=1)
y = data['is_approved']

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Define models to train
models = {
    'Logistic Regression': LogisticRegression(max_iter=1000),
    'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
    'SVM': SVC(probability=True, random_state=42),
    'KNN': KNeighborsClassifier()
}

accuracies = {}

# Train and evaluate models
for name, model in models.items():
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    accuracies[name] = acc

    # Plot confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    plt.figure(figsize=(5, 4))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
    plt.title(f'{name} - Confusion Matrix')
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.show()

# Print all accuracies
print("\nModel Accuracies:")
for name, acc in accuracies.items():
    print(f"{name}: {acc:.4f}")

# Save the model and encoders
with open('random_forest_model_new.pkl', 'wb') as model_file:
    pickle.dump(models['Random Forest'], model_file)

with open('label_encoders.pkl', 'wb') as encoders_file:
    pickle.dump(label_encoders, encoders_file)