from flask import Flask, render_template, jsonify, request
import numpy as np
from game_2048 import Game2048
from agents.random_agent import random_move
from agents.greedy_agent import GreedyAgent

app = Flask(__name__)

# Global game instance
game = Game2048()

class RandomAgent:
    def __init__(self, game):
        self.game = game
        
    def get_best_move(self):
        return random_move()

# Helper function to convert numpy types to native Python types
def convert_to_native(obj):
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    return obj

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/new_game', methods=['POST'])
def new_game():
    global game
    game = Game2048()
    return jsonify({
        'board': game.grid.tolist(),
        'score': convert_to_native(game.score),
        'game_over': game.game_over
    })

@app.route('/move', methods=['POST'])
def move():
    global game
    direction = request.json.get('direction')
    if direction in ['up', 'down', 'left', 'right']:
        moved = game.move(direction)
        return jsonify({
            'board': game.grid.tolist(),
            'score': convert_to_native(game.score),
            'moved': moved,
            'game_over': game.game_over
        })
    return jsonify({'error': 'Invalid direction'}), 400

@app.route('/ai_move', methods=['POST'])
def ai_move():
    global game
    agent_type = request.json.get('agent')
    
    if agent_type == 'random':
        agent = RandomAgent(game)
    elif agent_type == 'greedy':
        agent = GreedyAgent(game)
    else:
        return jsonify({'error': 'Invalid agent type'}), 400
    
    move = agent.get_best_move()
    if move:
        moved = game.move(move)
        return jsonify({
            'board': game.grid.tolist(),
            'score': convert_to_native(game.score),
            'move': move,
            'moved': moved,
            'game_over': game.game_over
        })
    
    return jsonify({
        'board': game.grid.tolist(),
        'score': convert_to_native(game.score),
        'moved': False,
        'game_over': True
    })

@app.route('/auto_play', methods=['POST'])
def auto_play():
    global game
    agent_type = request.json.get('agent')
    game = Game2048()  # Start a new game
    
    if agent_type == 'random':
        agent = RandomAgent(game)
    elif agent_type == 'greedy':
        agent = GreedyAgent(game)
    else:
        return jsonify({'error': 'Invalid agent type'}), 400
    
    # Play and store each move's state
    move_history = [{
        'board': game.grid.tolist(),
        'score': convert_to_native(game.score),
        'move': None
    }]  # Initial state
    
    while not game.game_over:
        move = agent.get_best_move()
        if move is None:
            break
            
        moved = game.move(move)
        if not moved:
            break
            
        # Save this move's state
        move_history.append({
            'board': game.grid.tolist(),
            'score': convert_to_native(game.score),
            'move': move
        })
    
    return jsonify({
        'move_history': move_history,
        'final_score': convert_to_native(game.score),
        'game_over': True
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True) 