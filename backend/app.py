from flask import Flask, jsonify, request
from flask_cors import CORS
from services.stats_service import calculate_percentile, STATS_DATA
from services.db_service import save_game_result, get_leaderboard
import uuid

app = Flask(__name__)
CORS(app)

def get_lower_is_better(game_type):
    if game_type in STATS_DATA:
        return STATS_DATA[game_type].get('lower_is_better', False)
    return False

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Flask backend is running!"})

@app.route('/api/leaderboard', methods=['GET'])
def leaderboard():
    game_type = request.args.get('game_type')
    if not game_type:
        return jsonify({"error": "Missing game_type"}), 400
    
    data = get_leaderboard(game_type)
    return jsonify(data)

@app.route('/api/cognitive/analyze', methods=['POST'])
def analyze():
    # This seems to be a general endpoint
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

def handle_score_submission(game_type, data):
    score = data.get('score')
    username = data.get('username')
    
    if score is None:
        return jsonify({"error": "Missing score"}), 400
    
    # User Identification Logic
    # 1. If username provided, use it (append random hash to make unique? or trust it?)
    #    For a simple leaderboard, let's treat username as unique ID or append session ID.
    #    Ideally frontend generates a UUID and stores in localStorage.
    # 2. If no username, generate random User ID.
    
    user_id = username if username else data.get('user_id')
    if not user_id:
        # Generate a temporary ID so it creates a new entry on leaderboard
        # NOTE: This means every anonymous game is a new player.
        # Ideally we want to aggregate sessions.
        user_id = f"Guest_{uuid.uuid4().hex[:6]}"
    
    # Save to DB
    lower_is_better = get_lower_is_better(game_type)
    db_result = save_game_result(user_id, game_type, float(score), lower_is_better)
    
    # Calculate Percentile (Old Logic)
    percentile = calculate_percentile(game_type, float(score))
    
    response = {
        "status": "success",
        "game_type": game_type,
        "score": score,
        "percentile": percentile,
        "leaderboard_rank": "TBD" # Could fetch rank if needed
    }
    
    if db_result:
        response['new_best'] = db_result['new_best']
        response['plays'] = db_result['plays']
        response['tier'] = db_result['tier']
        
    return jsonify(response)


# --- Game Specific Endpoints ---
# Refactored to use common handler

@app.route('/api/score/chimp', methods=['POST'])
def save_chimp_score():
    return handle_score_submission('chimp_test', request.json)

@app.route('/api/score/chimp-hard', methods=['POST'])
def save_chimp_hard_score():
    return handle_score_submission('chimp_test_hard', request.json)

@app.route('/api/score/type-flow', methods=['POST'])
def save_type_flow_score():
    return handle_score_submission('type_flow', request.json)

@app.route('/api/score/verbal-hard', methods=['POST'])
def save_verbal_hard_score():
    return handle_score_submission('verbal_hard', request.json)

@app.route('/api/score/visual-hard', methods=['POST'])
def save_visual_hard_score():
    return handle_score_submission('visual_hard', request.json)

@app.route('/api/score/aim-hard', methods=['POST'])
def save_aim_hard_score():
    return handle_score_submission('aim_hard', request.json)

@app.route('/api/score/stroop-hard', methods=['POST'])
def save_stroop_hard_score():
    return handle_score_submission('stroop_hard', request.json)

@app.route('/api/score/n-back', methods=['POST'])
def save_n_back_score():
    return handle_score_submission('n_back', request.json)

@app.route('/api/score/schulte', methods=['POST'])
def save_schulte_score():
    data = request.json
    mode = data.get('mode', 'normal')
    game_id = f"schulte_{mode}"
    return handle_score_submission(game_id, data)

@app.route('/api/score/math-fall', methods=['POST'])
def save_math_fall_score():
    return handle_score_submission('math_fall', request.json)

@app.route('/api/score/sequence-hard', methods=['POST'])
def save_sequence_hard_score():
    return handle_score_submission('sequence_hard', request.json)


if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5328)
