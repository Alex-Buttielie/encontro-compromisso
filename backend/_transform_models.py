"""Remove remaining db.Column lines from models.py."""
import re

with open('models.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

result = []
paren_depth = 0

for line in lines:
    stripped = line.strip()

    if paren_depth > 0:
        paren_depth += stripped.count('(') - stripped.count(')')
        if paren_depth <= 0:
            paren_depth = 0
        continue

    if re.match(r'^\s+\w+\s*=\s*db\.Column\(', line):
        paren_depth = stripped.count('(') - stripped.count(')')
        if paren_depth <= 0:
            paren_depth = 0
            continue
        continue

    result.append(line)

with open('models.py', 'w', encoding='utf-8') as f:
    f.writelines(result)

with open('models.py', 'r', encoding='utf-8') as f:
    content = f.read()
print('db.Column remaining:', content.count('db.Column'))
print('Lines:', len(content.splitlines()))
