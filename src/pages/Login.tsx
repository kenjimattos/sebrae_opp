import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SectionHero from '@/components/sections/SectionHero'

export default function Login() {

  return (
    <div className="min-h-screen bg-primary">
      <Header />

      <main className="mx-auto w-full max-w-[1440px] flex flex-col gap-2xl pb-3xl">
        <div id="hero">
          <SectionHero />
        </div>
      </main>

      <Footer />
    </div>
  )
}
