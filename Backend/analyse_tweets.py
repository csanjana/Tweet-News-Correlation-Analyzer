import re
with open('/home/sanjana/cs410/project/sample_tweets.txt') as f:
	contents = f.readlines()
#print contents

processed_contents = []
for line in contents:
	if line =='\n':
		continue
	else:
		#p=re.compile(r'\<http.+?\>', re.DOTALL)
		line = re.sub(r'\<http.+?\>', '', line, flags=re.MULTILINE)
		print line
		processed_contents.append(line.strip('\n'))


