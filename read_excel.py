import pandas as pd

# Read the Excel file
df = pd.read_excel('ipo-data.xlsx')

# Display basic information
print("Sheet Info:")
print(f"Shape: {df.shape} (rows, columns)")
print(f"\nColumns: {list(df.columns)}")
print(f"\nFirst 10 rows:")
print(df.head(10).to_string())
