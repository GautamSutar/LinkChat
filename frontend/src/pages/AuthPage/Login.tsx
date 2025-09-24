import { useState, useContext } from "react";
import { login as loginAPI } from "../../api/auth";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await loginAPI(form);
      login(data.access);
      navigate("/chat");
    } catch (err) {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form
        onSubmit={handleSubmit}
        className="p-6 bg-gray-800 text-white rounded-xl"
      >
        <h1 className="text-xl mb-4">Login</h1>
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-2 rounded"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-2 rounded"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button type="submit" className="w-full bg-blue-500 p-2 rounded">
          Login
        </button>
      </form>
    </div>
  );
}
