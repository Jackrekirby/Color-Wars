# Color Wars

A recreation of the game Color Wars in the terminal, using Go.

## Dev Setup

`go run .`

`go build -o color_wars.exe`


## Notes

A has two options A1, A2
Next go, B has 4 options B11, B12, B21, B22
Assume next go, B will pick the option that maximises its score.
Therefore A has to pick the option that has the highest minimum score.

Example 1:
Option = Score
A1 = 3              A2 = 5
B11 = 1 B12 = 5     B21 = 2 B22 = 4

Assuming B plays optimally, A should pick A2 because B can only get a maximum of 4 with B21.