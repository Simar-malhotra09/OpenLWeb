import pandas as pd
import os
import argparse
from datetime import date

def file_exists(csv_path: str) -> bool:
    return os.csv_path.exists(csv_path)

class Data_Logger:

'''
csv_path: Here we store the raw data, it can be added simply by running `python data_logger.py -add 
    
    [NAME] Bad Beta, Good Beta, 
    [TAG] FINANCE/MARKET_NEUTRALITY,                                        *(can be nested)
    [LINK] https://papers.ssrn.com/sol3/papers.cfm?abstract_id=383420,
    [DATE] today                                                            *(this auto gets the date
    ;`                                                                       *(can add multiple objs seperated by `;`)
'''

    def __init__(self, csv_path: str):
        self.csv_path = csv_path

    def make_file(self):
        if not file_exists(self.csv_path):
            df = pd.DataFrame(columns=["Name", "Tag", "Link", "Date Added"])
            df.to_csv(self.csv_path, index=False)
    def add_entry(self, raw: str):
        entries = [e.strip() for e in raw.split(";")]
        rows = []
        for entry in entries:
            fields = [f.strip() for f in entry.split(",")]
            if len(fields) < 4 or fields[3].lower() == "today":
                fields = fields[:3] + [str(date.today())]
            rows.append(fields)
        df = pd.DataFrame(rows, columns=["Name", "Tag", "Link", "Date Added"])
        df.to_csv(self.csv_path, mode="a", index=False, header=not file_exists(self.csv_path))
    
'''
get_all_tags: Return list of all user generated tags

Next step: Instead of purely returing tags as list, we account for nested tags and return 
in a tree? respecting the heirarchy.

'''
    def get_all_tags(self):
        if file_exists(self.csv_path):
            df=pd.read_csv(self.csv_path)
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


