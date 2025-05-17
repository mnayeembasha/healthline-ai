"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { drugs, Drug } from "@/data/drugs";

const Telemedicines = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);

    const filteredDrugs = drugs.filter(
        (drug) =>
            drug.drug_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            drug.medical_condition.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const { data: drugDetails } = useQuery({
        queryKey: ["drugDetails", selectedDrug?.drug_link],
        queryFn: async () => {
            if (!selectedDrug) return null;
            // In a real application, you would fetch the data from the drug_link
            // For now, we'll return the existing data
            return selectedDrug;
        },
        enabled: !!selectedDrug,
    });

    return (
        <div className="container mx-auto px-4 pt-24 pb-12">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 animate-fade-in">Telemedicines</h1>

                {/* Search Bar */}
                <div className="relative mb-8 animate-fade-in">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search by drug name or medical condition..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Drug List */}
                {!selectedDrug ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ">
                        {filteredDrugs.map((drug) => (
                            <Card
                                key={drug.id}
                                className="bg-gradient-to-tr from-blue-50 via-blue-100 to-blue-200 cursor-pointer hover:shadow-lg transition-shadow duration-300 animate-fade-in"
                                onClick={() => setSelectedDrug(drug)}
                            >
                                <CardHeader>
                                    <CardTitle className="text-lg">{drug.drug_name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-600">
                                            Condition: {drug.medical_condition}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Activity: {drug.activity}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Pregnancy Category: {drug.pregnancy_category}
                                        </p>
                                        {drug.rating && (
                                            <p className="text-sm text-gray-600">
                                                Rating: {drug.rating}/10 ({drug.no_of_reviews} reviews)
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    // Drug Details View
                    <div className="animate-fade-in">
                        <button
                            onClick={() => setSelectedDrug(null)}
                            className="mb-4 text-primary hover:underline"
                        >
                            ← Back to list
                        </button>
                        <Card>
                            <CardHeader>
                                <CardTitle>{drugDetails?.drug_name}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-semibold mb-2">Medical Condition</h3>
                                    <p>{drugDetails?.medical_condition}</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Description</h3>
                                    <p>{drugDetails?.medical_condition_description}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="font-semibold mb-2">Activity</h3>
                                        <p>{drugDetails?.activity}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">Pregnancy Category</h3>
                                        <p>{drugDetails?.pregnancy_category}</p>
                                    </div>
                                </div>
                                {drugDetails?.rating && (
                                    <div>
                                        <h3 className="font-semibold mb-2">Rating</h3>
                                        <p>
                                            {drugDetails.rating}/10 ({drugDetails.no_of_reviews}{" "}
                                            reviews)
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-semibold mb-2">More Information</h3>
                                    <a
                                        href={drugDetails?.drug_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        View on Drugs.com
                                    </a>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Telemedicines;