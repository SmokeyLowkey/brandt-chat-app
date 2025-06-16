import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, BarChart2, Clock, MessageSquare } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-[#E31937]">BRANDT</div>
          </div>
          <div>
            <Link href="/login">
              <Button className="bg-[#E31937] hover:bg-[#c01730] text-white">Login</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Enhance Customer Service with <span className="text-[#E31937]">AI-Powered Intelligence</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Our internal chatbot leverages company data to provide real-time, accurate information, significantly
                reducing customer call times and improving service quality.
              </p>
              <Link href="/login">
                <Button className="bg-[#E31937] hover:bg-[#c01730] text-white px-8 py-6 text-lg">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="md:w-1/2 md:pl-10">
              <div className="bg-white rounded-xl shadow-2xl p-6 border border-gray-100">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-700">How can I check the status of order #BG-29384?</p>
                </div>
                <div className="bg-[#E31937] bg-opacity-10 rounded-lg p-4 mb-4">
                  <p className="text-gray-800">
                    Order #BG-29384 was shipped yesterday via express delivery. Expected arrival is tomorrow by 5:00 PM.
                    The package contains all 5 items and has tracking number TRK-283947.
                  </p>
                </div>
                <div className="text-xs text-gray-500 text-right">Response time: 0.8s</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Benefits</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="w-12 h-12 bg-[#E31937] bg-opacity-10 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-[#E31937]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Reduced Call Times</h3>
              <p className="text-gray-600">
                Cut average call duration by up to 40% by providing instant access to accurate information.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="w-12 h-12 bg-[#E31937] bg-opacity-10 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-[#E31937]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Real-Time Data</h3>
              <p className="text-gray-600">
                Access up-to-date information from across all company systems in one unified interface.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="w-12 h-12 bg-[#E31937] bg-opacity-10 rounded-full flex items-center justify-center mb-4">
                <BarChart2 className="h-6 w-6 text-[#E31937]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Performance Insights</h3>
              <p className="text-gray-600">
                Track usage patterns and identify knowledge gaps to continuously improve customer service.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to transform your customer service?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join the Brandt team members already using our AI chatbot to deliver exceptional customer experiences.
          </p>
          <Link href="/login">
            <Button className="bg-[#E31937] hover:bg-[#c01730] text-white px-8 py-6 text-lg">Access Dashboard</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="text-xl font-bold text-[#E31937]">BRANDT</div>
              <p className="text-sm text-gray-600">© 2025 Brandt Group of Companies</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-600 hover:text-[#E31937]">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-600 hover:text-[#E31937]">
                Terms of Service
              </a>
              <a href="#" className="text-gray-600 hover:text-[#E31937]">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
