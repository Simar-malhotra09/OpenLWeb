# Define the input and output file paths
input_file = "data_new.txt"
output_file = "data_n.txt"

# Open the input file for reading and the output file for writing
with open(input_file, "r") as infile, open(output_file, "w") as outfile:
    for line in infile:
        # Split the line by ':' and remove the first part
        parts = line.split(":", 1)  # Use maxsplit=1 to ensure only one split
        if len(parts) > 1:  # Ensure there are at least two parts
            outfile.write(parts[1].strip() + "\n")  # Write the second part to the output file

print(f"Processed file saved as '{output_file}'.")
