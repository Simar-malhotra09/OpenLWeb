"use client";

import { useState, useEffect } from "react";

export default function AddDataForm() {
  const [formData, setFormData] = useState({
    id: "",
    user: "",
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  //   useEffect(() => {
  //     console.log(formData);
  //   }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        console.log("Data added successfully");
        // Optionally, reset the form or provide user feedback
      } else {
        console.error("Failed to add data");
      }
    } catch (error) {
      console.error("Error submitting data:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="id">Id:</label>
        <input
          type="text"
          id="id"
          name="id"
          value={formData.id}
          onChange={handleChange}
          required
          style={{ color: "#000" }}
        />
      </div>
      <div>
        <label htmlFor="user">User:</label>
        <input
          type="text"
          id="user"
          name="user"
          value={formData.user}
          onChange={handleChange}
          required
          style={{ color: "#000" }}
        />
      </div>
      <div>
        <label htmlFor="description">Description:</label>
        <input
          type="text"
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          style={{ color: "#000" }}
        />
      </div>
      <button type="submit">Add Data</button>
    </form>
  );
}
