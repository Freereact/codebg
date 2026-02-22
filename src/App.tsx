import { Button } from './components/ui/button'

export default function App() {
  return (
    <main className="min-h-screen px-6 py-20">
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-700 bg-panel/80 p-10 shadow-2xl">
        <p className="mb-4 inline-block rounded-full border border-accent/40 px-3 py-1 text-xs tracking-wide text-accent">
          CodeBG • Web Development
        </p>
        <h1 className="text-4xl font-semibold leading-tight text-title md:text-5xl">Simple, fast web development for everyone.</h1>
        <p className="mt-5 max-w-2xl text-slate-300">
          We build low-maintenance websites and products with React + TypeScript. Minimal overhead, clean engineering, quick iterations.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg">Start a Project</Button>
          <Button variant="ghost" size="lg">See Services</Button>
        </div>
      </div>
    </main>
  )
}
