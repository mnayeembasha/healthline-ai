"use client";
import { useState } from "react";
import { Blog, blogs } from "@/data/blogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Search } from "lucide-react";

const Blogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [newBlog, setNewBlog] = useState({
    title: "",
    description: "",
    image: "",
  });
  const { toast } = useToast();

  const filteredBlogs = blogs.filter(
    (blog) =>
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRelatedBlogs = (currentBlog: Blog) => {
    return blogs
      .filter((blog) => blog.id !== currentBlog.id)
      .slice(0, 3);
  };

  const handleCreateBlog = () => {
    if (!newBlog.title || !newBlog.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        // variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Blog post created successfully!",
    });

    setNewBlog({ title: "", description: "", image: "" });
  };

  return (
    <div className="container mx-auto px-4 pt-24 pb-12">
      {!selectedBlog ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold">Health & Wellness Blog</h1>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search blogs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlogs.map((blog) => (
              <Card
                key={blog.id}
                className="hover:shadow-lg transition-shadow duration-300 cursor-pointer animate-fade-in"
                onClick={() => setSelectedBlog(blog)}
              >
                <img
                  src={blog.image}
                  alt={blog.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <CardHeader>
                  <CardTitle className="line-clamp-2">{blog.title}</CardTitle>
                  <CardDescription>By {blog.author}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-gray-600">
                    {blog.description}
                  </p>
                </CardContent>
                <CardFooter>
                  <p className="text-sm text-gray-500">{blog.date}</p>
                </CardFooter>
              </Card>
            ))}
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="mt-8">Create New Blog</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] animate-fade-in">
              <DialogHeader>
                <DialogTitle>Create New Blog Post</DialogTitle>
                <DialogDescription>
                  Fill in the details for your new blog post
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newBlog.title}
                    onChange={(e) =>
                      setNewBlog({ ...newBlog, title: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Content</Label>
                  <Textarea
                    id="description"
                    value={newBlog.description}
                    onChange={(e) =>
                      setNewBlog({ ...newBlog, description: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="image">Image URL</Label>
                  <Input
                    id="image"
                    value={newBlog.image}
                    onChange={(e) =>
                      setNewBlog({ ...newBlog, image: e.target.value })
                    }
                  />
                </div>
                <Button onClick={handleCreateBlog}>Create Blog</Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div className="animate-fade-in">
          <Button
            variant="ghost"
            onClick={() => setSelectedBlog(null)}
            className="mb-6"
          >
            ← Back to Blogs
          </Button>
          <article className="max-w-4xl mx-auto">
            <img
              src={selectedBlog.image}
              alt={selectedBlog.title}
              className="w-full h-[400px] object-cover rounded-lg mb-6"
            />
            <h1 className="text-4xl font-bold mb-4">{selectedBlog.title}</h1>
            <div className="flex items-center gap-4 mb-6">
              <p className="text-gray-600">By {selectedBlog.author}</p>
              <p className="text-gray-500">{selectedBlog.date}</p>
            </div>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">
                {selectedBlog.content}
              </p>
            </div>

            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {getRelatedBlogs(selectedBlog).map((blog) => (
                  <Card
                    key={blog.id}
                    className="hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                    onClick={() => setSelectedBlog(blog)}
                  >
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="w-full h-32 object-cover rounded-t-lg"
                    />
                    <CardHeader>
                      <CardTitle className="line-clamp-2 text-lg">
                        {blog.title}
                      </CardTitle>
                      <CardDescription>By {blog.author}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </article>
        </div>
      )}
    </div>
  );
};

export default Blogs;