import json
from datasets import load_dataset

ds = load_dataset(
    "rchiera/podcast-transcripts",
    data_files="data/transcripts.parquet"
)["train"]

episode_id = ds[0]["episode_id"]
one_episode = ds.filter(lambda x: x["episode_id"] == episode_id)

# Convert to serializable format
data = []
for row in one_episode:
    row = dict(row)
    for k, v in row.items():
        if hasattr(v, "isoformat"):  # catches datetime
            row[k] = v.isoformat()
    data.append(row)

with open("one_episode.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Saved!")