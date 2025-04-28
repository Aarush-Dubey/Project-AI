import copy
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from game_2048 import Game2048

class GreedyAgent:
    """
    A simple greedy AI that chooses the move with the highest immediate score gain.
    """
    def __init__(self, game: Game2048):
        self.game = game

    def get_best_move(self) -> str:
        """
        Evaluate all four moves and return the direction that yields the highest immediate score gain.
        Returns None if no valid moves.
        """
        best_move = None
        best_gain = -1
        # Try each direction
        for direction in ['left', 'right', 'up', 'down']:
            # Deep copy the game to simulate
            sim = copy.deepcopy(self.game)
            moved = sim.move(direction)
            if not moved:
                continue
            # Score gain from this move
            gain = sim.score - self.game.score
            if gain > best_gain:
                best_gain = gain
                best_move = direction
        return best_move


def play_greedy() -> Game2048:
    """
    Play a full game using the GreedyAgent until no moves remain.
    Returns the final game state.
    """
    game = Game2048()
    agent = GreedyAgent(game)  # Use GreedyAgent here, not GreedyAI
    move_count = 0

    print("Initial Board:")
    print(game)

    while not game.game_over:
        move = agent.get_best_move()
        if move is not None:
            game.move(move)
            move_count += 1
            print(f"Move {move_count}: {move}")
            print(game)
        else:
            print("No valid moves found!")
            break

    print(f"Game over! Final score: {game.score}")
    return game

if __name__ == "__main__":
    play_greedy()
