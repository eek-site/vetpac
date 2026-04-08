import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PawPrint, Package, FileText, Settings, ChevronRight, Plus, Download, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import StatusBadge from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

const mockDogs = [
  {
    id: '1',
    name: 'Bella',
    breed: 'Labrador Retriever',
    age: '14 weeks',
    sex: 'Female',
    nextDose: { label: 'Dose 2 — C5', date: '15 May 2025', daysUntil: 12 },
    vaccStatus: 'in_progress',
    photo: '🐕',
  },
]

const mockOrders = [
  {
    id: 'VP-A1B2C3D4',
    dog: 'Bella',
    product: 'Puppy Starter Course',
    total: 229,
    status: 'shipped',
    date: '3 Apr 2025',
    tracking: 'NZP123456789',
    doses: [
      { label: 'Dose 1 — C5', status: 'delivered', date: '5 Apr 2025' },
      { label: 'Dose 2 — C5', status: 'scheduled', date: '15 May 2025' },
      { label: 'Dose 3 — C5', status: 'scheduled', date: '12 Jun 2025' },
    ],
  },
]

const tabs = [
  { id: 'dogs', label: 'My Dogs', icon: PawPrint },
  { id: 'orders', label: 'Orders & Doses', icon: Package },
  { id: 'records', label: 'Health Records', icon: FileText },
  { id: 'account', label: 'Account', icon: Settings },
]

function DogCard({ dog }) {
  const urgency = dog.nextDose?.daysUntil <= 7
  return (
    <Card hover className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-3xl">{dog.photo}</div>
          <div>
            <h3 className="font-display font-bold text-xl text-textPrimary">{dog.name}</h3>
            <p className="text-textMuted text-sm">{dog.breed} • {dog.age} • {dog.sex}</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-textMuted" />
      </div>

      {dog.nextDose && (
        <div className={`flex items-center gap-3 p-3 rounded-card ${urgency ? 'bg-warning/10 border border-warning/20' : 'bg-bg'}`}>
          {urgency ? <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" /> : <Clock className="w-4 h-4 text-primary flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-textPrimary">{dog.nextDose.label}</p>
            <p className="text-xs text-textMuted">Due {dog.nextDose.date} ({dog.nextDose.daysUntil} days)</p>
          </div>
          <Button size="sm" variant={urgency ? 'accent' : 'secondary'}>
            Track
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button variant="ghost" size="sm" className="text-xs">
          <Download className="w-3.5 h-3.5" /> Certificate
        </Button>
        <Button variant="ghost" size="sm" className="text-xs">
          <Calendar className="w-3.5 h-3.5" /> Schedule
        </Button>
      </div>
    </Card>
  )
}

function OrderRow({ order }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="border border-border rounded-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-bg transition-colors"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono font-semibold text-textPrimary text-sm">{order.id}</span>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-textMuted text-sm">{order.product} • {order.dog} • NZD ${order.total}</p>
          <p className="text-textMuted text-xs mt-0.5">{order.date}</p>
        </div>
        <ChevronRight className={`w-5 h-5 text-textMuted transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-border p-5 bg-bg space-y-4">
          {order.tracking && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-textPrimary">Tracking number</p>
                <p className="font-mono text-sm text-textMuted">{order.tracking}</p>
              </div>
              <Button size="sm" variant="secondary">Track shipment</Button>
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-textPrimary mb-3">Doses</p>
            <div className="space-y-2">
              {order.doses.map((dose, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 ${dose.status === 'delivered' ? 'text-success' : 'text-border'}`} />
                    <span className="text-sm text-textPrimary">{dose.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-textMuted">{dose.date}</span>
                    <StatusBadge status={dose.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Button variant="secondary" size="sm" fullWidth>Reorder / Book booster</Button>
        </div>
      )}
    </div>
  )
}

function HealthRecordsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-semibold text-xl text-textPrimary">Bella's health passport</h3>
          <Button size="sm" variant="secondary">
            <Download className="w-4 h-4" /> Download PDF
          </Button>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between py-3 border-b border-border text-sm">
            <span className="text-textSecondary">C5 Vaccine (Dose 1)</span>
            <span className="font-mono text-textPrimary">5 Apr 2025</span>
          </div>
          <div className="flex justify-between py-3 border-b border-border text-sm">
            <span className="text-textSecondary">Vet review (Dr. J. Smith)</span>
            <span className="font-mono text-textPrimary">4 Apr 2025</span>
          </div>
          <div className="flex justify-between py-3 text-sm">
            <span className="text-textSecondary">VOI issued</span>
            <span className="font-mono text-textPrimary">4 Apr 2025</span>
          </div>
        </div>
        <div className="mt-6">
          <Button variant="secondary" size="sm">
            <FileText className="w-4 h-4" /> Share with vet / boarding facility
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dogs')

  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <div className="max-w-content mx-auto px-4 sm:px-6 pt-24 pb-20">
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl text-textPrimary mb-1">My dashboard</h1>
          <p className="text-textMuted">Manage your dogs' health plans and orders.</p>
        </div>

        <div className="flex items-center gap-2 border-b border-border mb-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-all whitespace-nowrap
                  ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-textMuted hover:text-textPrimary'}`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {activeTab === 'dogs' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockDogs.map((dog) => <DogCard key={dog.id} dog={dog} />)}
              <Link to="/intake">
                <Card hover className="flex flex-col items-center justify-center gap-3 text-center min-h-[200px] border-2 border-dashed border-border bg-transparent shadow-none hover:border-primary-light hover:bg-primary/5">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-textPrimary">Add another dog</p>
                    <p className="text-textMuted text-sm">Start a new health intake</p>
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            {mockOrders.map((order) => <OrderRow key={order.id} order={order} />)}
          </div>
        )}

        {activeTab === 'records' && <HealthRecordsTab />}

        {activeTab === 'account' && (
          <Card>
            <h3 className="font-display font-semibold text-xl text-textPrimary mb-6">Account settings</h3>
            <div className="space-y-4 text-sm text-textSecondary">
              <p>Name: <span className="text-textPrimary font-medium">Demo User</span></p>
              <p>Email: <span className="text-textPrimary font-medium">demo@vetpac.co.nz</span></p>
              <p>Mobile: <span className="text-textPrimary font-medium">+64 21 000 0000</span></p>
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="secondary" size="sm">Edit profile</Button>
              <Button variant="ghost" size="sm" className="text-error hover:bg-error/5">Sign out</Button>
            </div>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  )
}
