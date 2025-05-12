import os
import pandas as pd
import json


def file_exists(csv_path: str) -> bool:
    return os.csv_path.exists(csv_path)

class Graph:
    '''
    csv_path: Here we store the raw data, it can be added simply by running `python data_logger.py -add "
    [NAME] Bad Beta, Good Beta, 
    [TAG] FINANCE/MARKET_NEUTRALITY,
    [LINK] https://papers.ssrn.com/sol3/papers.cfm?abstract_id=383420,
    [DATE] today

    json_path: The graphing lib used expects data in form of nodes and links, in a json format, this class
    implements that using the raw data from the csv

    '''
    def __init__(self, csv_path: str, json_path: str):
        self.csv_path= csv_path
        self.json_path= json_path

    '''
    The graphing lib expects nodes and links, which can be list of dicts, where 
    each dict is referred to as the entry, in the json file:

    nodes (list):
    {
        id (required): unique id of each entry.
        user (required): this is irrelevant for now, defualt is `admin`.
        title (required): title of entry.
        link: link to webpage/local_storage/etc.
        type: Entry object or tag object. 
        
    }

    links (list):
    {
        source (required): the link originates for this node[id].
        target (required): the link points to this node[id].
    }

    So, in essence:
    1. each entry (eg whitepaper "good beta, bad beta" ) will have its own node
    2. each tag (eg FINANCE) will have its own node,
    3. each entry is linked with a tag, where source:entry, target:tag

    * Nested tags work as a tag linked to a tag,

    '''
    def make_file(self):




