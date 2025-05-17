"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { API_BASE_URL } from "@/config";

const DoctorPortal = () => {
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [doctorData, setDoctorData] = useState<any>(null);
  const [pendingReports, setPendingReports] = useState<any[]>([]);

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/doctor/signin`,
        { username, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const { token, doctor } = response.data;

      if (doctor) {
        localStorage.setItem("doctorToken", token);
        localStorage.setItem("doctorId", doctor.id);
        setIsLoggedIn(true);
        setDoctorData(doctor);

        const reportsResponse = await axios.get(
          `${API_BASE_URL}/api/doctor/reports`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("doctorToken")}`,
            },
          }
        );
        const reports = reportsResponse.data.reports;
        setPendingReports(reports.pending);

        toast({
          title: "Success",
          description: "Logged in successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Invalid credentials",
          // variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: "An error occurred during login.",
        // variant: "destructive",
      });
    }
  };

  const handleApproveReport = (reportId: string) => {
    setPendingReports((prev) => prev.filter((report) => report.id !== reportId));
    toast({
      title: "Success",
      description: "Report approved successfully",
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 pt-24">
        <Card className="max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold mb-6">Doctor Login</h1>
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
            <Button className="w-full" onClick={handleLogin}>
              Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-24">
      <Card className="max-w-2xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Doctor Portal</h1>
          <p className="text-gray-600">Welcome, {doctorData.username}</p>
        </div>

        <div className="space-y-6">
          <PendingReports
            reports={pendingReports}
            onApprove={handleApproveReport}
          />
        </div>
      </Card>
    </div>
  );
};

const PendingReports = ({
  reports,
  onApprove,
}: {
  reports: any[];
  onApprove: (reportId: string) => void;
})=> {
  const [isOpen, setIsOpen] = useState(false); // State to control accordion toggle
  const [editable,setEditable] = useState(false);
  const toggleAccordion = () => {
    setIsOpen(!isOpen); // Toggle the state
  };
  const toggleEditable=()=>{
    setEditable(true);
  }
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Pending Reports</h2>
      {reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report, index) => (
            <Card key={index} className="p-4 border-blue-800">
              <div className="flex flex-col justify-between items-start">
                <div>
                  <h3 className="font-medium">Report Id: {report._id}</h3>
                  <h3 className="font-medium">
                    Patient Name: {report.userId.username}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Severity: {report.severity}%
                  </p>
                  {/* <div className="font-bold my-4 underline text-center">Complete Report</div>
                  <div className="p-4 rounded bg-gray-100" dangerouslySetInnerHTML={{ __html: report.report }} /> */}
                   <div>
      {/* Accordion Header */}
      <div
        className="font-bold my-4 underline text-center cursor-pointer"
        onClick={toggleAccordion} // Toggle on click
      >
        Complete Report
      </div>

      {/* Accordion Content (Visible when isOpen is true) */}
      {isOpen && !editable && (
        <div className="p-4 m-1 bg-gray-100" dangerouslySetInnerHTML={{ __html: report.report }} />
      )}
    </div>
                  {editable && <textarea
                    rows={8}
                    cols={60}
                    className="p-4 mt-4 bg-gray-200"
                    value={report.report}
                  >
                  </textarea>}
                </div>
                <Button
                  onClick={toggleEditable}
                  className="bg-gradient-to-b from-blue-400 to-blue-700"

                >
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No pending reports</p>
      )}
    </div>
  );
};

export default DoctorPortal;
