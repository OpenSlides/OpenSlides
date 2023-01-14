import sys
import json

data = sys.stdin.read()
json_data = json.loads(data)
for collection, models in json_data.items():
    for model in models.values():
        for field in list(model.keys()):
            if field.startswith("meta_"):
                del model[field]

sys.stdout.write(json.dumps(json_data, separators=(',', ':')))
