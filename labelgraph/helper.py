rule_path = r"C:\Users\Simon\Desktop\SAFRANExplorer\workspace\rules\fb15k237-1000"
db_path = r"C:\Users\Simon\Desktop\SAFRANExplorer\SAFRAN\out\build\x64-Release\2021-04-18-14-10-12.db"

rules = {}

content = None
with open(rule_path) as infile:
    content = infile.readlines()
content = [x.strip() for x in content]

for line in content:
    predicted, correctlypredicted, conf, defin = line.split("\t")
    rules[defin] = (int(predicted), int(correctlypredicted))

print(len(rules))

import sqlite3
con = sqlite3.connect(db_path)
cur = con.cursor()
for row in cur.execute('SELECT ID, DEF FROM Rule').fetchall():
    if(row[1] not in rules):
        print("OHNO")
    else:
        cur.execute(f"update Rule set Predicted = {rules[row[1]][0]}, CorrectlyPredicted = {rules[row[1]][1]} WHERE ID = {row[0]}")
con.commit()
con.close()