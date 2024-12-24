
weights = [
    1, 2, 3, 2, 1,
    2, 5, 4, 5, 2,
    3, 4, 6, 4, 3,
    2, 5, 4, 5, 2,
    1, 2, 3, 2, 1,
]

search_pattern = ""
n = 6
for i in range(n, 0, -1):
    if i != n:
        search_pattern += f"// {i+1}\n"
    for y in range(5):
        for x in range(5):
            w = weights[x+y*5]
            if w == i:
                search_pattern += f"{x}, {y}, "

print(search_pattern)