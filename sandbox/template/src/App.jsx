import React from "react";

const App = () => {
  return (
    <main className="min-h-screen bg-amber-100 flex items-center justify-center px-6">
      <section className="max-w-4xl mx-auto text-center">

        {/* Heading */}
        <h1 className="mt-10 text-5xl font-light leading-none tracking-[-0.05em] text-neutral-950 md:text-6xl lg:text-7xl">
          Turn ideas into
          <br />
          <span className="font-extrabold">beautiful interfaces</span>
        </h1>

        {/* Description */}
        <p className="mx-auto mt-8 max-w-2xl text-base leading-7 text-neutral-500 md:text-lg">
          Build production-ready React applications with natural language.
          Generate pages, components, and layouts instantly while previewing
          every change in real time.
        </p>

        {/* Buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">

          <button className="flex items-center gap-2 rounded-xl bg-neutral-950 px-7 py-3 text-base font-semibold text-white transition hover:bg-black">
            Preview
          </button>
        </div>
      </section>
    </main>
  );
};

export default App;