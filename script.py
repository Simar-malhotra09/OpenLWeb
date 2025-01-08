
from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans
from sklearn.manifold import TSNE
import matplotlib.pyplot as plt
import math
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np 
import google.generativeai as genai
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


MAX_PROMPT_LENGTH= 2048

genai.configure(api_key=API_KEY)

class ClusterAnalyzer:
    def __init__(self, sentences_file: str, num_clusters_ratio: float = 0.15):
        self.sentences_file = sentences_file
        self.num_clusters_ratio = num_clusters_ratio
        self.model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        self.clusters = {}
        self.top_keywords_per_cluster_tfidf = []

    def load_sentences(self):
        """Loads sentences from a file."""
        with open(self.sentences_file, 'r') as file:
            self.sentences = file.read().splitlines()

    def generate_embeddings(self):
        """Generates sentence embeddings using the SentenceTransformer model."""
        self.embeddings = self.model.encode(self.sentences)

    def apply_kmeans(self):
        """Applies KMeans clustering to the sentence embeddings."""
        num_clusters = math.ceil(len(self.sentences) * self.num_clusters_ratio)
        kmeans = KMeans(n_clusters=num_clusters, random_state=42)
        kmeans_labels = kmeans.fit_predict(self.embeddings)
        
        for idx, label in enumerate(kmeans_labels):
            cluster_key = f"K-Means Cluster {label}"
            self.clusters.setdefault(cluster_key, []).append(self.sentences[idx])

    def extract_top_keywords(self):
        """Extracts top keywords per cluster using TF-IDF."""
        for cluster_id, cluster_sentences in self.clusters.items():
            tfidf_vectorizer = TfidfVectorizer(stop_words='english')
            tfidf_matrix = tfidf_vectorizer.fit_transform(cluster_sentences)
            feature_array = np.array(tfidf_vectorizer.get_feature_names_out())
            tfidf_sorting = np.argsort(tfidf_matrix.toarray().sum(axis=0))[::-1]
            top_keywords = feature_array[tfidf_sorting][:3]
            self.top_keywords_per_cluster_tfidf.append(top_keywords)

    def get_cluster_heads_from_response(self, response_text):
        """Extracts cluster headings from the model response."""
        lines = response_text.split("\n")
        parsed_clusters = {}

        for line in lines:
            if ":" in line:
                cluster, heading = line.split(":", 1)
                cluster_idx = cluster.split()[-1]
                if cluster_idx.isdigit():
                    parsed_clusters[cluster_idx] = heading.strip()

        return parsed_clusters

    def generate_prompt(self) -> str:
        """Generates the prompt based on clusters and keywords."""

        samples = []
        for (cluster, data), keywords in zip(self.clusters.items(), self.top_keywords_per_cluster_tfidf):
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

        prompt = """Please generate a specific thematic heading for each cluster that:
                    1. Reflects the primary field or domain indicated by both keywords and samples
                    2. Is specific enough to distinguish it from other clusters
                    3. Uses consistent terminology and style across all headings

                    For each cluster, output only:
                    Cluster number: <domain-specific heading>

                    Data:

        {} """
        
        return prompt.format("\n\n".join(samples))
    

    def separate_prompts(self, prompt: str) -> list:
        """
        Splits a large prompt into multiple smaller prompts that respect MAX_PROMPT_LENGTH.
        Each prompt maintains the structure and includes complete cluster information.
        """
        logger.debug(f"Starting prompt separation. Input prompt length: {len(prompt)}")
        
        parts = prompt.split("Data:")
        if len(parts) != 2:
            logger.error(f"Invalid prompt format. Expected 1 placeholder, found {len(parts)-1}")
            raise ValueError("Prompt must contain exactly one '{}' placeholder")
            
        instruction = parts[0].strip()
        logger.debug(f"Instruction part length: {len(instruction)}")
        
        samples = parts[1].strip().split("\n\n")
        logger.debug(f"Number of samples to process: {len(samples)}")
        
        prompt_template = instruction + "\n\n{}\n"
        available_length = MAX_PROMPT_LENGTH - len(prompt_template.format(""))
        logger.debug(f"Available length for samples: {available_length}")
        
        separated_prompts = []
        current_samples = []
        current_length = 0
        
        for i, sample in enumerate(samples):
            sample_length = len(sample) + 2  # +2 for newlines
            logger.debug(f"Processing sample {i+1}/{len(samples)}, length: {sample_length}")
            
            # If adding this sample would exceed the limit, create a new prompt
            if current_length + sample_length > available_length and current_samples:
                logger.debug(f"Length limit reached. Creating new prompt with {len(current_samples)} samples")
                # Create prompt with current samples
                prompt_content = "\n\n".join(current_samples)
                full_prompt = prompt_template.format(prompt_content)
                logger.debug(f"Created prompt length: {len(full_prompt)}")
                separated_prompts.append(full_prompt)
                
                # Reset for next prompt
                current_samples = [sample]
                current_length = sample_length
                logger.debug("Reset accumulator for next prompt")
            else:
                current_samples.append(sample)
                current_length += sample_length
                logger.debug(f"Added sample to current batch. Current length: {current_length}")
        
        # Add the last prompt if there are remaining samples
        if current_samples:
            logger.debug(f"Processing final batch with {len(current_samples)} samples")
            prompt_content = "\n\n".join(current_samples)
            full_prompt = prompt_template.format(prompt_content)
            logger.debug(f"Final prompt length: {len(full_prompt)}")
            separated_prompts.append(full_prompt)
        
        logger.debug(f"Finished processing. Created {len(separated_prompts)} separate prompts")
        return separated_prompts

    def combine_responses(self, cluster_heads: list) -> list:
        """
        Combines responses from multiple prompts into a single mapping of clusters to headings.
        
        """
        # combined_cluster_headings = {}

        # for k,v in cluster_heads[-1].items():
        #     combined_cluster_headings[k].append(v)
        
        return cluster_heads

    def fetch_cluster_heads(self, response_text):
        """Fetches cluster headings from the model's response."""
        return self.get_cluster_heads_from_response(response_text)

    def run(self):
        """
        Runs the complete clustering and heading generation process.
        
        """
        # Initialize clustering
        self.load_sentences()
        self.generate_embeddings()
        self.apply_kmeans()
        self.extract_top_keywords()

        if not self.clusters or not self.top_keywords_per_cluster_tfidf:
            raise ValueError("Clusters or keywords are empty.")

        
        prompt = self.generate_prompt()
        print(f"Generated prompt with length: {len(prompt)}")
        
        def get_model_response(prompt_text):
            """Helper function to handle model interaction"""
            try:
                model = genai.GenerativeModel("gemini-1.5-flash")
                response = model.generate_content(prompt_text)
                
                if not response or not response.text:
                    raise ValueError("No response received from the model")
                    
                print(f"Model Response:\n{response.text}")
                return self.fetch_cluster_heads(response_text=response.text)
                
            except Exception as e:
                print(f"Error in model generation: {e}")
                raise
        
        try:
            if len(prompt) > MAX_PROMPT_LENGTH:
                
                print(f"Prompt exceeds maximum length. Splitting into multiple prompts...")
                separated_prompts = self.separate_prompts(prompt)
                print(separated_prompts)
                responses = []
                
                for i, p in enumerate(separated_prompts, 1):
                    print(f"Processing prompt segment {i}/{len(separated_prompts)}")
                    cluster_heads = get_model_response(p)
                    responses.append(cluster_heads)
                
                final_cluster_heads = self.combine_responses(responses)
                print("Successfully combined responses from all prompts")
                return final_cluster_heads
            
            else:
                # Handle single prompt
                return get_model_response(prompt)
                
        except Exception as e:
            print(f"Error in clustering process: {str(e)}")
            raise

        finally:
            print("Clustering process completed")

if __name__ == "__main__":
        try:
            analyzer = ClusterAnalyzer(sentences_file='data.txt') 
            cluster_heads= analyzer.run()
            print("Final cluster headings:", cluster_heads)
        except ValueError as e:
            print(f"Validation error: {e}")
        except Exception as e:
            print(f"Unexpected error: {e}")



