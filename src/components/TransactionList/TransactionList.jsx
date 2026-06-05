import { useState, useEffect } from 'react'
import { Car, Smartphone, ShoppingBag, Shirt, Tv, Coffee, HelpCircle, Loader2 } from 'lucide-react'
import './TransactionList.css'

export default function TransactionList({ budgetType, transactions = [], loading = false }) {
  const [filterType, setFilterType] = useState('All')

  // Keep filter synced with SpendCard selection, but allow manual overrides
  useEffect(() => {
    if (budgetType === 'Personal' || budgetType === 'Family') {
      setFilterType(budgetType)
    } else {
      setFilterType('All')
    }
  }, [budgetType])

  const categoryConfigs = {
    transport: { icon: Car, bgClass: 'category-coral', label: 'Transport' },
    tech: { icon: Smartphone, bgClass: 'category-purple', label: 'Technology' },
    grocery: { icon: ShoppingBag, bgClass: 'category-mint', label: 'Grocery' },
    fashion: { icon: Shirt, bgClass: 'category-pink', label: 'Fashion' },
    entertainment: { icon: Tv, bgClass: 'category-indigo', label: 'Entertainment' },
    food: { icon: Coffee, bgClass: 'category-yellow', label: 'Food & Dining' }
  }

  const filteredTx = filterType === 'All'
    ? transactions
    : transactions.filter(tx => tx.type.toLowerCase() === filterType.toLowerCase())

  return (
    <div className="transactions-card">
      <div className="transactions-header">
        <h2 className="transactions-title">Transactions</h2>

        {/* Filter Navigation Links */}
        <div className="filter-navlinks">
          {['All', 'Personal', 'Family'].map(tab => (
            <button
              key={tab}
              className={`filter-navlink-btn ${filterType === tab ? 'active' : ''}`}
              onClick={() => setFilterType(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="transactions-scroll-area">
        {loading ? (
          <div className="tx-loading-state">
            <Loader2 className="tx-spinner" size={24} />
            <span>Loading transactions…</span>
          </div>
        ) : filteredTx.length === 0 ? (
          <div className="tx-empty-state">
            <span className="tx-empty-emoji">💸</span>
            <p>No transactions yet</p>
            <span>Add your first transaction using the form on the left.</span>
          </div>
        ) : (
          <div className="transactions-list">
            {filteredTx.map(tx => {
              const config = categoryConfigs[tx.category] || { icon: HelpCircle, bgClass: 'category-gray', label: tx.category }
              const IconComponent = config.icon
              const isPositive = tx.amount > 0
              const amountText = isPositive
                ? `+$${Math.abs(tx.amount).toFixed(2)}`
                : `-$${Math.abs(tx.amount).toFixed(2)}`

              return (
                <div key={tx._id || tx.id} className={`transaction-capsule ${config.bgClass}`}>

                  {/* Left Column: Icon & Details */}
                  <div className="tx-left-section">
                    <div className="tx-icon-container">
                      <IconComponent size={18} />
                    </div>

                    <div className="tx-meta-info">
                      <div className="tx-title-row">
                        <span className="tx-title">{tx.title}</span>
                        <span className={`tx-type-tag ${tx.type.toLowerCase()}`}>
                          {tx.type}
                        </span>
                      </div>
                      <span className="tx-subtitle">
                        {config.label} • {tx.time}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Amount */}
                  <div className="tx-right-section">
                    <span className={`tx-amount ${isPositive ? 'positive' : 'negative'}`}>
                      {amountText}
                    </span>
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
