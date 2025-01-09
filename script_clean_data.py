
data_file = "data.txt"


with open(data_file, 'r') as file:
    data= file.read().splitlines()
    data_dict_g=[]
    for d in data:
        title,link= d.split(",")
        data_dict={
            "title": title,
            "link": link
            
        }
        data_dict_g.append(data_dict)
print(data_dict_g)
    
