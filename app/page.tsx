import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">I</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">IPO Tracker</h1>
                <p className="text-sm text-slate-500">Indian IPO Platform</p>
              </div>
            </div>
            <nav className="flex space-x-4">
              <Link href="/ipos" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition">
                Browse IPOs
              </Link>
              <Link href="/admin" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
                Admin Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-5xl font-extrabold text-slate-900 sm:text-6xl">
            Track Indian <span className="text-blue-600">IPOs</span>
          </h2>
          <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto">
            Stay updated with the latest Initial Public Offerings in India.
            Track subscriptions, listings, and manage your IPO applications.
          </p>

          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/ipos"
              className="px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/30"
            >
              View All IPOs
            </Link>
            <Link
              href="/admin"
              className="px-8 py-4 text-lg font-semibold text-slate-700 bg-white rounded-xl hover:bg-slate-50 transition border border-slate-200"
            >
              Admin Panel
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon="📊"
            title="Real-time Tracking"
            description="Monitor IPO subscriptions, listing prices, and status updates in real-time"
          />
          <FeatureCard
            icon="🎯"
            title="Smart Filtering"
            description="Filter IPOs by type, status, subscription levels, and more"
          />
          <FeatureCard
            icon="📱"
            title="Responsive Design"
            description="Access your IPO dashboard from any device, anywhere"
          />
        </div>
      </main>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </div>
  )
}
