import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  BarChart2,
  Clock,
  MessageSquare,
  CheckCircle,
  Search,
  Shield,
  Zap,
  Database,
  Cpu,
  FileText,
  RefreshCw,
  Upload,
  Settings,
  HelpCircle
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-[#E31937]">PartsIQ</div>
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
                <span className="text-[#E31937]">Transform</span> Your Parts Documentation Into Instant, Reliable Answers
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Revolutionary AI-powered hybrid RAG system that extracts precise data from your PDF parts catalogs, service manuals, and technical documentation. Eliminate manual searches, reduce service delays, and empower your team with intelligent document intelligence.
              </p>
              <Link href="/login">
                <Button className="bg-[#E31937] hover:bg-[#c01730] text-white px-8 py-6 text-lg">
                  Start Your Free Trial Today <ArrowRight className="ml-2 h-5 w-5" />
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
                  <p className="text-gray-700">What brake pads fit a 2018 Honda Civic Si?</p>
                </div>
                <div className="bg-[#E31937] bg-opacity-10 rounded-lg p-4 mb-4">
                  <p className="text-gray-800">
                    For the 2018 Honda Civic Si, the compatible brake pads are part #45022-TGH-A01. These are OEM Honda pads with ceramic compound for reduced noise and dust. Aftermarket alternatives include Akebono ACT1521 and Brembo P28059N.
                    <span className="block mt-2 text-sm text-gray-600">Source: Honda Parts Catalog 2023, Page 47 | Confidence: 98.5%</span>
                  </p>
                </div>
                <div className="text-xs text-gray-500 text-right">Response time: 0.8s</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Stop Losing Time and Money on Manual Parts Lookups</h2>
          <p className="text-lg text-center text-gray-600 mb-10 max-w-4xl mx-auto">
            Your technicians waste hours digging through hundreds of PDF pages searching for part numbers, compatibility charts, and technical specifications. Every minute spent hunting through documentation is a minute not spent serving customers.
          </p>
          
          <div className="bg-white rounded-xl shadow-md p-8 max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold mb-4 text-[#E31937]">The hidden costs are staggering:</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-[#E31937] mr-2">•</span>
                <span>Service delays while technicians search multiple catalogs</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#E31937] mr-2">•</span>
                <span>Wrong parts ordered due to manual lookup errors</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#E31937] mr-2">•</span>
                <span>Customer frustration from extended wait times</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#E31937] mr-2">•</span>
                <span>New technician training bottlenecks</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#E31937] mr-2">•</span>
                <span>Inconsistent service quality across your team</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Introducing PartsIQ: AI That Speaks Your Parts Language</h2>
          <p className="text-lg text-center text-gray-600 mb-10 max-w-4xl mx-auto">
            Our hybrid RAG (Retrieval-Augmented Generation) system is purpose-built for the aftersales parts industry. Unlike generic AI tools, PartsIQ understands part hierarchies, cross-references, supersessions, and the complex relationships that make parts documentation challenging.
          </p>
          
          <div className="bg-gray-50 rounded-xl p-8 max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold mb-4">Ask natural language questions, get precise answers:</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-gray-800">"What brake pads fit a 2018 Honda Civic Si?"</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-gray-800">"Show me all superseded parts for engine code L15B7"</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-gray-800">"Find compatible alternators under $200 for this part number"</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-gray-800 italic">Every answer includes source citations with page references and confidence scores</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Precision-Engineered for Parts Excellence</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-[#E31937] bg-opacity-10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-[#E31937]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">99.7% PDF Data Accuracy</h3>
              <p className="text-gray-600">
                Advanced OCR and document parsing specifically tuned for technical parts documentation. Our AI extracts part numbers, specifications, and compatibility data with unprecedented precision.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-[#E31937] bg-opacity-10 rounded-full flex items-center justify-center mb-4">
                <Cpu className="h-6 w-6 text-[#E31937]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Hybrid RAG Architecture</h3>
              <p className="text-gray-600">
                Combines dense semantic search with sparse keyword matching for optimal results. Finds the right information even when parts are described with different terminology.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-[#E31937] bg-opacity-10 rounded-full flex items-center justify-center mb-4">
                <Database className="h-6 w-6 text-[#E31937]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Parts-Specific Intelligence</h3>
              <p className="text-gray-600">
                Deep understanding of automotive, industrial, and equipment parts ecosystems. Handles complex relationships like cross-references, supersessions, and compatibility.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-[#E31937] bg-opacity-10 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-[#E31937]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Multi-Document Synthesis</h3>
              <p className="text-gray-600">
                Intelligently connects information across your entire document library - parts catalogs, service bulletins, technical manuals, and compatibility charts.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-[#E31937] bg-opacity-10 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-[#E31937]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Enterprise Security & Compliance</h3>
              <p className="text-gray-600">
                Your proprietary parts data stays secure with on-premise deployment options, encrypted processing, and strict access controls. Full audit trails meet compliance requirements.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-[#E31937] bg-opacity-10 rounded-full flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-[#E31937]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Rapid Implementation</h3>
              <p className="text-gray-600">
                Upload your PDF catalogs and start getting intelligent answers within hours, not months. Seamless integration with existing systems through robust APIs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Industry Leaders Choose PartsIQ</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="w-12 h-12 bg-[#E31937] bg-opacity-10 rounded-full flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-[#E31937]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Eliminate Manual Searches Forever</h3>
              <p className="text-gray-600">
                No more flipping through hundreds of PDF pages or maintaining complex filing systems. Your team asks questions in plain English and gets instant, accurate answers with complete source documentation.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="w-12 h-12 bg-[#E31937] bg-opacity-10 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-[#E31937]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Slash Service Response Times</h3>
              <p className="text-gray-600">
                Instant access to cross-references, supersessions, and alternative parts keeps your technicians productive and customers satisfied. Resolve parts inquiries on the first call instead of promising callbacks.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="w-12 h-12 bg-[#E31937] bg-opacity-10 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-[#E31937]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Scale Your Expertise Instantly</h3>
              <p className="text-gray-600">
                Democratize your most experienced technicians' knowledge. New team members access the same level of parts intelligence from day one, reducing training time from weeks to days.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="w-12 h-12 bg-[#E31937] bg-opacity-10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-[#E31937]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Reduce Costly Parts Errors</h3>
              <p className="text-gray-600">
                Eliminate wrong part orders caused by manual lookup mistakes. Our AI cross-validates part compatibility and flags potential issues before they become expensive problems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof/Results Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Transforming Aftersales Performance Across Industries</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="text-4xl font-bold text-[#E31937] mb-2">85%</div>
              <h3 className="text-lg font-semibold mb-2">Faster Parts Lookups</h3>
              <p className="text-gray-600 text-sm">
                What used to take 15 minutes now takes 2 minutes.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="text-4xl font-bold text-[#E31937] mb-2">92%</div>
              <h3 className="text-lg font-semibold mb-2">Reduction in Parts Errors</h3>
              <p className="text-gray-600 text-sm">
                AI-powered validation catches compatibility issues.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="text-4xl font-bold text-[#E31937] mb-2">40%</div>
              <h3 className="text-lg font-semibold mb-2">Improved First-Call Resolution</h3>
              <p className="text-gray-600 text-sm">
                Resolve customer inquiries without callbacks.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="text-4xl font-bold text-[#E31937] mb-2">90</div>
              <h3 className="text-lg font-semibold mb-2">Days to ROI</h3>
              <p className="text-gray-600 text-sm">
                Measurable returns in under 3 months.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">From PDF Chaos to Intelligent Answers in 3 Simple Steps</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-xl relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-[#E31937] rounded-full flex items-center justify-center text-white font-bold">1</div>
              <div className="w-16 h-16 bg-[#E31937] bg-opacity-10 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Upload className="h-8 w-8 text-[#E31937]" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center">Upload Your Documents</h3>
              <p className="text-gray-600">
                Drag and drop your PDF parts catalogs, service manuals, and technical documentation. Our system handles complex layouts, tables, and multi-language content.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-[#E31937] rounded-full flex items-center justify-center text-white font-bold">2</div>
              <div className="w-16 h-16 bg-[#E31937] bg-opacity-10 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Settings className="h-8 w-8 text-[#E31937]" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center">AI Processing & Optimization</h3>
              <p className="text-gray-600">
                Our hybrid RAG system processes your documents, extracting and indexing every part number, specification, and relationship. Semantic understanding meets exact keyword matching.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-[#E31937] rounded-full flex items-center justify-center text-white font-bold">3</div>
              <div className="w-16 h-16 bg-[#E31937] bg-opacity-10 rounded-full flex items-center justify-center mb-4 mx-auto">
                <MessageSquare className="h-8 w-8 text-[#E31937]" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center">Ask Questions, Get Answers</h3>
              <p className="text-gray-600">
                Your team asks natural language questions and receives precise answers with source citations. No training required - if you can ask a question, you can use PartsIQ.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold mb-2 flex items-center">
                <HelpCircle className="h-5 w-5 text-[#E31937] mr-2" />
                What types of documents does PartsIQ handle?
              </h3>
              <p className="text-gray-600">
                PartsIQ processes all standard parts documentation including OEM catalogs, aftermarket parts books, service bulletins, technical manuals, compatibility charts, and cross-reference guides. We handle complex layouts, tables, diagrams, and multi-language content.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold mb-2 flex items-center">
                <HelpCircle className="h-5 w-5 text-[#E31937] mr-2" />
                How accurate is the data extraction?
              </h3>
              <p className="text-gray-600">
                Our system achieves 99.7% accuracy on parts data extraction, specifically tuned for technical documentation. Every answer includes confidence scores and source citations so you can verify information when needed.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold mb-2 flex items-center">
                <HelpCircle className="h-5 w-5 text-[#E31937] mr-2" />
                Can it integrate with our existing systems?
              </h3>
              <p className="text-gray-600">
                Yes. PartsIQ offers robust APIs for integration with your ERP, parts management, or customer service systems. We also provide standalone web and mobile interfaces for immediate use.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold mb-2 flex items-center">
                <HelpCircle className="h-5 w-5 text-[#E31937] mr-2" />
                What about data security?
              </h3>
              <p className="text-gray-600">
                Your proprietary data never leaves your control. We offer on-premise deployment, encrypted processing, and enterprise-grade security controls. Full audit trails ensure compliance and accountability.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold mb-2 flex items-center">
                <HelpCircle className="h-5 w-5 text-[#E31937] mr-2" />
                How quickly can we get started?
              </h3>
              <p className="text-gray-600">
                Most customers see results within 24-48 hours of uploading their first documents. Full implementation typically takes less than a week, depending on document volume and integration requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Parts Operations?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join leading aftersales organizations who've eliminated manual searches and transformed their parts documentation workflow with AI-powered intelligence.
          </p>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Limited Time: Start your 30-day free trial with complete setup included. No upfront costs. No long-term contracts. See the impact on your operations before you commit.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <Link href="/login">
              <Button className="bg-[#E31937] hover:bg-[#c01730] text-white px-8 py-6 text-lg">
                Schedule Your Demo & Free Trial
              </Button>
            </Link>
            <Link href="/calculator">
              <Button className="bg-transparent border border-white hover:bg-white hover:text-black text-white px-8 py-6 text-lg transition-colors">
                Download ROI Calculator
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact/Footer */}
      <footer className="bg-gray-100 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-8">
            <h3 className="text-xl font-bold mb-4">Ready to discuss your specific parts documentation challenges?</h3>
            <p className="text-gray-600 mb-6">
              Our aftersales AI specialists understand the unique requirements of parts operations. Get a personalized consultation on how PartsIQ can transform your workflow.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="font-semibold text-[#E31937]">Call:</p>
                <p>1-800-PARTS-AI</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="font-semibold text-[#E31937]">Email:</p>
                <p>solutions@partsiq.com</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="font-semibold text-[#E31937]">Schedule:</p>
                <p>Book a 15-minute consultation</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 italic">
              Trusted by leading automotive dealers, equipment manufacturers, and industrial parts distributors worldwide.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center border-t border-gray-200 pt-8">
            <div className="mb-4 md:mb-0">
              <div className="text-xl font-bold text-[#E31937]">PartsIQ</div>
              <p className="text-sm text-gray-600">© 2025 PartsIQ, Inc. All rights reserved.</p>
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
