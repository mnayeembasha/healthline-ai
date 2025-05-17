

"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { metadata } from "./metadata";

export const pageMetadata = metadata;


export default function Home() {
  const faqs = [
    {
      question: "What is Healthline AI?",
      answer:
        "Healthline AI is a comprehensive healthcare platform that combines artificial intelligence with telemedicine to provide accessible and efficient healthcare services.",
    },
    {
      question: "How can I consult with a doctor?",
      answer:
        "You can easily schedule a consultation through our platform by visiting the Doctors page and selecting an available healthcare provider.",
    },
    {
      question: "Is my medical information secure?",
      answer:
        "Yes, we take data security seriously. All medical information is encrypted and stored securely following HIPAA guidelines.",
    },
    {
      question: "How does the AI chatbot work?",
      answer:
        "Our AI chatbot uses advanced natural language processing to provide initial health assessments and general medical information. It's available 24/7 for your convenience.",
    },
  ];


  return (


    <div className="min-h-screen">
      {/* Welcome Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Welcome to the Future of Healthcare
            </h1>
            <p className="text-xl text-gray-600">
              Experience personalized healthcare powered by artificial intelligence
              and telemedicine.
            </p>
            <Button size="lg" className="mt-8">
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">About Us</h2>
            <p className="text-gray-600">
              Healthline AI combines cutting-edge technology with healthcare
              expertise to deliver accessible, efficient, and personalized medical
              services. Our platform connects you with qualified healthcare
              providers while leveraging AI to enhance your healthcare experience.
            </p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Telemedicine",
                description:
                  "Connect with healthcare providers from the comfort of your home.",
              },
              {
                title: "AI-Powered Chat",
                description:
                  "Get instant responses to your health-related questions 24/7.",
              },
              {
                title: "Health Blog",
                description:
                  "Stay informed with the latest health news and medical insights.",
              },
            ].map((service) => (
              <div
                key={service.title}
                className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-4">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible>
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </div>



  );



}