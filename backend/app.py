from flask import Flask, jsonify, request
from flask_cors import CORS
from services.stats_service import calculate_percentile

app = Flask(__name__)
CORS(app)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Flask backend is running!"})

@app.route('/api/cognitive/analyze', methods=['POST'])
def analyze():
    data = request.json
    game_type = data.get('game_type')
    score = data.get('score')

    if not game_type or score is None:
        return jsonify({"error": "Missing game_type or score"}), 400

    percentile = calculate_percentile(game_type, float(score))
    
    return jsonify({
        "game_type": game_type,
        "score": score,
        "percentile": percentile,
        "message": f"You performed better than {percentile}% of users."
    })

if __name__ == '__main__':
    # CRITICAL: Port 5328 as per plan
    app.run(host='0.0.0.0', debug=True, port=5328)
