from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # 프론트엔드에서 요청 허용

# 임시 저장소 (나중에는 진짜 DB로 교체해야 함)
LEADERBOARD_DATA = [
    {"name": "Alpha", "score": 250, "tier": "Alien"},
    {"name": "Beta", "score": 120, "tier": "Chimp"},
]

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

# 1. 점수 저장하기 (프론트에서 이 주소로 점수를 보냄)
@app.route('/api/submit-score', methods=['POST'])
def submit_score():
    data = request.json
    # 데이터 받기
    new_record = {
        "name": data.get("name", "Unknown"), # 이름이 없으면 Unknown
        "score": data.get("score", 0),
        "tier": data.get("tier", "Beginner")
    }
    # 저장소에 추가
    LEADERBOARD_DATA.append(new_record)
    
    # 점수 높은 순으로 정렬
    LEADERBOARD_DATA.sort(key=lambda x: x['score'], reverse=True)
    
    return jsonify({"message": "Score saved!", "rank": LEADERBOARD_DATA.index(new_record) + 1})

# 2. 리더보드 보여주기
@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    return jsonify(LEADERBOARD_DATA[:10]) # 상위 10등까지만 보냄

if __name__ == '__main__':
    app.run(debug=True, port=5000)
