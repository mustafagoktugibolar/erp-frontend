import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:1004/api", // matches your Spring Boot backend
});
