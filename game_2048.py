import numpy as np
import random

class Game2048:
    def __init__(self, size=4):
        self.size = size
        self.grid = np.zeros((size, size), dtype=int)
        self.score = 0
        for _ in range(2):
            self.spawn_tile()

    def spawn_tile(self):
        empties = np.argwhere(self.grid == 0)
        if empties.size == 0:
            return
        r, c = tuple(random.choice(empties.tolist()))
        self.grid[r, c] = 4 if random.random() < 0.1 else 2

    @staticmethod
    def _process_row(row):
        nonzeros = row[row != 0]
        new = []
        skip = False
        score = 0
        for i in range(len(nonzeros)):
            if skip:
                skip = False
                continue
            if i + 1 < len(nonzeros) and nonzeros[i] == nonzeros[i + 1]:
                merged = nonzeros[i] * 2
                new.append(merged)
                score += merged
                skip = True
            else:
                new.append(nonzeros[i])
        # pad with zeros
        new += [0] * (len(row) - len(new))
        return np.array(new, dtype=int) , score

    def move(self, direction):
        """Move tiles in one of 'left','right','up','down'."""
        k = {'left': 0, 'up': 3, 'right': 2, 'down': 1}[direction]
        # rotate so that move is left
        g = np.rot90(self.grid, -k)
        moved = False
        new_grid = np.zeros_like(g)
        for i, row in enumerate(g):
            processed, gained_score = self._process_row(row)
            if not np.array_equal(processed, row):
                moved = True
            new_grid[i] = processed
            self.score += gained_score
        
        self.grid = np.rot90(new_grid, k)
        if moved:
            self.spawn_tile()
        return moved

    def can_move(self):
        if np.any(self.grid == 0):
            return True
        for g in (self.grid, self.grid.T):
            if np.any(g[:, :-1] == g[:, 1:]):
                return True
        return False

    @property
    def game_over(self):
        return not self.can_move()

    def __str__(self):
        sep = '+' + '----+' * self.size
        rows = []
        for row in self.grid:
            rows.append(sep)
            rows.append(''.join(f"|{num:^4}" if num else "|    " for num in row) + '|')
        rows.append(sep)
        rows.append(f"Score: {self.score}")
        return '\n'.join(rows)

# if __name__ == '__main__':
#     game = Game2048()
#     print(game)

#     move_map = {
#         'w': 'up',
#         'a': 'left',
#         's': 'down',
#         'd': 'right'
#     }

#     while not game.game_over:
#         move = input("Move (w/a/s/d): ").lower()
#         if move in move_map:
#             moved = game.move(move_map[move])
#             if moved:
#                 print(game)
#             else:
#                 print("Invalid move, try a different direction.")
#         else:
#             print("Invalid input! Use w/a/s/d to move.")

#     print("Game Over! Final score:", game.score)

