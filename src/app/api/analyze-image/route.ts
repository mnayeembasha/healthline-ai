// import { NextResponse } from "next/server";
// import { GoogleGenerativeAI } from "@google/generative-ai";

import { NextResponse } from "next/server";

// // Initialize Gemini API
// const genAI = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY! });

// export async function POST(request: Request) {
//   try {
//     const formData = await request.formData();
//     const imageFile = formData.get("image") as File;

//     if (!imageFile) {
//       return NextResponse.json(
//         { message: "No image provided" },
//         { status: 400 }
//       );
//     }

//     // Convert the image to bytes
//     const imageBytes = await imageFile.arrayBuffer();

//     // Initialize the Gemini Pro Vision model
//     const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

//     // Prepare the image data
//     const imageData = {
//       inlineData: {
//         data: Buffer.from(imageBytes).toString("base64"),
//         mimeType: imageFile.type,
//       },
//     };

//     // Send the request to the Gemini model
//     const result = await model.generateContent([imageData]);

//     // Assuming the model returns text content, this is how to handle it.
//     const response = await result.response;
//     const text = await response.text();

//     return NextResponse.json({ analysis: text }, { status: 200 });
//   } catch (error) {
//     console.error("Error processing image:", error);
//     return NextResponse.json(
//       { message: `Error processing image: ${error.message || error}` },
//       { status: 500 }
//     );
//   }
// }
export async function POST(request: Request) {
      return NextResponse.json({"message":"Image feature will be added soon"});
}