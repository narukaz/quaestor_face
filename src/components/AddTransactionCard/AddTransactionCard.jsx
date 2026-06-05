import { useState } from 'react'
import { Car, Smartphone, ShoppingBag, Shirt, Tv, Coffee, Plus } from 'lucide-react'
import { api } from '../../api/api'
import './AddTransactionCard.css'

export default function AddTransactionCard({ onAddTransaction, budgetType, setBudgetType }) {
  const [title, setTitle] = useState('')
  const [amountVal, setAmountVal] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('transport')
  const [errorMsg, setErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSettling, setIsSettling] = useState(false)

  const categories = [
    { id: 'transport', label: 'Transport', icon: Car, colorClass: 'cat-coral' },
    { id: 'tech', label: 'Technology', icon: Smartphone, colorClass: 'cat-purple' },
    { id: 'grocery', label: 'Grocery', icon: ShoppingBag, colorClass: 'cat-mint' },
    { id: 'fashion', label: 'Fashion', icon: Shirt, colorClass: 'cat-pink' },
    { id: 'entertainment', label: 'Entertainment', icon: Tv, colorClass: 'cat-indigo' },
    { id: 'food', label: 'Food', icon: Coffee, colorClass: 'cat-yellow' }
  ]

  const handleAmountChange = (e) => {
    const val = e.target.value
    setAmountVal(val)

    if (val === '') {
      setErrorMsg('')
      return
    }

    // Validation: Check if they try to enter any letter
    // If letters are found, show error
    if (/[a-zA-Z]/g.test(val)) {
      setErrorMsg("Math don't understand gibrish")
    } else {
      setErrorMsg('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return

    // Final validation
    if (!amountVal || parseFloat(amountVal) === 0 || isNaN(parseFloat(amountVal))) {
      setErrorMsg('Please enter a valid amount')
      return
    }

    if (/[a-zA-Z]/g.test(amountVal)) {
      setErrorMsg("Math don't understand gibrish")
      return
    }

    setIsSubmitting(true)

    try {
      // If user typed '+' prefix, make it positive (income), otherwise default to negative (expense)
      const numAmount = amountVal.startsWith('+')
        ? Math.abs(parseFloat(amountVal))
        : -Math.abs(parseFloat(amountVal))

      const description = title.trim() || categories.find(c => c.id === selectedCategory).label
      const expenseType = budgetType === 'Family' ? 'shared' : 'personal'

      const data = await api.addExpense({
        description,
        amount: numAmount,
        category: selectedCategory,
        type: expenseType
      })

      const saved = data.expense
      const newTx = {
        _id: saved._id,
        title: saved.description,
        category: saved.category,
        type: budgetType,
        amount: saved.amount,
        time: 'Today, ' + new Date(saved.date || Date.now()).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      }

      onAddTransaction(newTx)

      // Reset form
      setTitle('')
      setAmountVal('')
      setSelectedCategory('transport')
      setErrorMsg('')
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add transaction.')
    } finally {
      setIsSubmitting(false)
      // Trigger spring-back settle animation
      setIsSettling(true)
      setTimeout(() => setIsSettling(false), 500)
    }
  }

  return (
    <div className="add-tx-card">
      <div className="add-tx-header">
        <h3 className="add-tx-title">Add Transaction</h3>
        <div className="add-tx-scope-selector">
          <button
            type="button"
            className={`scope-tag ${budgetType === 'Personal' ? 'active' : ''}`}
            onClick={() => setBudgetType('Personal')}
            disabled={isSubmitting}
          >
            Personal
          </button>
          <button
            type="button"
            className={`scope-tag ${budgetType === 'Family' ? 'active' : ''}`}
            onClick={() => setBudgetType('Family')}
            disabled={isSubmitting}
          >
            Family
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="add-tx-form">
        
        {/* Merchant/Title Input */}
        <div className="form-group">
          <input
            type="text"
            className="form-input text-input"
            placeholder="Merchant (e.g. Uber, Apple, Starbucks)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {/* Amount Input */}
        <div className="form-group">
          <div className="amount-input-wrapper">
            <input
              type="text"
              className={`form-input amount-input ${errorMsg ? 'input-error' : ''}`}
              placeholder="$0.00"
              value={amountVal}
              onChange={handleAmountChange}
              disabled={isSubmitting}
            />
          </div>
          {errorMsg && (
            <span className="error-message-text">{errorMsg}</span>
          )}
        </div>

        {/* Category Picker */}
        <div className="form-group categories-section">
          <label className="form-label">Category</label>
          <div className="categories-grid">
            {categories.map(cat => {
              const Icon = cat.icon
              const isSelected = selectedCategory === cat.id
              return (
                <button
                  type="button"
                  key={cat.id}
                  className={`category-pill-btn ${cat.colorClass} ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                  disabled={isSubmitting}
                >
                  <Icon size={14} className="cat-pill-icon" />
                  <span>{cat.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Big Circular Submit Button */}
        <div className="submit-section">
          <button
            type="submit"
            className={`submit-circle-btn ${isSubmitting ? 'submitting' : ''}`}
            disabled={isSubmitting || !!errorMsg || !amountVal}
            title="Add Transaction"
          >
            <Plus
              size={24}
              className={`plus-icon ${isSubmitting ? 'spinning' : isSettling ? 'settling' : ''}`}
            />
          </button>
        </div>

      </form>
    </div>
  )
}
