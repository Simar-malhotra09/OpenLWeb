import pandas as pd
import os
import argparse
from datetime import date

def file_exists(path: str) -> bool:
    return os.path.exists(path)

class Data_Logger:
    def __init__(self, path: str):
        self.path = path

    def make_file(self):
        if not file_exists(self.path):
            df = pd.DataFrame(columns=["Name", "Tag", "Link", "Date Added"])
            df.to_csv(self.path, index=False)

    def add_entry(self, raw: str):
        entries = [e.strip() for e in raw.split(";")]
        rows = []
        for entry in entries:
            fields = [f.strip() for f in entry.split(",")]
            if len(fields) < 4 or fields[3].lower() == "today":
                fields = fields[:3] + [str(date.today())]
            rows.append(fields)
        df = pd.DataFrame(rows, columns=["Name", "Tag", "Link", "Date Added"])
        df.to_csv(self.path, mode="a", index=False, header=not file_exists(self.path))
    
    def get_all_tags(self):

        if file_exists(self.path):
            df=pd.read_csv(self.path)
            return df["Tag"].unique()
        return[]

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-add", type=str, help="Add entry/entries: comma-delimited fields, semicolon-separated rows")
    parser.add_argument("-tags",action='store_true', help="Returns all existing tags")
    args = parser.parse_args()

    db = Data_Logger("data.csv")
    db.make_file()

    if args.add:
        db.add_entry(args.add)
    
    if args.tags:
        tags = db.get_all_tags()
        if tags.size > 0:
            print("Existing Tags:")
            print(tags)
        else:
            print("No tags found.")


