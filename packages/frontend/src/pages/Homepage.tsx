// packages/frontend/src/pages/Homepage.tsx
import React from "react";
import { Button } from "@/components/brace/Button";
import { Card } from "@/components/brace/Card";
import { ProductCard } from "@/components/brace/ProductCard";

const navItems = ["Home", "Systems", "Profile"];

const ArrowIcon = ({ direction }: { direction: "left" | "right" }) => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {direction === "left" ? <path d="M14 5 7 12l7 7" /> : <path d="m10 5 7 7-7 7" />}
  </svg>
);

const PlayIcon = () => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="h-5 w-5"
    fill="currentColor"
  >
    <path d="M8 5.5 19 12 8 18.5V5.5Z" />
  </svg>
);

export const Homepage = () => {
  return (
    <div className="font-sans bg-bg-light text-text-base">
      <header className="flex justify-between items-center px-6 py-4 bg-white shadow">
        <img src="/logo.svg" alt="Logo" className="h-6" />
        <nav className="flex gap-4">
          <Button variant="outline">Login</Button>
          <Button>Sign Up</Button>
        </nav>
      </header>

      <section className="px-6 py-10">
        <h1 className="text-h1 font-bold mb-6">Systems v1</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Example">
            <div className="aspect-video bg-bg-muted rounded-card flex items-center justify-center">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-accent rounded-full" />
                <div className="w-2 h-2 bg-accent opacity-50 rounded-full" />
                <div className="w-2 h-2 bg-accent opacity-50 rounded-full" />
              </div>
            </div>
          </Card>
          <div className="relative bg-bg-muted rounded-card h-48 flex items-center justify-center">
            <button
              type="button"
              aria-label="Previous slide"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center"
            >
              <ArrowIcon direction="left" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center"
            >
              <ArrowIcon direction="right" />
            </button>
            <button
              type="button"
              aria-label="Play example"
              className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center text-accent"
            >
              <PlayIcon />
            </button>
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        <h2 className="text-h2 font-bold mb-6">Detections v1</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <div className="aspect-square bg-bg-muted rounded-card" />
            </Card>
          ))}
        </div>
      </section>

      <section className="px-6 py-10">
        <ProductCard />
      </section>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-between md:hidden">
        {navItems.map((label) => (
          <button
            key={label}
            className="w-12 h-12 bg-bg-muted rounded-lg flex items-center justify-center text-sm font-semibold text-text-base"
            aria-label={`${label} navigation button`}
            type="button"
          >
            {label}
          </button>
        ))}
      </footer>
    </div>
  );
};

export default Homepage;
