import pandas as pd

# Load the CSV file
df = pd.read_csv('MOCK_DATA.csv')

# Get unique departments
unique_departments = df['dept'].unique()

# Print the unique departments
print("Unique Departments:")
for department in unique_departments:
    print(department)
