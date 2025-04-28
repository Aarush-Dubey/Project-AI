import sys
import os
import random

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from game_2048 import Game2048

def random_move():
    """Randomly choose a direction to move."""
    return random.choice(['up', 'down', 'left', 'right'])

if __name__ == '__main__':
    game = Game2048()
    print(game)

    # Continue until the game is over
    while not game.game_over:
        valid_move_found = False
        tries = 0

        # Attempt up to 10 random moves to find a valid one
        while not valid_move_found and tries < 10:
            move = random_move()
            print(f"Trying: {move}")
            moved = game.move(move)  # Try the move
            if moved:  # Check if the move was valid and changed the game state
                print(f"Moving: {move}")
                print(game)
                valid_move_found = True
            else:
                tries += 1

        # If no valid move was found after 10 tries, print an error message
        if not valid_move_found:
            print("No valid random move found after 10 tries.")
            break  # Break the loop if no valid move is found

    print("Game Over! Final score:", game.score)
