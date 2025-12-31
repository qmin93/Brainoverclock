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

@app.route('/api/score/chimp', methods=['POST'])
def save_chimp_score():
    data = request.json
    score = data.get('score')
    
    if score is None:
        return jsonify({"error": "Missing score"}), 400

    percentile = calculate_percentile('chimp_test', float(score))
    
    return jsonify({
        "status": "success",
        "game_type": "chimp_test",
        "score": score,
        "percentile": percentile
    })

@app.route('/api/score/chimp-hard', methods=['POST'])
def save_chimp_hard_score():
    data = request.json
    score = data.get('score')
    
    if score is None:
        return jsonify({"error": "Missing score"}), 400

    percentile = calculate_percentile('chimp_test_hard', float(score))
    
    return jsonify({
        "status": "success",
        "game_type": "chimp_test_hard",
        "score": score,
        "percentile": percentile
    })

@app.route('/api/score/type-flow', methods=['POST'])
def save_type_flow_score():
    data = request.json
    score = data.get('score') # WPM
    
    if score is None:
        return jsonify({"error": "Missing score"}), 400

    percentile = calculate_percentile('type_flow', float(score))
    
    return jsonify({
        "status": "success",
        "game_type": "type_flow",
        "score": score,
        "percentile": percentile
    })

@app.route('/api/score/verbal-hard', methods=['POST'])
def save_verbal_hard_score():
    data = request.json
    score = data.get('score')
    
    if score is None:
        return jsonify({"error": "Missing score"}), 400

    percentile = calculate_percentile('verbal_hard', float(score))
    
    return jsonify({
        "status": "success",
        "game_type": "verbal_hard",
        "score": score,
        "percentile": percentile
    })

@app.route('/api/score/visual-hard', methods=['POST'])
def save_visual_hard_score():
    data = request.json
    score = data.get('score')
    
    if score is None:
        return jsonify({"error": "Missing score"}), 400

    percentile = calculate_percentile('visual_hard', float(score))
    
    return jsonify({
        "status": "success",
        "game_type": "visual_hard",
        "score": score,
        "percentile": percentile
    })

@app.route('/api/score/aim-hard', methods=['POST'])
def save_aim_hard_score():
    data = request.json
    score = data.get('score')
    
    if score is None:
        return jsonify({"error": "Missing score"}), 400

    percentile = calculate_percentile('aim_hard', float(score))
    
    return jsonify({
        "status": "success",
        "game_type": "aim_hard",
        "score": score,
        "percentile": percentile
    })

@app.route('/api/score/stroop-hard', methods=['POST'])
def save_stroop_hard_score():
    data = request.json
    score = data.get('score')
    
    if score is None:
        return jsonify({"error": "Missing score"}), 400

    percentile = calculate_percentile('stroop_hard', float(score))
    
    return jsonify({
        "status": "success",
        "game_type": "stroop_hard",
        "score": score,
        "percentile": percentile
    })

@app.route('/api/score/n-back', methods=['POST'])
def save_n_back_score():
    data = request.json
    score = data.get('score')
    
    if score is None:
        return jsonify({"error": "Missing score"}), 400

    percentile = calculate_percentile('n_back', float(score))
    
    return jsonify({
        "status": "success",
        "game_type": "n_back",
        "score": score,
        "percentile": percentile
    })

@app.route('/api/score/schulte', methods=['POST'])
def save_schulte_score():
    data = request.json
    score = data.get('score')
    mode = data.get('mode', 'normal') # normal, dynamic, mixed
    
    if score is None:
        return jsonify({"error": "Missing score"}), 400

    game_id = f"schulte_{mode}"
    percentile = calculate_percentile(game_id, float(score))
    
    return jsonify({
        "status": "success",
        "game_type": game_id,
        "score": score,
        "percentile": percentile
    })

@app.route('/api/score/math-fall', methods=['POST'])
def save_math_fall_score():
    data = request.json
    score = data.get('score')
    
    if score is None:
        return jsonify({"error": "Missing score"}), 400

    percentile = calculate_percentile('math_fall', float(score))
    
    return jsonify({
        "status": "success",
        "game_type": "math_fall",
        "score": score,
        "percentile": percentile
    })

if __name__ == '__main__':
    # CRITICAL: Port 5328 as per plan
    app.run(host='0.0.0.0', debug=True, port=5328)
