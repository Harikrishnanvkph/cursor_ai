export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">About AIChartor</h1>
            <p className="text-lg text-gray-600">Your AI-powered chart generation platform</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">What is AIChartor?</h2>
            <p className="text-gray-700 mb-6">
              AIChartor is an innovative platform that combines the power of artificial intelligence with intuitive chart creation tools. 
              Whether you're a data analyst, business professional, or student, our platform helps you transform raw data into 
              beautiful, insightful visualizations.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Key Features</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">AI Chat</h3>
                <p className="text-blue-800 text-sm">
                  Describe your data and let our AI suggest the perfect chart type and styling options.
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Advanced Editor</h3>
                <p className="text-green-800 text-sm">
                  Fine-tune your charts with our comprehensive manual editing tools and customization options.
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2">Multiple Chart Types</h3>
                <p className="text-purple-800 text-sm">
                  Support for bar charts, line charts, pie charts, scatter plots, and many more visualization types.
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-900 mb-2">Export Options</h3>
                <p className="text-orange-800 text-sm">
                  Download your charts in various formats including PNG, SVG, and PDF for presentations and reports.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Technology Stack</h2>
            <p className="text-gray-700 mb-4">
              Built with modern web technologies including Next.js, React, Tailwind CSS, and powered by advanced AI models 
              from Google Gemini, Perplexity AI, and OpenRouter.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Get Started</h2>
            <p className="text-gray-700 mb-6">
              Ready to create amazing charts? Try our AI Chat feature to get started, or dive directly into the 
              Advanced Editor for hands-on chart creation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/landing" 
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Try AI Chat
              </a>
              <a 
                href="/editor" 
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Open Editor
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
