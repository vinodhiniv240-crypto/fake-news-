import pandas as pd

from sklearn.feature_extraction.text import TfidfVectorizer

from sklearn.model_selection import train_test_split

from sklearn.linear_model import PassiveAggressiveClassifier

from sklearn.metrics import accuracy_score

import joblib

# LOAD DATASETS

fake = pd.read_csv("Fake.csv")

true = pd.read_csv("True.csv")

# ADD LABELS

fake["label"] = "FAKE"

true["label"] = "REAL"

# COMBINE DATASETS

data = pd.concat([fake, true])

# INPUT + OUTPUT

x = data["text"]

y = data["label"]

# CONVERT TEXT TO NUMBERS

vectorizer = TfidfVectorizer(
    stop_words="english",
    max_df=0.7
)

x_vectorized = vectorizer.fit_transform(x)

# TRAIN TEST SPLIT

x_train, x_test, y_train, y_test = train_test_split(
    x_vectorized,
    y,
    test_size=0.2,
    random_state=42
)

# MACHINE LEARNING MODEL

model = PassiveAggressiveClassifier(max_iter=50)

# TRAIN MODEL

model.fit(x_train, y_train)

# TEST MODEL

prediction = model.predict(x_test)

score = accuracy_score(y_test, prediction)

print("Accuracy:", score * 100)

# SAVE MODEL

joblib.dump(model, "model.pkl")

joblib.dump(vectorizer, "vectorizer.pkl")

print("Model Saved Successfully")