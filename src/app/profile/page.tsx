"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Login from "../login/page";
import { Card } from "@/components/ui/card";
import Image from "next/image";

const API_BASE_URL = "http://localhost:8080";

const Profile = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const router = useRouter();

  // Fetch the user's profile using the auth token
  const fetchUserProfile = async (token: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setIsLoggedIn(true);
      setUserData(response.data.user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setIsLoggedIn(false);
      localStorage.removeItem("authToken");
    }
  };

  // Redirect to login if not logged in, or fetch the user profile if logged in
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      fetchUserProfile(token);
    } else {
      // Store the current path in localStorage so it can be used to redirect after login
      localStorage.setItem("redirectTo", "/profile");
      router.push("/login"); // Redirect to login if not logged in
    }
  }, [router]);

  const handleLoginSuccess = (token: string) => {
    setIsLoggedIn(true);
    fetchUserProfile(token);
  };

  // Show login page if the user is not logged in
  if (!isLoggedIn) {
    return <Login/>;
  }

  // Show the profile if the user is logged in
  return (
    <div className="container mx-auto px-4 pt-24">
      <Card className="max-w-2xl mx-auto p-6 shadow-lg border-blue-200">
        <h1 className="text-3xl font-bold mb-6 text-center">Welcome, {userData?.username}!</h1>
        <div className="flex flex-col items-center space-y-6">
        <Image
          src="https://cdn-icons-png.flaticon.com/512/7915/7915522.png"
          alt="Icon"
          width={150}
          height={150}
        />
          <div className="w-full space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Location:</span>
              <span className="text-gray-800 font-semibold">{userData?.location}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Created At:</span>
              <span className="text-gray-800 font-semibold">
                {new Date(userData?.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-center">Medical Reports</h2>
          {userData?.reports?.length > 0 ? (
            <div className="space-y-4">
              {userData.reports.map((report: any, index: number) => (
                <Card
                  key={index}
                  className="p-4 border border-gray-300 rounded-lg shadow-md"
                >
                  <h3 className="font-medium">{report.disease}</h3>
                  <p className="text-sm text-gray-600">
                    Severity: {report.severity}%
                  </p>
                  <p className="text-sm text-gray-600">
                    Approved by: {report.doctor}
                  </p>
                  <p className="mt-2 text-gray-700">{report.diagnosis}</p>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center">No reports available</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Profile;
