"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";  // For redirecting after login
import axios from "axios";

const API_BASE_URL = "http://localhost:8080";

const Login = () => {
    const { toast } = useToast();
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/user/signin`, {
                username,
                password,
            });

            const { token,userId } = response.data;
            localStorage.setItem("authToken", token); // Save token in localStorage
            localStorage.setItem("userId", userId); // Save token in localStorage

            toast({
                title: "Success",
                description: "Logged in successfully",
            });

            // Get the page user was trying to access before login, or fallback to '/chatbot'
            const redirectTo = localStorage.getItem("redirectTo") || "/chatbot";
            router.push(redirectTo);  // Redirect to the originally requested page
        } catch (error) {
            console.error("Error during login:", error);
            toast({
                title: "Error",
                description:
                    (axios.isAxiosError(error) && error.response?.data?.message) ||
                    "Invalid credentials",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="container mx-auto px-4 pt-24">
            <div className="max-w-md mx-auto p-6 border rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-6">User Login</h1>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <Input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <Button className="w-full" onClick={handleLogin} onKeyDown={(e) => e.key === "Enter" && handleLogin()}>
                        Login
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Login;
