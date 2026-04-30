from __future__ import annotations

from flask import Flask, jsonify, request
from flask_cors import CORS

from matching import recommend_gigs
from moderation import moderate_text


app = Flask(__name__)
CORS(app)


@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok"}), 200


@app.route("/api/ml/recommend", methods=["POST"])
def recommend():
    try:
        payload = request.get_json(silent=True)
        if payload is None:
            return jsonify({"error": "Request body must be valid JSON"}), 400

        user_skills = payload.get("user_skills", [])
        open_gigs = payload.get("open_gigs", [])
        recommendations = recommend_gigs(user_skills=user_skills, open_gigs=open_gigs)

        return jsonify({"recommendations": recommendations}), 200
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": "Failed to generate recommendations", "details": str(exc)}), 500


@app.route("/api/moderate", methods=["POST"])
def moderate():
    try:
        payload = request.get_json(silent=True)
        if payload is None:
            return jsonify({"error": "Request body must be valid JSON"}), 400

        text = payload.get("text", "")
        result = moderate_text(text)

        return jsonify(result), 200
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": "Failed to moderate text", "details": str(exc)}), 500


@app.errorhandler(404)
def not_found(_error):
    return jsonify({"error": "Route not found"}), 404


@app.errorhandler(405)
def method_not_allowed(_error):
    return jsonify({"error": "Method not allowed"}), 405


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)



# source venv/Scripts/activate
# python app.py