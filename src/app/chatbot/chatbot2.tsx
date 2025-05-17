

// "use client";
// import { useState } from 'react';
// import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { useToast } from '@/components/ui/use-toast';
// import { Loader2 } from 'lucide-react';

// export default function GeminiImageAnalyzer() {
//   const { toast } = useToast();
//   const [image, setImage] = useState<File | null>(null);
//   const [previewUrl, setPreviewUrl] = useState<string>('');
//   const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
//   const [analysisResults, setAnalysisResults] = useState<
//     { type: 'image'; content: string; timestamp: string } | { type: 'analysis'; content: string; timestamp: string }[]
//   >([]);

//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     if (file.size > 4 * 1024 * 1024) {
//       toast({
//         title: "File too large",
//         description: "Please select an image under 4MB",
//         variant: "destructive"
//       });
//       return;
//     }

//     setImage(file);
//     setPreviewUrl(URL.createObjectURL(file));
//   };

//   const analyzeImage = async () => {
//     if (!image) return;

//     setIsAnalyzing(true);
//     const formData = new FormData();
//     formData.append('image', image);

//     try {
//       const response = await fetch('/api/analyze-image', {
//         method: 'POST',
//         body: formData
//       });

//       const data = await response.json();

//       if (response.ok) {
//         setAnalysisResults(prev => [
//           ...prev,
//           {
//             type: 'image',
//             content: previewUrl,
//             timestamp: new Date().toISOString()
//           },
//           {
//             type: 'analysis',
//             content: data.analysis,
//             timestamp: new Date().toISOString()
//           }
//         ]);

//         toast({
//           title: "Analysis Complete",
//           description: "Image analyzed successfully"
//         });
//       } else {
//         throw new Error(data.message);
//       }
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: error.message || "Failed to analyze image",
//         variant: "destructive"
//       });
//     } finally {
//       setIsAnalyzing(false);
//     }
//   };

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <Card className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-xl space-y-6">
//         <h1 className="text-3xl font-bold text-center mb-8 text-primary">
//           AI Image Analyzer
//         </h1>

//         <div className="space-y-4">
//           <div className="flex flex-col gap-2">
//             <label className="text-sm font-medium">
//               Upload an image to analyze:
//             </label>
//             <Input
//               type="file"
//               accept="image/*"
//               onChange={handleImageChange}
//               className="cursor-pointer"
//             />
//           </div>

//           {previewUrl && (
//             <div className="mt-4">
//               <img
//                 src={previewUrl}
//                 alt="Preview"
//                 className="max-h-64 mx-auto rounded-lg object-contain"
//               />
//             </div>
//           )}

//           <Button
//             onClick={analyzeImage}
//             disabled={!image || isAnalyzing}
//             className="w-full"
//           >
//             {isAnalyzing ? (
//               <>
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 Analyzing...
//               </>
//             ) : (
//               'Analyze Image'
//             )}
//           </Button>
//         </div>

//         <ScrollArea className="h-96 mt-6 rounded-lg border">
//           <div className="p-4 space-y-4">
//             {analysisResults.map((result, index) => (
//               <div
//                 key={index}
//                 className={`${
//                   result.type === 'image' ? 'flex justify-center' : 'p-3 bg-gray-50 rounded-lg'
//                 }`}
//               >
//                 {result.type === 'image' ? (
//                   <img
//                     src={result.content}
//                     alt="Analyzed"
//                     className="max-h-48 rounded-lg"
//                   />
//                 ) : (
//                   <div>
//                     <p className="text-sm text-gray-800">{result.content}</p>
//                     <p className="text-xs text-gray-500 mt-2">
//                       {new Date(result.timestamp).toLocaleTimeString()}
//                     </p>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         </ScrollArea>
//       </Card>
//     </div>
//   );
// }


