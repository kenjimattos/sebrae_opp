import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SectionHero from '@/components/sections/SectionHero'

export default function Login() {

  return (
    <main className="min-h-screen bg-primary">
      <Header />

        <div className="container">
          <SectionHero />
        </div>

      <Footer />
    </main>
  )
}
