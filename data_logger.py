import pandas as pd
import os
import argparse
from datetime import date
import logging 

def file_exists(csv_path: str) -> bool:
    return os.path.exists(csv_path)

logging.basicConfig(
    level=logging.INFO,                      
    format="%(asctime)s - %(levelname)s - %(message)s", 
)

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
        self.tags = {}
        # Load tags from the file if it exists
        if file_exists(self.csv_path):
            self._load_tags()

    def _load_tags(self):
        """Load the tags from the CSV file and build the tag count."""
        df = pd.read_csv(self.csv_path)
        for tag_path in df["Tag"]:
            for tag in self.make_tags(tag_path):
                if tag not in self.tags:
                    self.tags[tag] = 0
                self.tags[tag] += 1

    def make_file(self):
        if not file_exists(self.csv_path):
            df = pd.DataFrame(columns=["Name", "Tag", "Link", "Date Added"])
            df.to_csv(self.csv_path, index=False)

    '''
    [TAG] can be nested, for example: FINANCE/MARKETS/BETA, which could include articles
    on beta neutrality for example. 

    For such a case, atmost 3 tags should be created implicitly:

    FINANCE
    FINANCE/MARKETS
    FINANCE/MARKETS/BETA
    '''
    def make_tags(self, parent_tag: str) -> list[str]:
        child_tags = parent_tag.split('/')
        tag_list = []
        current = ''
        for tag in child_tags:
            current = f"{current}/{tag}" if current else tag
            tag_list.append(current)
        return tag_list

    def add_entry(self, raw: str):
        entries = [e.strip() for e in raw.split(";")]
        rows = []
        for entry in entries:
            fields = [f.strip() for f in entry.split(",")]
            if len(fields) < 4 or fields[-1].lower() == "today":
                fields = fields[:3] + [str(date.today())]
            logging.info(f"Adding entry {fields} \n")

            tag_list = self.make_tags(fields[1])
            logging.info(f"Tags generated: {tag_list}\n")
            for tag in tag_list:
                if tag not in self.tags:
                    self.tags[tag] = 0
                self.tags[tag] += 1
            logging.info(f"self.tags: {self.tags}")

            rows.append(fields)
        df = pd.DataFrame(rows, columns=["Name", "Tag", "Link", "Date Added"])
        df.to_csv(self.csv_path, mode="a", index=False, header=not file_exists(self.csv_path))

    '''
    get_all_tags_and_count: Return list of all user generated tags and count
    get_all_tags_used: Return only tags where count>0

    Next step: Instead of purely returing tags as list, we account for nested tags and return 
    in a tree? respecting the heirarchy.
    '''
    def get_all_tags_used(self) -> list[str]:
        if file_exists(self.csv_path):
            df = pd.read_csv(self.csv_path)
            return df["Tag"].unique().tolist()
        return []

    def get_all_tags_and_count(self) -> dict:
        return self.tags


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-add", type=str, help="Add entry/entries: comma-delimited fields, semicolon-separated rows")
    parser.add_argument("-tags_used", action='store_true', help="Returns all tags with count >0")
    parser.add_argument("-tags", action='store_true', help="Returns all existing tags")

    args = parser.parse_args()

    db = Data_Logger("data.csv")
    db.make_file()

    if args.add:
        db.add_entry(args.add)
    
    if args.tags_used:
        tags = db.get_all_tags_used()
        if tags:
            print("Existing Tags:")
            print(tags)
        else:
            print("No tags found.")

    if args.tags:
        tag_counts = db.get_all_tags_and_count()
        if tag_counts:
            for tag, count in tag_counts.items():
                print(f'Tag: {tag} , count: {count}')
        else:
            print("No tags found")
