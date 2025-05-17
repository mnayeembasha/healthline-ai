export interface Blog {
  id: number;
  title: string;
  author: string;
  description: string;
  image: string;
  date: string;
  content: string;
}

export const blogs: Blog[] = [
  {
    id: 1,
    title: "The Benefits of Telemedicine",
    author: "Dr. Emily Smith",
    description: "Learn how telemedicine is transforming healthcare by providing remote consultations and reducing travel times.",
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d",
    date: "2024-03-10",
    content: "Telemedicine has revolutionized the way we access healthcare services. With the advancement of technology, patients can now consult with healthcare providers from the comfort of their homes. This not only saves time but also makes healthcare more accessible to people in remote areas."
  },
  {
    id: 2,
    title: "Healthy Living Tips",
    author: "John Doe",
    description: "Explore practical tips for maintaining a healthy lifestyle, including diet, exercise, and stress management.",
    image: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7",
    date: "2024-03-09",
    content: "Living a healthy lifestyle doesn't have to be complicated. Simple changes in your daily routine can make a significant impact on your overall well-being. From maintaining a balanced diet to regular exercise and proper stress management, this guide will help you achieve your health goals."
  },
  {
    id: 3,
    title: "The Future of AI in Healthcare",
    author: "Dr. Sarah Johnson",
    description: "Discover how artificial intelligence is shaping the future of healthcare delivery and patient care.",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e",
    date: "2024-03-08",
    content: "Artificial Intelligence is transforming healthcare in unprecedented ways. From diagnostic assistance to personalized treatment plans, AI is helping healthcare providers make more accurate decisions and improve patient outcomes."
  }
];