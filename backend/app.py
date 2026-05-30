from flask import Flask, request, jsonify

from flask_cors import CORS

import joblib

app = Flask(__name__)

CORS(app)

# LOAD MODEL

model = joblib.load("model.pkl")

vectorizer = joblib.load("vectorizer.pkl")

# HOME ROUTE

@app.route("/")

def home():

    return "TruthGuard AI Backend Running"

# PREDICTION ROUTE

@app.route("/predict", methods=["POST"])

def predict():

    data = request.json

    news = data["news"]

    transformed_news = vectorizer.transform([news])

    prediction = model.predict(transformed_news)[0]

    return jsonify({
        "prediction": prediction
    })

# RUN SERVER

if __name__ == "__main__":

    app.run(debug=True)