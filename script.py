import hdbscan
from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans
from sklearn.manifold import TSNE
import matplotlib.pyplot as plt
import math
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np 
import google.generativeai as genai



genai.configure(api_key=API_KEY)

def get_cluster_heads_from_response(response_text):
    lines = response_text.split("\n") 
    parsed_clusters = {}

    for line in lines:
        if ":" in line:
            cluster, heading = line.split(":", 1) 
            cluster_idx= cluster.split()[-1]
            if cluster_idx.isdigit():
                parsed_clusters[cluster_idx] = heading.strip()


    return parsed_clusters


'''Load model and generate embeddings for data'''

model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
with open('data.txt', 'r') as file:
    sentences = file.read().splitlines()

embeddings = model.encode(sentences)


''' Using K means using num_clusters= math.ceil(len(data ) * 0.15 being arbitraty '''
num_clusters=math.ceil(len(sentences)*0.15)

kmeans = KMeans(n_clusters = num_clusters, random_state=42)
kmeans_labels = kmeans.fit_predict(embeddings)
kmeans_clusters = {}
for idx, label in enumerate(kmeans_labels):
    cluster_key = f"K-Means Cluster {label}"
    kmeans_clusters.setdefault(cluster_key, []).append(sentences[idx])

# K-Means Results
# print("K-Means Results:")
# for cluster, items in kmeans_clusters.items():
#     print(f"{cluster}:")
#     for item in items:
#         print(f"  - {item}")

clusters = {i: [] for i in range(num_clusters)}
for idx, label in enumerate(kmeans_labels):
    clusters[label].append(sentences[idx])








''' 
Use TF-IDF to find representative terms to be used as assistance to the model 
hoping that the suggestion is reasonably plausible

'''
top_keywords_per_cluster_tfidf=[]
for cluster_id, cluster_sentences in clusters.items():
    tfidf_vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf_vectorizer.fit_transform(cluster_sentences)
    feature_array = np.array(tfidf_vectorizer.get_feature_names_out())
    tfidf_sorting = np.argsort(tfidf_matrix.toarray().sum(axis=0))[::-1]

    # Top keywords
    top_keywords = feature_array[tfidf_sorting][:3]  
    top_keywords_per_cluster_tfidf.append(top_keywords)





if not clusters or not top_keywords_per_cluster_tfidf:
    raise ValueError("Clusters or keywords are empty.")


if len(clusters) != len(top_keywords_per_cluster_tfidf):
    raise ValueError("Mismatch in lengths of clusters and keywords.")


''' Create some sample data that will be passed to the model '''

samples = []
for (cluster, data), keywords in zip(clusters.items(), top_keywords_per_cluster_tfidf):
    if isinstance(data, (list, tuple)):
        samples.append(
            f"Cluster number {cluster}, keywords for your assistance: {keywords},\n"
            f"data samples for this cluster:\n- {data[0]}\n- {data[1]}"
        )
    else:
        samples.append(
            f"Cluster number {cluster}, keywords for your assistance: {keywords}, "
            f"data samples are not iterable."
        )


if not samples:
    raise ValueError("Samples list is empty after processing.")



# Define a prompt template
prompt = """Please generate a broad heading that would apply to the following subset of examples or similar.

Important guidelines:
- Keep headings broad (e.g., "Website Issues" rather than "Loading Problems")
- Avoid specific details from the examples


Please only and only provide the below and not the prompt itself:
Cluster number : <heading> 

{} """


f_prompt = prompt.format("\n\n".join(samples))



print(f"Prompt Length: {len(f_prompt)}")
if len(f_prompt) > 2048: 
    print("Error: Prompt length exceeds maximum limit.")
    exit()

try:
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(f_prompt)

    if not response or not response.text:
        print("Error: No response from the model.")
        exit()

    print(f"Model Response: \n{response.text}")
except Exception as e:
    print(f"Error while generating content: {e}")
    exit()


if response and response.text:
    cluster_heads = get_cluster_heads_from_response(response_text=response.text)
    print(f"Cluster Heads: {cluster_heads}")
else:
    print("Error: Invalid or empty response text.")


